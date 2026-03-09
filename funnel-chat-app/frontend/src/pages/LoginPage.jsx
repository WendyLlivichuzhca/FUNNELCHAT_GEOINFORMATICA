import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, LogIn, UserPlus, ShieldCheck, Zap, BarChart3, Rocket, MessageSquare, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config/api';

// --- Particle Background Component ---
const ParticleBackground = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: null, y: null });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const particles = [];
        const particleCount = 150;
        const colors = ['#0055ff', '#00aaff', '#0033cc', '#0088ff', '#00ccff', '#003399'];

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedY = Math.random() * -1 - 0.5;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX;

                if (this.y < 0) {
                    this.y = canvas.height;
                    this.x = Math.random() * canvas.width;
                }

                // Mouse interaction
                const dx = mouseRef.current.x - this.x;
                const dy = mouseRef.current.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    this.x -= dx * force * 0.05;
                    this.y -= dy * force * 0.05;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity;
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 80) {
                        ctx.beginPath();
                        ctx.strokeStyle = '#0066ff';
                        ctx.globalAlpha = (80 - distance) / 800;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
                particles[i].update();
                particles[i].draw();
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    );
};

// --- Main Page Component ---
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

            const response = await fetch(`${API_URL}/token`, {
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
            width: '100vw',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#020509',
            overflowX: 'hidden',
            padding: '60px 20px 120px'
        }}>
            {/* Styles for complex animations */}
            <style>
                {`
                    @keyframes grid-pulse {
                        0%, 100% { opacity: 0.04; }
                        50% { opacity: 0.08; }
                    }
                    @keyframes border-expand {
                        0% { transform: scaleX(0); opacity: 0; }
                        50% { transform: scaleX(1); opacity: 1; }
                        100% { transform: scaleX(0); opacity: 0; }
                    }
                    @keyframes text-gradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    @keyframes shimmer-fast {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    @keyframes pulse-ring {
                        0% { transform: scale(0.95); opacity: 0.5; }
                        50% { transform: scale(1.05); opacity: 0.2; }
                        100% { transform: scale(0.95); opacity: 0.5; }
                    }
                    @keyframes ticker-scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    @keyframes float-blob {
                        0%, 100% { transform: translate(0, 0); }
                        33% { transform: translate(30px, -50px); }
                        66% { transform: translate(-20px, 40px); }
                    }

                    .input-cyber {
                        background: rgba(14, 100, 255, 0.06) !important;
                        border: 1px solid rgba(0, 150, 255, 0.2) !important;
                        color: #e8f4ff !important;
                        border-radius: 13px;
                        width: 100%;
                        padding: 0 48px;
                        height: 54px;
                        font-size: 14px;
                        outline: none;
                        transition: all 0.3s;
                    }
                    .input-cyber:focus {
                        border-color: rgba(0, 180, 255, 0.55) !important;
                        background: rgba(14, 100, 255, 0.12) !important;
                        box-shadow: 0 0 0 3px rgba(0, 100, 255, 0.12) !important;
                        color: #ffffff !important;
                    }
                    .input-cyber::placeholder {
                        color: rgba(50, 90, 160, 0.6) !important;
                    }
                    .input-cyber:focus + .focus-line {
                        transform: scaleX(1) !important;
                    }
                    .btn-cyber:hover {
                        letter-spacing: 2px;
                        transform: translateY(-3px);
                    }
                    .stat-item:hover {
                        transform: translateY(-4px);
                        border-color: rgba(0, 150, 255, 0.4) !important;
                        background: rgba(14, 100, 255, 0.08) !important;
                    }
                `}
            </style>

            {/* Grid Background */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'linear-gradient(rgba(0,140,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,140,255,.04) 1px, transparent 1px)',
                backgroundSize: '44px 44px',
                animation: 'grid-pulse 4s infinite ease-in-out',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            {/* Corner Gradients */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '40vw', height: '40vh', background: 'radial-gradient(circle at 0% 0%, rgba(0, 102, 255, 0.15), transparent 70%)', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: 0, right: 0, width: '40vw', height: '40vh', background: 'radial-gradient(circle at 100% 100%, rgba(0, 204, 255, 0.1), transparent 70%)', zIndex: 0 }} />

            <ParticleBackground />

            {/* Main Cyber Card */}
            <div className="animate-fade-in-up" style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth: '520px',
                background: 'rgba(4, 12, 26, 0.82)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '32px',
                padding: '52px 50px 46px',
                backdropFilter: 'blur(60px)',
                boxShadow: '0 70px 160px rgba(0,0,0,.9), 0 0 0 1px rgba(14,100,255,.08) inset',
                overflow: 'hidden'
            }}>
                {/* Animated Top Border */}
                <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
                    background: 'linear-gradient(90deg, transparent, #0066ff, #fff, #0066ff, transparent)',
                    animation: 'border-expand 3s infinite ease-in-out'
                }} />

                {/* Corner Accents */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', borderTop: '2px solid rgba(0, 200, 255, 0.6)', borderRight: '2px solid rgba(0, 200, 255, 0.6)', borderRadius: '0 32px 0 0', boxShadow: '0 0 15px rgba(0, 200, 255, 0.3)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40px', height: '40px', borderBottom: '2px solid rgba(14, 100, 255, 0.6)', borderLeft: '2px solid rgba(14, 100, 255, 0.6)', borderRadius: '0 0 0 32px', boxShadow: '0 0 15px rgba(14, 100, 255, 0.3)' }} />

                {/* Internal Blobs */}
                <div style={{ position: 'absolute', top: '20%', left: '10%', width: '150px', height: '150px', background: 'rgba(0, 102, 255, 0.05)', filter: 'blur(40px)', borderRadius: '50%', animation: 'float-blob 10s infinite linear', zIndex: -1 }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '120px', height: '120px', background: 'rgba(0, 204, 255, 0.03)', filter: 'blur(30px)', borderRadius: '50%', animation: 'float-blob 8s infinite linear reverse', zIndex: -1 }} />

                {/* Header Content */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', background: 'rgba(14, 100, 255, 0.1)', borderRadius: '10px' }}>
                            <MessageSquare size={20} color="#0066ff" />
                        </div>
                        <span style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>Funnel Chat</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.08)', padding: '4px 10px', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Sistema Activo</span>
                    </div>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(0, 140, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '14px' }}>Plataforma CRM WhatsApp</p>
                    <h1 style={{ fontFamily: 'Syne', fontSize: '40px', fontWeight: '800', lineHeight: 1.1, color: '#f0f8ff', marginBottom: '10px' }}>
                        Bienvenido <br />
                        <span style={{
                            background: 'linear-gradient(90deg, #0066ff, #00ccff, #ffffff, #00aaff, #0066ff)',
                            backgroundSize: '200% auto',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: 'text-gradient 4s linear infinite'
                        }}>al futuro del CRM</span>
                    </h1>
                    <p style={{ color: 'rgba(100, 140, 200, 0.6)', fontSize: '15px', fontWeight: '500' }}>Inicia sesión para automatizar tu éxito comercial.</p>
                </div>


                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '10px', fontSize: '10px', fontWeight: '800', color: 'rgba(0, 140, 255, 0.35)', textTransform: 'uppercase', letterSpacing: '2px' }}>Usuario del sistema</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#0066ff', opacity: 0.5, transition: 'all 0.3s' }} className="icon-glow" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Ingresa tu usuario"
                                required
                                className="input-cyber"
                            />
                            <div className="focus-line" style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, #00ccff, transparent)', transform: 'scaleX(0)', transition: 'transform 0.4s ease' }} />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(0, 140, 255, 0.35)', textTransform: 'uppercase', letterSpacing: '2px' }}>Código de Acceso</label>
                            <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '600', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#0066ff', opacity: 0.5, transition: 'all 0.3s' }} className="icon-glow" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="input-cyber"
                            />
                            <div className="focus-line" style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, #00ccff, transparent)', transform: 'scaleX(0)', transition: 'transform 0.4s ease' }} />
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '13px', textAlign: 'center', fontWeight: '600' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-cyber btn-shimmer"
                        style={{
                            marginTop: '10px', height: '58px', width: '100%',
                            background: 'linear-gradient(135deg, #003399, #0066ff)',
                            borderRadius: '14px', border: 'none', color: '#fff',
                            fontFamily: 'Syne', fontWeight: '800', fontSize: '16px',
                            cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 102, 255, 0.4)'
                        }}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '2px solid rgba(0,204,255,0.3)', borderRadius: '14px', animation: 'pulse-ring 2s infinite' }} />
                        {loading ? 'Sincronizando...' : (
                            <>
                                <LogIn size={20} /> INICIAR SESIÓN
                            </>
                        )}
                        <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer-fast 3s infinite' }} />
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.6 }}>
                        <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1))' }} />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>O inicia con</span>
                        <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.1))' }} />
                    </div>

                    <button
                        onClick={onSwitchToRegister}
                        style={{ marginTop: '20px', background: 'none', border: 'none', color: '#818cf8', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '20px auto 0' }}
                    >
                        <UserPlus size={16} /> ¿Sin cuenta? Regístrate gratis
                    </button>
                </div>

                {/* Bottom Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginTop: '36px', background: 'rgba(0,140,255,.05)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(0,140,255,.1)' }}>
                    <ShieldCheck size={14} color="#00aaeff" style={{ filter: 'drop-shadow(0 0 5px #00aaff)' }} />
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(0, 140, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Encriptación SSL 256-bit · Plataforma verificada
                        <div style={{ display: 'inline-block', width: '6px', height: '6px', background: '#00ccff', borderRadius: '50%', marginLeft: '8px', animation: 'pulse 1.5s infinite' }} />
                    </span>
                </div>
            </div>

            {/* Stats Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px',
                width: '100%',
                maxWidth: '740px',
                marginTop: '48px',
                zIndex: 10
            }}>
                {[
                    { icon: MessageSquare, value: '2.4K+', label: 'Usuarios' },
                    { icon: CheckCircle2, value: '98%', label: 'Satisfacción' },
                    { icon: Zap, value: '24/7', label: 'Disponible' },
                    { icon: Rocket, value: '5M+', label: 'Mensajes' }
                ].map((stat, i) => (
                    <div key={i} className="stat-item" style={{
                        background: 'rgba(4, 12, 26, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '20px',
                        padding: '16px',
                        textAlign: 'center',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        cursor: 'default'
                    }}>
                        <stat.icon size={18} style={{ color: '#0066ff', marginBottom: '8px', opacity: 0.8 }} />
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', fontFamily: 'Syne' }}>{stat.value}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(100, 140, 200, 0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Scrolling Ticker */}
            <div style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                height: '44px',
                background: 'rgba(2, 5, 9, 0.9)',
                borderTop: '1px solid rgba(14, 100, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                zIndex: 100,
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{
                    display: 'flex',
                    whiteSpace: 'nowrap',
                    animation: 'ticker-scroll 30s linear infinite',
                }}>
                    {[...Array(2)].map((_, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '40px', paddingRight: '40px' }}>
                            <span style={{ color: 'rgba(232, 244, 255, 0.7)', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={14} color="#00ccff" /> ⚡ Respuestas automáticas 24/7
                            </span>
                            <span style={{ color: 'rgba(232, 244, 255, 0.7)', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BarChart3 size={14} color="#00ccff" /> ◆ 📊 CRM visual en tiempo real
                            </span>
                            <span style={{ color: 'rgba(232, 244, 255, 0.7)', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Rocket size={14} color="#00ccff" /> ◆ 🚀 Difusión masiva
                            </span>
                            <span style={{ color: 'rgba(232, 244, 255, 0.7)', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={14} color="#00ccff" /> ◆ 🔒 SSL 256-bit
                            </span>
                            <span style={{ color: 'rgba(232, 244, 255, 0.7)', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MessageSquare size={14} color="#00ccff" /> ◆ 💬 2,400+ usuarios
                            </span>
                            <span style={{ color: 'rgba(232, 244, 255, 0.7)', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={14} color="#00ccff" /> ◆ ⭐ 98% satisfacción
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
