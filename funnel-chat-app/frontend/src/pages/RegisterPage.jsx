import React, { useState } from 'react';
import { User, Lock, Mail, UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react';

const RegisterPage = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                alert('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
                onRegisterSuccess();
            } else {
                const data = await response.json();
                setError(data.detail || 'Error al registrarse');
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
            background: 'radial-gradient(circle at bottom left, #1e1b4b, #020617)', padding: '20px'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: '450px', padding: '40px',
                border: '1px solid rgba(255,255,255,0.1)',
                animation: 'fade-in 0.6s ease-out'
            }}>
                <div
                    onClick={onSwitchToLogin}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)',
                        fontSize: '14px', cursor: 'pointer', marginBottom: '24px', transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                    <ArrowLeft size={16} /> Volver al login
                </div>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Crea tu Cuenta</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Únete a la mejor plataforma de Funnel Chat</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="input-field">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Usuario</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nombre de usuario"
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
                                placeholder="Crea una contraseña segura"
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
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Confirmar Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite tu contraseña"
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
                            padding: '14px', fontSize: '16px', fontWeight: '600',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                        }}
                    >
                        {loading ? 'Creando cuenta...' : (
                            <>
                                <UserPlus size={20} /> Registrarme
                            </>
                        )}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginTop: '10px', opacity: 0.6 }}>
                        <ShieldCheck size={14} color="#10b981" />
                        <span style={{ fontSize: '12px' }}>Datos cifrados de extremo a extremo</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
