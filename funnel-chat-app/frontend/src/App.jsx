import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Contactos from './pages/Contactos';
import Chats from './pages/Chats';
import Flujos from './pages/Flujos';
import Difusion from './pages/Difusion';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', width: '100%' }}>
        <Sidebar />
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
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
