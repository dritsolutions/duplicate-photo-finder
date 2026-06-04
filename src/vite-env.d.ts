/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    openFolder: () => Promise<string[]>
  }
}