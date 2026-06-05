"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  openFolder: () => electron.ipcRenderer.invoke("dialog:openFolder"),
  startScan: (folders, includeSubfolders, scanType, similarityThreshold) => electron.ipcRenderer.invoke("scan:start", folders, includeSubfolders, scanType, similarityThreshold),
  onScanProgress: (callback) => electron.ipcRenderer.on("scan:progress", (_event, data) => callback(data)),
  removeScanProgressListener: () => electron.ipcRenderer.removeAllListeners("scan:progress"),
  moveToQuarantine: (paths) => electron.ipcRenderer.invoke("files:moveToQuarantine", paths),
  getMachineFingerprint: () => electron.ipcRenderer.invoke("machine:fingerprint"),
  activateMachine: (licenceKey, accountId, licenceId) => electron.ipcRenderer.invoke("machine:activate", licenceKey, accountId, licenceId),
  validateMachine: (licenceKey, accountId) => electron.ipcRenderer.invoke("machine:validate", licenceKey, accountId),
  onUpdaterEvent: (callback) => {
    electron.ipcRenderer.on("updater:available", (_e, data) => callback("updater:available", data));
    electron.ipcRenderer.on("updater:progress", (_e, data) => callback("updater:progress", data));
    electron.ipcRenderer.on("updater:downloaded", (_e) => callback("updater:downloaded", null));
  },
  installUpdate: () => electron.ipcRenderer.invoke("updater:install")
});
