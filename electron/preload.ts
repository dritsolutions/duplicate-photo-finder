import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  startScan: (
    folders: string[],
    includeSubfolders: boolean,
    scanType: string,
    similarityThreshold: number
  ) => ipcRenderer.invoke('scan:start', folders, includeSubfolders, scanType, similarityThreshold),
  onScanProgress: (callback: (data: { current: number, total: number, file: string }) => void) =>
    ipcRenderer.on('scan:progress', (_event, data) => callback(data)),
  removeScanProgressListener: () =>
    ipcRenderer.removeAllListeners('scan:progress'),
  moveToQuarantine: (paths: string[]) =>
    ipcRenderer.invoke('files:moveToQuarantine', paths),
  getMachineFingerprint: () => ipcRenderer.invoke('machine:fingerprint'),
  activateMachine: (licenceKey: string, accountId: string, licenceId: string) =>
    ipcRenderer.invoke('machine:activate', licenceKey, accountId, licenceId),
  validateMachine: (licenceKey: string, accountId: string) =>
    ipcRenderer.invoke('machine:validate', licenceKey, accountId),
})