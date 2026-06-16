import { useState } from 'react'

type OrganiseStatus = 'idle' | 'scanning' | 'organising' | 'done' | 'error'
type OrganiseMode = 'move' | 'copy'

interface OrganiseResult {
  organised: number
  skipped: number
  errors: number
}

function OrganisePage() {
  const [sourceFolder, setSourceFolder] = useState('')
  const [destFolder, setDestFolder] = useState('')
  const [mode, setMode] = useState<OrganiseMode>('copy')
  const [includeSubfolders, setIncludeSubfolders] = useState(true)
  const [status, setStatus] = useState<OrganiseStatus>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0, file: '' })
  const [result, setResult] = useState<OrganiseResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const pickSourceFolder = async () => {
    const paths = await window.electronAPI.openFolder()
    if (paths.length > 0) setSourceFolder(paths[0])
  }

  const pickDestFolder = async () => {
    const paths = await window.electronAPI.openFolder()
    if (paths.length > 0) setDestFolder(paths[0])
  }

  const startOrganise = async () => {
    if (!sourceFolder) {
      alert('Please select a source folder.')
      return
    }
    if (!destFolder) {
      alert('Please select a destination folder.')
      return
    }
    if (sourceFolder === destFolder) {
      alert('Source and destination folders must be different.')
      return
    }

    setStatus('organising')
    setResult(null)
    setErrorMsg('')

    try {
      window.electronAPI.onOrganiseProgress((data) => {
        setProgress(data)
      })

      const result = await window.electronAPI.organisePhotos(
        sourceFolder,
        destFolder,
        mode,
        includeSubfolders
      )

      window.electronAPI.removeOrganiseProgressListener()
      setResult(result)
      setStatus('done')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred')
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setResult(null)
    setErrorMsg('')
    setProgress({ current: 0, total: 0, file: '' })
  }

  const percent = progress.total === 0 ? 0 : Math.round((progress.current / progress.total) * 100)

  if (status === 'organising') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '24px',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid #2a2a3a',
          borderTop: '4px solid #6c63ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
            Organising Photos...
          </div>
          <div style={{ color: '#888', fontSize: '0.85rem' }}>
            {progress.current} of {progress.total} files processed
          </div>
        </div>
        <div style={{ width: '400px', maxWidth: '90%' }}>
          <div style={{
            background: '#2a2a3a',
            borderRadius: '99px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}>
            <div style={{
              height: '100%',
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #6c63ff, #4ecdc4)',
              borderRadius: '99px',
              transition: 'width 0.2s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#555',
          }}>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '300px',
            }}>
              {progress.file.split('\\').pop()}
            </span>
            <span>{percent}%</span>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'done' && result) {
    return (
      <div style={{ maxWidth: '500px' }}>
        <div style={{
          background: '#1a2a1a',
          border: '1px solid #2a4a2a',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✅</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#4ecdc4' }}>
            Organisation Complete!
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#888' }}>Photos organised</span>
              <span style={{ color: '#4ecdc4', fontWeight: 700 }}>{result.organised}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#888' }}>Skipped (no date info)</span>
              <span style={{ color: '#f9ca24', fontWeight: 700 }}>{result.skipped}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#888' }}>Errors</span>
              <span style={{ color: '#ff6b6b', fontWeight: 700 }}>{result.errors}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '16px' }}>
            Photos have been {mode === 'copy' ? 'copied' : 'moved'} to <strong style={{ color: '#888' }}>{destFolder}</strong> organised by Year → Month.
          </p>
        </div>
        <button
          onClick={reset}
          style={{
            width: '100%',
            padding: '12px',
            background: '#2a2a3f',
            border: '1px solid #4a4a6a',
            borderRadius: '8px',
            color: '#ccc',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          📂 Organise Another Folder
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ maxWidth: '500px' }}>
        <div style={{
          background: '#2a1a1a',
          border: '1px solid #4a2a2a',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>❌</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#ff6b6b' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#888' }}>{errorMsg}</p>
        </div>
        <button
          onClick={reset}
          style={{
            width: '100%',
            padding: '12px',
            background: '#2a2a3f',
            border: '1px solid #4a4a6a',
            borderRadius: '8px',
            color: '#ccc',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Source Folder */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#ccc' }}>
          📁 Source Folder
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px' }}>
          The folder containing photos you want to organise.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1,
            padding: '10px 14px',
            background: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#888',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {sourceFolder || 'No folder selected'}
          </div>
          <button
            onClick={pickSourceFolder}
            style={{
              padding: '10px 16px',
              background: '#2a2a3f',
              border: '1px solid #4a4a6a',
              borderRadius: '8px',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            Browse...
          </button>
        </div>
      </section>

      {/* Destination Folder */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#ccc' }}>
          📂 Destination Folder
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '12px' }}>
          Where organised photos will be placed. Year and month subfolders will be created automatically.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1,
            padding: '10px 14px',
            background: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#888',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {destFolder || 'No folder selected'}
          </div>
          <button
            onClick={pickDestFolder}
            style={{
              padding: '10px 16px',
              background: '#2a2a3f',
              border: '1px solid #4a4a6a',
              borderRadius: '8px',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            Browse...
          </button>
        </div>
        {destFolder && (
          <div style={{
            marginTop: '10px',
            padding: '10px 14px',
            background: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: '#555',
          }}>
            📁 {destFolder}\2024\January\photo.jpg
          </div>
        )}
      </section>

      {/* Mode */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: '#ccc' }}>
          ⚙️ Mode
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { id: 'copy', label: '📋 Copy', desc: 'Keep originals in place' },
            { id: 'move', label: '✂️ Move', desc: 'Remove from source folder' },
          ].map(option => (
            <button
              key={option.id}
              onClick={() => setMode(option.id as OrganiseMode)}
              style={{
                flex: 1,
                padding: '14px 10px',
                background: mode === option.id ? '#2a2a3f' : '#1a1a24',
                border: mode === option.id ? '1px solid #6c63ff' : '1px solid #2a2a3a',
                borderRadius: '8px',
                color: mode === option.id ? '#fff' : '#666',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{option.label}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#888' }}>{option.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Include Subfolders */}
      <section>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          color: '#aaa',
          fontSize: '0.9rem',
        }}>
          <input
            type="checkbox"
            checked={includeSubfolders}
            onChange={e => setIncludeSubfolders(e.target.checked)}
            style={{ accentColor: '#6c63ff', width: '16px', height: '16px' }}
          />
          Include subfolders
        </label>
      </section>

      {/* Start Button */}
      <button
        onClick={startOrganise}
        style={{
          width: '100%',
          padding: '16px',
          background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)',
          border: 'none',
          borderRadius: '10px',
          color: 'white',
          fontSize: '1.1rem',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.5px',
        }}
      >
        📂 Start Organising
      </button>

    </div>
  )
}

export default OrganisePage
