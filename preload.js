const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('senacDesktop', {
    isDesktop: true,
    getPathForFile: (file) => webUtils.getPathForFile(file),
    basename: filePath => String(filePath || '').split(/[\\/]/).pop() || '',
    locateFrequencyFile: turma => ipcRenderer.invoke('senac:locate-frequency', turma),
    scanDropoutDocuments: (turma, studentNames) => ipcRenderer.invoke('senac:scan-dropout-documents', turma, studentNames),
    scanFrequencyClasses: () => ipcRenderer.invoke('senac:scan-frequency-classes'),
    startAutomaticNetworkSync: () => ipcRenderer.invoke('senac:start-automatic-network-sync'),
    completeAutomaticNetworkSync: result => ipcRenderer.send('senac:automatic-network-sync-complete', result || {}),
    onFrequencyScanProgress: callback => {
        const listener = (_event, progress) => callback(progress);
        ipcRenderer.on('senac:scan-frequency-progress', listener);
        return () => ipcRenderer.removeListener('senac:scan-frequency-progress', listener);
    },
    stat: filePath => ipcRenderer.invoke('senac:stat-file', filePath),
    readFile: filePath => ipcRenderer.invoke('senac:read-file', filePath)
});
