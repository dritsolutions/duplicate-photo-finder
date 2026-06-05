import { useState, useEffect } from 'react'

function UpdateNotification() {
  const [status, setStatus] = useState<'idle' | 'available' | 'downloading' | 'downloaded'>('idle')
  const [progress, setProgress] = useState(0)
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.electronAPI.onUpdaterEvent((event, data) => {
      if (event === 'updater:available') {
        setStatus('available')
        setVersion(data?.version || '')
      } else if (event === 'updater:progress') {
        setStatus('downloading')
        setProgress(Math.round(data?.percent || 0))
      } else if (event === 'updater:downloaded') {
        setStatus('downloaded')
      }
    })
  }, [])

  if (status === 'idle') return null

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
      {status === 'available' && (
        <>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>
            🆕 Update Available
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '12px' }}>
            Version {version} is downloading automatically.
          </div>
          <div style={{ fontSize: '0.75rem', color: '#555' }}>
            You'll be notified when it's ready to install.
          </div>
        </>
      )}

      {status === 'downloading' && (
        <>
          <div style={{ fontWeight: 700, marginBottom: '8px' }}>
            ⬇️ Downloading Update... {progress}%
          </div>
          <div style={{
            background: '#2a2a3a',
            borderRadius: '99px',
            height: '6px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6c63ff, #4ecdc4)',
              borderRadius: '99px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </>
      )}

      {status === 'downloaded' && (
        <>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>
            ✅ Update Ready
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '12px' }}>
            Restart the app to apply the update.
          </div>
          <button
            onClick={() => window.electronAPI.installUpdate()}
            style={{
              width: '100%',
              padding: '8px',
              background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Restart & Install
          </button>
        </>
      )}
    </div>
  )
}

export default UpdateNotification