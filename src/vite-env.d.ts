/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    openFolder: () => Promise<string[]>
    startScan: (
      folders: string[],
      includeSubfolders: boolean,
      scanType: string,
      similarityThreshold: number
    ) => Promise<any[]>
    onScanProgress: (callback: (data: { current: number, total: number, file: string }) => void) => void
    removeScanProgressListener: () => void
    moveToQuarantine: (paths: string[]) => Promise<string[]>
  }
}