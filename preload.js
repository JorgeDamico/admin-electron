const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => fs.readFileSync(filePath, 'utf8'),
  writeFile: (filePath, content) => fs.writeFileSync(filePath, content, 'utf8'),
  existsFile: (filePath) => fs.existsSync(filePath),
  joinPath: (...args) => path.join(...args),
  getUserDir: () => os.homedir(),
  createFolderIfMissing: (folderName) => {
    const userDir = os.homedir();
    const fullPath = path.join(userDir, folderName);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
    }
    return fullPath;
  }
});
