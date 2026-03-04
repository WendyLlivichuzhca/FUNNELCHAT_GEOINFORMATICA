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
      <div style={{ display: 'flex', width: '100%' }}>
        <Sidebar username={username} onLogout={handleLogout} />
        <main style={{
          flex: 1,
          marginLeft: '260px',
          padding: '32px',
          minHeight: '100vh',
          background: 'radial-gradient(circle at top right, #1e293b, #0f172a)'
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
