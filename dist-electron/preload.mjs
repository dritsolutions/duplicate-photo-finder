"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  openFolder: () => electron.ipcRenderer.invoke("dialog:openFolder"),
  startScan: (folders, includeSubfolders, scanType, similarityThreshold) => electron.ipcRenderer.invoke("scan:start", folders, includeSubfolders, scanType, similarityThreshold),
  onScanProgress: (callback) => electron.ipcRenderer.on("scan:progress", (_event, data) => callback(data)),
  removeScanProgressListener: () => electron.ipcRenderer.removeAllListeners("scan:progress")
});
