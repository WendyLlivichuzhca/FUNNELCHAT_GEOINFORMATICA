import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Contactos from './pages/Contactos';
import Chats from './pages/Chats';
import Flujos from './pages/Flujos';
import Difusion from './pages/Difusion';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = (newToken, user) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', user);
    setToken(newToken);
    setUsername(user);
    setIsRegistering(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
  };

  if (!token) {
    if (isRegistering) {
      return <RegisterPage
        onRegisterSuccess={() => setIsRegistering(false)}
        onSwitchToLogin={() => setIsRegistering(false)}
      />;
    }
    return <LoginPage
      onLogin={handleLogin}
      onSwitchToRegister={() => setIsRegistering(true)}
    />;
  }

  return (
    <Router>
      <div style={{
        display: 'flex',
        width: '100%',
        backgroundColor: 'var(--bg-base)',
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden'
      }}>
        {/* Capa de Ruido Global */}
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          opacity: 0.03, pointerEvents: 'none', zIndex: 1,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3Y%3Cfilter id='noiseFilter'%3Y%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3Y%3C/filter%3Y%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3Y%3C/svg%3Y")`
        }} />

        {/* Glows Ambientales */}
        <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: '600px', height: '600px', background: 'rgba(124, 58, 237, 0.08)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-5%', right: '-5%', width: '400px', height: '400px', background: 'rgba(16, 217, 160, 0.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: '30%', right: '-5%', width: '300px', height: '300px', background: 'rgba(236, 72, 153, 0.04)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />

        <Sidebar username={username} onLogout={handleLogout} />

        <main style={{
          flex: 1,
          marginLeft: '260px',
          padding: '40px 60px',
          minHeight: '100vh',
          backgroundColor: 'transparent',
          position: 'relative',
          zIndex: 2
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contactos" element={<Contactos />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/flujos" element={<Flujos />} />
            <Route path="/difusion" element={<Difusion />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
