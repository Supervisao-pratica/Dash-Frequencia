const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('senacDesktop', {
    isDesktop: true,
    getPathForFile: (file) => webUtils.getPathForFile(file),
    basename: filePath => String(filePath || '').split(/[\\/]/).pop() || '',
    locateFrequencyFile: turma => ipcRenderer.invoke('senac:locate-frequency', turma),
    scanDropoutDocuments: (turma, studentNames) => ipcRenderer.invoke('senac:scan-dropout-documents', turma, studentNames),
    stat: filePath => ipcRenderer.invoke('senac:stat-file', filePath),
    readFile: filePath => ipcRenderer.invoke('senac:read-file', filePath)
});
