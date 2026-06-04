function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0f0f13',
      color: 'white',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
        🔍 Duplicate Photo Finder
      </h1>
      <p style={{ color: '#888' }}>
        Find and remove duplicate photos from your computer
      </p>
    </div>
  )
}

export default App