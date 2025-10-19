export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        🚀 Next.js работает!
      </h1>
      <p style={{ color: '#555' }}>Добро пожаловать в твой AI Backend 👇</p>
      <a
        href="/upload"
        style={{
          marginTop: '2rem',
          background: 'black',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          textDecoration: 'none',
        }}
      >
        Перейти к загрузке
      </a>
    </main>
  );
}

