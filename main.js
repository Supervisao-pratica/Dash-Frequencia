const { app, BrowserWindow, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

app.setAppUserModelId('br.senacpr.dashboardfrequencia');

let mainWindow = null;
let updateCheckTimer = null;
let updatePromptOpen = false;

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
    if (process.platform !== 'darwin') app.quit();
});
