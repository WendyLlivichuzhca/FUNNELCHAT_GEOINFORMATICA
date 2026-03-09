import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

const LoginPage = ({ onLogin, onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('http://127.0.0.1:8000/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                onLogin(data.access_token, username);
            } else {
                const data = await response.json();
                setError(data.detail || 'Error al iniciar sesión');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at top right, #1e1b4b, #020617)', padding: '20px'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: '450px', padding: '40px',
                border: '1px solid rgba(255,255,255,0.1)',
                animation: 'fade-in 0.6s ease-out'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'var(--primary-gradient)',
                        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
                    }}>
                        <ShieldCheck size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Bienvenido</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Inicia sesión en tu Funnel Chat</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="input-field">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Usuario</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Tu nombre de usuario"
                                required
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', color: 'white', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="input-field">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px', color: 'white', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '14px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            padding: '14px', fontSize: '16px', fontWeight: '600'
                        }}
                    >
                        {loading ? 'Entrando...' : (
                            <>
                                <LogIn size={20} /> Entrar ahora
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                        ¿No tienes una cuenta? {' '}
                        <span
                            onClick={onSwitchToRegister}
                            style={{ color: '#818cf8', fontWeight: '600', cursor: 'pointer', borderBottom: '1px solid #818cf8' }}
                        >
                            Regístrate gratis
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
