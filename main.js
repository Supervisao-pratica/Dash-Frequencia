const { app, BrowserWindow, dialog, Notification, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');
const { locateFrequencyFile, scanDropoutDocuments, scanFrequencyClasses } = require('./frequency-locator');

app.setAppUserModelId('br.senacpr.dashboardfrequencia');

let mainWindow = null;
let updateCheckTimer = null;
let updatePromptOpen = false;
let backgroundNetworkSyncWindow = null;
let backgroundNetworkSyncTimer = null;
let backgroundNetworkSyncTimeout = null;
const BACKGROUND_NETWORK_SYNC_INTERVAL = 2 * 60 * 60 * 1000;
const BACKGROUND_NETWORK_SYNC_TIMEOUT = 20 * 60 * 1000;

ipcMain.handle('senac:stat-file', async (_event, filePath) => {
    const value = await fs.promises.stat(String(filePath || ''));
    return { mtimeMs: Number(value.mtimeMs || 0) };
});

ipcMain.handle('senac:read-file', async (_event, filePath) => {
    const buffer = await fs.promises.readFile(String(filePath || ''));
    return new Uint8Array(buffer);
});

ipcMain.handle('senac:locate-frequency', async (_event, turma) => locateFrequencyFile(turma));
ipcMain.handle('senac:scan-dropout-documents', async (_event, turma, studentNames) => scanDropoutDocuments(turma, studentNames));
ipcMain.handle('senac:scan-frequency-classes', async event => scanFrequencyClasses({
    years: [2025, 2026],
    onProgress: progress => event.sender.send('senac:scan-frequency-progress', progress)
}));

function scheduleBackgroundNetworkSync() {
    if (backgroundNetworkSyncTimer) clearTimeout(backgroundNetworkSyncTimer);
    backgroundNetworkSyncTimer = setTimeout(() => startBackgroundNetworkSync(), BACKGROUND_NETWORK_SYNC_INTERVAL);
}

function finishBackgroundNetworkSync() {
    if (backgroundNetworkSyncTimeout) clearTimeout(backgroundNetworkSyncTimeout);
    backgroundNetworkSyncTimeout = null;
    const scanWindow = backgroundNetworkSyncWindow;
    backgroundNetworkSyncWindow = null;
    if (scanWindow && !scanWindow.isDestroyed()) scanWindow.close();
    scheduleBackgroundNetworkSync();
}

function startBackgroundNetworkSync() {
    if (backgroundNetworkSyncWindow && !backgroundNetworkSyncWindow.isDestroyed()) return { started: false, reason: 'already-running' };
    if (backgroundNetworkSyncTimer) clearTimeout(backgroundNetworkSyncTimer);
    backgroundNetworkSyncTimer = null;
    const scanWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false
        }
    });
    backgroundNetworkSyncWindow = scanWindow;
    scanWindow.loadFile('Dashboard_V76.html', { query: { perfil: 'instrutor', scan: 'network', background: '1' } });
    scanWindow.on('closed', () => {
        if (backgroundNetworkSyncWindow === scanWindow) {
            backgroundNetworkSyncWindow = null;
            if (backgroundNetworkSyncTimeout) clearTimeout(backgroundNetworkSyncTimeout);
            backgroundNetworkSyncTimeout = null;
            scheduleBackgroundNetworkSync();
        }
    });
    backgroundNetworkSyncTimeout = setTimeout(() => finishBackgroundNetworkSync(), BACKGROUND_NETWORK_SYNC_TIMEOUT);
    return { started: true };
}

ipcMain.handle('senac:start-automatic-network-sync', () => startBackgroundNetworkSync());
ipcMain.on('senac:automatic-network-sync-complete', event => {
    if (backgroundNetworkSyncWindow && event.sender === backgroundNetworkSyncWindow.webContents) finishBackgroundNetworkSync();
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280, height: 800,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.loadFile('Dashboard_V76.html');
    mainWindow.maximize();
    mainWindow.removeMenu();
    mainWindow.on('closed', () => { mainWindow = null; });
}

function showUpdateNotification(version) {
    if (!Notification.isSupported()) return;
    new Notification({
        title: 'Dashboard Senac',
        body: `A versão ${version} está sendo baixada em segundo plano.`
    }).show();
}

function configureAutoUpdates() {
    if (!app.isPackaged) return;

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('update-available', info => {
        showUpdateNotification(info.version);
    });

    autoUpdater.on('update-downloaded', async info => {
        if (updatePromptOpen) return;
        updatePromptOpen = true;
        const options = {
            type: 'info',
            title: 'Atualização pronta',
            message: `A versão ${info.version} do Dashboard Senac foi baixada.`,
            detail: 'Reinicie agora para concluir a atualização. Se escolher Depois, ela será instalada quando o aplicativo for fechado.',
            buttons: ['Reiniciar e instalar', 'Depois'],
            defaultId: 0,
            cancelId: 1,
            noLink: true
        };
        const result = mainWindow
            ? await dialog.showMessageBox(mainWindow, options)
            : await dialog.showMessageBox(options);
        updatePromptOpen = false;
        if (result.response === 0) autoUpdater.quitAndInstall(false, true);
    });

    autoUpdater.on('error', error => {
        console.error('Não foi possível verificar ou instalar a atualização automática.', error);
    });

    const checkForUpdates = () => {
        autoUpdater.checkForUpdates().catch(error => {
            console.error('Falha ao consultar atualizações.', error);
        });
    };

    setTimeout(checkForUpdates, 12000);
    updateCheckTimer = setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
}

app.whenReady().then(() => {
    createWindow();
    configureAutoUpdates();
});

app.on('window-all-closed', () => {
    if (updateCheckTimer) clearInterval(updateCheckTimer);
    if (backgroundNetworkSyncTimer) clearTimeout(backgroundNetworkSyncTimer);
    if (backgroundNetworkSyncTimeout) clearTimeout(backgroundNetworkSyncTimeout);
    if (process.platform !== 'darwin') app.quit();
});
