import { Menu } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { scanFolders } from './scanner'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

const CURRENT_VERSION = '1.0.1'
const GITHUB_RELEASES_URL = 'https://github.com/dritsolutions/duplicate-photo-finder/releases/latest'
const GITHUB_API_URL = 'https://api.github.com/repos/dritsolutions/duplicate-photo-finder/releases/latest'

let win: BrowserWindow | null

function getMachineFingerprint(): string {
  const data = `${os.hostname()}-${os.cpus()[0]?.model}-${os.platform()}`
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 32)
}

async function checkForUpdates() {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: { 'User-Agent': 'duplicate-photo-finder' }
    })
    const data = await response.json() as any
    const latestVersion = (data.tag_name || '').replace('v', '')
    if (latestVersion && latestVersion !== CURRENT_VERSION) {
      win?.webContents.send('updater:available', {
        version: latestVersion,
        url: GITHUB_RELEASES_URL
      })
    }
  } catch (err) {
    console.error('Update check failed:', err)
  }
}

function createWindow() {
  Menu.setApplicationMenu(null)
  win = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: false,
    },
    titleBarStyle: 'default',
    title: 'Duplicate Photo Finder',
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Allow dev tools with F12
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F12') {
      win?.webContents.openDevTools()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Check for updates after window loads
  if (!VITE_DEV_SERVER_URL) {
    setTimeout(checkForUpdates, 5000)
  }
}

// Manual update check
ipcMain.handle('updater:check', async () => {
  await checkForUpdates()
})

// Open browser to download update
ipcMain.handle('updater:download', () => {
  shell.openExternal(GITHUB_RELEASES_URL)
})

// Handle folder picker dialog
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory', 'multiSelections'],
    title: 'Select folders to scan',
  })
  if (result.canceled) return []
  return result.filePaths
})

// Handle scan
ipcMain.handle('scan:start', async (_event, folders, includeSubfolders, scanType, similarityThreshold) => {
  const results = await scanFolders(
    folders,
    includeSubfolders,
    scanType,
    similarityThreshold,
    (current, total, file) => {
      win?.webContents.send('scan:progress', { current, total, file })
    }
  )
  return results
})

// Handle move to quarantine
ipcMain.handle('files:moveToQuarantine', async (_event, paths: string[]) => {
  const quarantineDir = path.join(os.homedir(), 'Pictures', 'DupeFinder-Quarantine')
  if (!fs.existsSync(quarantineDir)) {
    fs.mkdirSync(quarantineDir, { recursive: true })
  }
  const moved: string[] = []
  for (const filePath of paths) {
    try {
      const filename = path.basename(filePath)
      const dest = path.join(quarantineDir, filename)
      fs.renameSync(filePath, dest)
      moved.push(filePath)
    } catch {
      // skip files that can't be moved
    }
  }
  return moved
})

// Get machine fingerprint
ipcMain.handle('machine:fingerprint', () => {
  return getMachineFingerprint()
})

// Activate machine with Keygen
ipcMain.handle('machine:activate', async (_event, licenceKey: string, accountId: string, licenceId: string) => {
  const fingerprint = getMachineFingerprint()
  const response = await fetch(
    `https://api.keygen.sh/v1/accounts/${accountId}/machines`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'Authorization': `License ${licenceKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'machines',
          attributes: {
            fingerprint,
            name: os.hostname(),
            platform: os.platform(),
          },
          relationships: {
            license: {
              data: { type: 'licenses', id: licenceId }
            }
          }
        }
      }),
    }
  )
  const data = await response.json()
  return { status: response.status, data }
})

// Validate machine with Keygen
ipcMain.handle('machine:validate', async (_event, licenceKey: string, accountId: string) => {
  const fingerprint = getMachineFingerprint()
  const response = await fetch(
    `https://api.keygen.sh/v1/accounts/${accountId}/licenses/actions/validate-key`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        meta: {
          key: licenceKey,
          scope: { fingerprint }
        }
      }),
    }
  )
  const data = await response.json()
  return { status: response.status, data }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
