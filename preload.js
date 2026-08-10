const { contextBridge, webUtils } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('senacDesktop', {
    isDesktop: true,
    getPathForFile: (file) => webUtils.getPathForFile(file),
    basename: (filePath) => path.basename(String(filePath || '')),
    stat: async (filePath) => {
        const value = await fs.promises.stat(String(filePath || ''));
        return { mtimeMs: Number(value.mtimeMs || 0) };
    },
    readFile: async (filePath) => {
        const buffer = await fs.promises.readFile(String(filePath || ''));
        return new Uint8Array(buffer);
    }
});
