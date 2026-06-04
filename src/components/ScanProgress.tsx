interface ScanProgressProps {
  current: number
  total: number
  currentFile: string
}

function ScanProgress({ current, total, currentFile }: ScanProgressProps) {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100)
  const filename = currentFile.split('\\').pop() || currentFile

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '24px',
    }}>
      {/* Spinner */}
      <div style={{
        width: '64px',
        height: '64px',
        border: '4px solid #2a2a3a',
        borderTop: '4px solid #6c63ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
          Scanning Photos...
        </div>
        <div style={{ color: '#888', fontSize: '0.85rem' }}>
          {current} of {total} files processed
        </div>
      </div>

      {/* Progress Bar */}
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
            {filename}
          </span>
          <span>{percent}%</span>
        </div>
      </div>
    </div>
  )
}
export default ScanProgress
