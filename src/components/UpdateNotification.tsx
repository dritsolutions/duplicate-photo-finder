import { useState, useEffect } from 'react'

const CURRENT_VERSION = '1.0.2'
const GITHUB_API_URL = 'https://api.github.com/repos/dritsolutions/duplicate-photo-finder/releases/latest'
const GITHUB_RELEASES_URL = 'https://github.com/dritsolutions/duplicate-photo-finder/releases/latest'

function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch(GITHUB_API_URL, {
          headers: { 'User-Agent': 'duplicate-photo-finder' }
        })
        const data = await response.json()
        const latestVersion = (data.tag_name || '').replace('v', '')
        if (latestVersion && latestVersion !== CURRENT_VERSION) {
          setUpdateInfo({ version: latestVersion })
        }
      } catch (err) {
        console.error('Update check failed:', err)
      }
    }

    // Check on startup after 5 seconds
    const timer = setTimeout(check, 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!updateInfo) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1a1a24',
      border: '1px solid #6c63ff',
      borderRadius: '10px',
      padding: '16px 20px',
      width: '300px',
      zIndex: 1000,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '6px' }}>
        🆕 Update Available
      </div>
      <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '12px' }}>
        Version {updateInfo.version} is now available.
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => window.electronAPI.downloadUpdate()}
          style={{
            flex: 1,
            padding: '8px',
            background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Download Update
        </button>
        <button
          onClick={() => setUpdateInfo(null)}
          style={{
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #2a2a3a',
            borderRadius: '6px',
            color: '#666',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Later
        </button>
      </div>
    </div>
  )
}

export default UpdateNotification