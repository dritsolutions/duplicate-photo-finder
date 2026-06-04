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
})