import LicencePage from './components/LicencePage'
import SettingsPage from './components/SettingsPage'
import ResultsPage from './components/ResultsPage'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ScanPage from './components/ScanPage'
import ScanProgress from './components/ScanProgress'

function App() {
  const [currentPage, setCurrentPage] = useState('scan')
  const [scanResults, setScanResults] = useState<any[]>([])
  const [scanProgress, setScanProgress] = useState({
    current: 0,
    total: 0,
    file: '',
  })

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: '#0f0f13',
      color: 'white',
    }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        {currentPage !== 'progress' && (
          <div style={{
            padding: '20px 28px',
            borderBottom: '1px solid #2a2a3a',
            background: '#1a1a24',
          }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 600 }}>
              {currentPage === 'scan' && '🔍 New Scan'}
              {currentPage === 'results' && '📋 Results'}
              {currentPage === 'settings' && '⚙️ Settings'}
              {currentPage === 'licence' && '🔑 Licence'}
            </h1>
          </div>
        )}

        {/* Page Content */}
        <div style={{
          flex: 1,
          padding: currentPage === 'progress' ? '0' : '28px',
          overflowY: 'auto',
        }}>
          {currentPage === 'scan' && (
            <ScanPage
              onScanComplete={(results) => setScanResults(results)}
              onScanStart={(progress) => setScanProgress(progress)}
              onNavigate={setCurrentPage}
            />
          )}
          {currentPage === 'progress' && (
            <ScanProgress
              current={scanProgress.current}
              total={scanProgress.total}
              currentFile={scanProgress.file}
            />
          )}
          {currentPage === 'results' && (
            <ResultsPage
              results={scanResults}
              onNewScan={() => setCurrentPage('scan')}
            />
          )}
          {currentPage === 'settings' && <SettingsPage />}
          {currentPage === 'licence' && <LicencePage />}
        </div>
      </div>
    </div>
  )
}

export default App