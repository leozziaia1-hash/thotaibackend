export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#0A0A0B',
      color: '#F8FAFC',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>ThotAI Backend</h1>
        <p style={{ color: '#94A3B8' }}>Conectado a Groq API</p>
      </div>
    </div>
  );
}
