import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Zap, Plus, Smartphone, CheckCircle, XCircle, MoreVertical, ExternalLink, Smile } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config/api';

const socket = io(SOCKET_URL, {
    autoConnect: true
});

const AVATAR_COLORS = [
    '#7c3aed', '#10d9a0', '#f59e0b', '#ec4899', '#6366f1',
    '#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'
];

const getAvatarColor = (id) => {
    if (!id) return AVATAR_COLORS[0];
    const str = String(id);
    const sum = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

const formatTime = (ts) => {
    if (!ts) return "";
    let date;
    if (typeof ts === 'number') {
        // Detectar si es segundos (10 dígitos) o milisegundos (13 dígitos)
        date = new Date(ts < 10000000000 ? ts * 1000 : ts);
    } else {
        date = new Date(ts);
    }

    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // Ayer
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    if (isYesterday) {
        return `ayer ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (diffDays < 7) {
        const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        return `${days[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const getMessagePreview = (msg) => {
    if (!msg) return "Sin mensajes";
    if (msg.text) return msg.text;
    const type = msg.mediaType || msg.type;
    switch (type) {
        case 'sticker': return "🎭 Sticker";
        case 'image': return "📷 Imagen";
        case 'video': return "🎥 Video";
        case 'audio': return "🎵 Audio";
        case 'document': return `📄 ${msg.fileName || 'Archivo'}`;
        case 'location': return "📍 Ubicación compartida";
        case 'contact': return "👤 Contacto compartido";
        case 'reaction': return "✨ Reacción";
        default: return "💬 Mensaje";
    }
};

// Logs de depuración para la conexión del socket
socket.on('connect', () => {
    console.log('>>> DASHBOARD CONECTADO AL BACKEND (SID:', socket.id, ')');
});

socket.on('connect_error', (err) => {
    console.error('>>> ERROR DE CONEXIÓN SOCKET:', err.message);
});

const data = [
    { name: 'Lun', leads: 40, conv: 24 },
    { name: 'Mar', leads: 30, conv: 18 },
    { name: 'Mie', leads: 90, conv: 100 },
    { name: 'Jue', leads: 40, conv: 35 },
    { name: 'Vie', leads: 45, conv: 40 },
    { name: 'Sab', leads: 35, conv: 30 },
    { name: 'Dom', leads: 40, conv: 45 },
];

const CustomDot = (props) => {
    const { cx, cy, stroke, payload, value } = props;
    if (!cx || !cy) return null;

    return (
        <g>
            <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.15}>
                <animate attributeName="r" from="8" to="14" dur="1.5s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
            </circle>
            <circle cx={cx} cy={cy} r={4} fill={stroke} stroke="#fff" strokeWidth={2} />
        </g>
    );
};

const RecentActivityCard = ({ chats }) => {
    return (
        <div className="animate-premium-entrance" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            padding: '24px',
            flex: '1',
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animationDelay: '0.3s'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', fontWeight: '800', color: '#fff' }}>Actividad Reciente</h3>
                    <p style={{ fontFamily: 'var(--font-dm)', fontSize: '12px', color: 'var(--text-muted)' }}>Últimos mensajes de WhatsApp</p>
                </div>
                <button
                    onClick={() => window.location.href = '/chats'}
                    style={{ color: '#7c3aed', fontSize: '12px', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Ver todo
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chats.length > 0 ? chats.map((act) => {
                    const displayName = act.pushName || act.name || (act.phone ? `+${act.phone}` : 'Desconocido');
                    const preview = getMessagePreview({
                        text: act.last_message,
                        mediaType: act.mediaType
                    });

                    return (
                        <div
                            key={act.whatsapp_id || act.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                            className="group"
                            onClick={() => window.location.href = `/chats?id=${act.id}`}
                        >
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                backgroundColor: getAvatarColor(act.whatsapp_id || act.id),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-syne)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}>
                                {displayName[0]}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>{displayName}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime(act.timestamp)}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                    {preview}
                                </p>
                            </div>
                            {act.unread_count > 0 && (
                                <div style={{
                                    width: '18px', height: '18px', borderRadius: '50%',
                                    background: '#7c3aed', color: '#fff', fontSize: '10px',
                                    fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 10px rgba(124, 58, 237, 0.4)'
                                }}>
                                    {act.unread_count}
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        Sin actividad de WhatsApp todavía
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <div
        className="animate-premium-entrance"
        style={{
            padding: '24px',
            animationDelay: delay,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)';
            e.currentTarget.style.boxShadow = '0 12px 30px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(124, 58, 237, 0.1) inset';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        {/* Border Highlight Superior */}
        <div style={{
            position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)'
        }} />

        {/* Corner Glow Radial */}
        <div style={{
            position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px',
            background: `radial-gradient(circle at center, ${color}25, transparent 70%)`,
            filter: 'blur(30px)', zIndex: 0
        }} />

        <div style={{
            backgroundColor: `${color}10`,
            padding: '14px',
            borderRadius: '16px',
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
            border: `1px solid ${color}20`
        }}>
            <Icon size={24} style={{ filter: `drop-shadow(0 0 8px ${color}40)` }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{
                fontFamily: 'var(--font-dm)',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px'
            }}>{label}</p>
            <h3 style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '28px',
                fontWeight: '800',
                color: '#fff',
                letterSpacing: '-0.02em',
                margin: 0
            }}>{value}</h3>
        </div>
    </div>
);

const ConnectionCard = ({ device, onToggle }) => {
    const isConnected = device.status.toLowerCase() === 'conectado';
    const statusBaseColor = isConnected ? '#10d9a0' : '#ef4444';

    return (
        <div
            className="animate-premium-entrance"
            style={{
                padding: '28px',
                minWidth: '320px',
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '24px',
                position: 'relative',
                transition: 'all 0.3s ease'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <Smartphone size={22} color={isConnected ? '#7c3aed' : '#64748b'} />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '10px',
                        padding: '5px 12px',
                        borderRadius: '100px',
                        background: `${statusBaseColor}15`,
                        color: statusBaseColor,
                        border: `1px solid ${statusBaseColor}30`,
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {device.status}
                    </span>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
                    }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                        <MoreVertical size={18} />
                    </div>
                </div>
            </div>

            <h4 style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '18px',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '6px'
            }}>{device.device_name}</h4>
            <p style={{
                fontFamily: 'var(--font-dm)',
                fontSize: '13px',
                color: 'var(--text-dim)',
                marginBottom: '28px'
            }}>{device.phone || 'Sin registro vinculado'}</p>

            <button
                onClick={() => onToggle(device)}
                className="btn-shimmer"
                style={{
                    width: '100%',
                    height: '50px',
                    borderRadius: '14px',
                    border: 'none',
                    background: isConnected ? 'rgba(255,255,255,0.05)' : 'var(--primary-gradient)',
                    color: isConnected ? '#94a3b8' : '#fff',
                    fontFamily: 'var(--font-dm)',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isConnected ? 'none' : '0 10px 20px -5px rgba(124, 58, 237, 0.4)'
                }}
                onMouseEnter={(e) => {
                    if (!isConnected) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 15px 25px -5px rgba(124, 58, 237, 0.5)';
                    } else {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isConnected ? 'none' : '0 10px 20px -5px rgba(124, 58, 237, 0.4)';
                    e.currentTarget.style.background = isConnected ? 'rgba(255,255,255,0.05)' : 'var(--primary-gradient)';
                }}
            >
                {isConnected ? (
                    <>
                        <ExternalLink size={16} /> Desconectar dispositivo
                    </>
                ) : (
                    <>
                        <Plus size={18} /> Conectar número
                    </>
                )}
            </button>
        </div>
    );
};

const QRModal = ({ isOpen, onClose, onFinish, onLogout }) => {
    const [step, setStep] = useState(1); // 1: QR, 2: Syncing
    const [progress, setProgress] = useState(0);
    const [qrCode, setQrCode] = useState(null);
    const [qrError, setQrError] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setProgress(0);
            setQrCode(null);
            setQrError(false);
            return;
        }

        // NO llamar a setQrCode(null) aquí si ya tenemos uno, 
        // para evitar que el re-render por setQrCode dispare este efecto de nuevo
        if (!qrCode) {
            setQrError(false);
        }

        const timeout = setTimeout(() => {
            if (step === 1 && !qrCode) {
                setQrError(true);
                console.warn('[QR] Timeout: no llegó QR del bridge en 20 segundos');
            }
        }, 20000);

        socket.on('whatsapp_qr_ready', (data) => {
            clearTimeout(timeout);
            console.log("QR Real recibido para mostrar:", data.qr.substring(0, 20) + "...");
            setQrCode(data.qr);
            setQrError(false);
            setStep(1); // Asegurar que estamos en vista QR
        });

        socket.on('device_status', (data) => {
            if (data.status === 'conectado') {
                console.log(">>> DASHBOARD: Conexión detectada. Esperando para sincronizar...");
                clearTimeout(timeout);
                // NO cambiar a step 2 aquí, esperar a whatsapp_ready_for_sync
            }
        });

        socket.on('whatsapp_ready_for_sync', (data) => {
            console.log(">>> DASHBOARD: Conexión lista, iniciando sincronización...");
            setStep(2);  // ✅ AHORA sí cambiar a paso 2
            socket.emit('request_contacts_sync');
        });

        socket.on('sync_progress', (data) => {
            console.log("Progreso recibido:", data.progress);
            setStep(2); // Forzar vista de carga si llega progreso
            setProgress(data.progress);
        });

        socket.on('contacts_updated', (data) => {
            console.log("Sincronización de contactos detectada en Dashboard:", data);
            setProgress(100);
            setTimeout(() => {
                onFinish();
            }, 800);
        });

        return () => {
            clearTimeout(timeout);
            socket.off('whatsapp_qr_ready');
            socket.off('device_status');
            socket.off('whatsapp_ready_for_sync');
            socket.off('sync_progress');
            socket.off('contacts_updated');
        };
    }, [isOpen, onFinish, step, !!qrCode]);
    // Usamos !!qrCode como dependencia para que solo reaccione al cambio de "hay qr" a "no hay qr"
    // y no al contenido del string en sí, aunque el problema principal era el setQrCode(null) interior.

    useEffect(() => {
        if (step === 2) {
            let interval = setInterval(() => {
                setProgress(prev => {
                    if (prev < 90) return prev + 1;
                    return prev;
                });
            }, 100);

            // SEGURIDAD: Si llegamos al 90% y estamos "conectados" pero el backend
            // no ha mandado 'contacts_updated' en 6 segundos adicionales, cerramos igual.
            const safetyTimeout = setTimeout(() => {
                console.warn("[QR] Sincronización lenta detectada, forzando finalización por seguridad.");
                setProgress(100);
                setTimeout(() => onFinish(), 500);
            }, 6000);

            return () => {
                clearInterval(interval);
                clearTimeout(safetyTimeout);
            };
        }
    }, [step, onFinish]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
            padding: '20px', animation: 'fade-in 0.4s ease-out'
        }}>
            <div className="glass-card" style={{
                width: '100%', maxWidth: step === 1 ? '700px' : '500px',
                padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px',
                border: '1px solid var(--glass-border)', textAlign: 'center'
            }}>
                {step === 1 ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="heading-xl">Conecta tu WhatsApp</h3>
                            <XCircle size={28} className="text-secondary cursor-pointer" onClick={onClose} />
                        </div>

                        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', textAlign: 'left' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <ol style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: '1.4' }}>
                                    <li>Abre <span style={{ fontWeight: 'bold', color: 'white' }}>WhatsApp</span> en tu teléfono</li>
                                    <li>Toca <span style={{ fontWeight: 'bold', color: 'white' }}>Dispositivos vinculados</span></li>
                                    <li>Toca <span style={{ fontWeight: 'bold', color: 'white' }}>Vincular un dispositivo</span></li>
                                    <li>Escanea el código de la derecha con la cámara de tu WhatsApp</li>
                                </ol>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{
                                        padding: '12px 16px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <CheckCircle size={20} color="#10b981" />
                                        <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>Conexión Segura Calidad FunnelChat</span>
                                    </div>

                                    <button
                                        onClick={onLogout}
                                        className="btn-danger"
                                        style={{
                                            padding: '10px',
                                            fontSize: '13px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            color: '#ef4444'
                                        }}
                                    >
                                        <Smile size={16} />
                                        Cerrar sesión actual / Resetear QR
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                padding: '16px', background: 'white', borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', width: '250px', height: '250px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                                flexShrink: 0
                            }}>
                                {qrCode ? (
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}`}
                                        alt="WhatsApp QR Code"
                                        style={{ width: '220px', height: '220px' }}
                                    />
                                ) : qrError ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '8px' }}>
                                        <span style={{ fontSize: '28px' }}>⚠️</span>
                                        <p style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold', margin: 0 }}>Bridge no responde</p>
                                        <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textAlign: 'center' }}>¿Ya estabas conectado? Intenta resetear.</p>
                                        <button
                                            onClick={() => { setQrError(false); setQrCode(null); }}
                                            style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                        <p style={{ color: '#64748b', fontSize: '12px' }}>Generando QR...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8"
                                    strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100}
                                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Smartphone size={40} color="#10b981" />
                            </div>
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: '800' }}>¡Escaneo Exitoso!</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                            Sincronizando tus chats reales ahora. No cierres esta ventana.
                        </p>
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: '#10b981', transition: 'width 0.1s linear' }}></div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{progress}% sincronizado</span>

                        <button
                            onClick={onLogout}
                            style={{
                                marginTop: '20px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                background: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <Smile size={14} style={{ marginRight: '8px' }} />
                            ¿No eres tú? Cerrar sesión y resetear QR
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ConnectDeviceModal = ({ isOpen, onClose, onConfirm, onQRLink, device }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '20px', animation: 'fade-in 0.3s ease-out'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="heading-xl">Conectar Dispositivo</h3>
                        <XCircle size={24} className="text-secondary cursor-pointer" onClick={onClose} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div
                            style={{
                                padding: '20px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            className="hover-scale"
                            onClick={onConfirm}
                        >
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#818cf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ExternalLink size={18} /> WhatsApp Business API
                            </h4>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Ideal para empresas. Requiere aprobación de Meta y un número nuevo.</p>
                        </div>

                        <div
                            style={{
                                padding: '20px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            className="hover-scale"
                            onClick={onQRLink}
                        >
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Smartphone size={18} /> WhatsApp Web QR
                            </h4>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Vinculación rápida mediante escaneo QR. Sincroniza tus chats existentes.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button className="btn" onClick={onClose} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        leads: '0',
        conversations: '0',
        conversion_rate: '0%',
        automations: '0'
    });
    const [devices, setDevices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncMessage, setSyncMessage] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [recentChats, setRecentChats] = useState([]);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Fetch stats
        fetch(`${API_URL}/api/stats`, { headers })
            .then(res => res.json())
            .then(data => {
                setStats({
                    leads: data.leads?.toLocaleString() || '0',
                    conversations: data.conversations?.toLocaleString() || '0',
                    conversion_rate: data.conversion_rate || '0%',
                    automations: data.automations || '0'
                });
            })
            .catch(err => console.error("Error fetching stats:", err));

        // Fetch devices
        fetch('http://127.0.0.1:8000/api/devices', { headers })
            .then(res => res.json())
            .then(data => setDevices(data))
            .catch(err => console.error("Error fetching devices:", err));

        // Fetch recent chats
        fetch('http://127.0.0.1:8000/api/contacts', { headers })
            .then(res => res.json())
            .then(data => {
                const sorted = Array.isArray(data) ? [...data].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : [];
                setRecentChats(sorted.slice(0, 5));
            })
            .catch(err => console.error("Error fetching recent chats:", err));

        // Socket.io for Real-time Device Status
        socket.on('device_status', (data) => {
            console.log("Device status update received:", data);
            setDevices(prev => prev.map(d =>
                d.id === data.device_id ? { ...d, status: data.status } : d
            ));
        });

        socket.on('contacts_updated', (data) => {
            console.log("Contactos sincronizados correctamente:", data);
            fetch('http://127.0.0.1:8000/api/contacts', { headers })
                .then(res => res.json())
                .then(data => {
                    const sorted = [...data].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    setRecentChats(sorted.slice(0, 5));
                });
        });

        socket.on('new_whatsapp_message', (data) => {
            const jid = data.whatsapp_id || data.contact_id;
            const messagePreview = getMessagePreview(data.message);

            setRecentChats(prev => {
                const existingIdx = prev.findIndex(c => (c.whatsapp_id || c.id) === jid);
                if (existingIdx > -1) {
                    const updatedContact = {
                        ...prev[existingIdx],
                        last_message: messagePreview,
                        timestamp: data.message.timestamp,
                        unread_count: data.unreadCount,
                        pushName: data.message.pushName || prev[existingIdx].pushName
                    };
                    const updatedChats = [...prev];
                    updatedChats.splice(existingIdx, 1);
                    return [updatedContact, ...updatedChats].slice(0, 5);
                } else {
                    fetch('http://127.0.0.1:8000/api/contacts', { headers })
                        .then(res => res.json())
                        .then(d => {
                            const sorted = [...d].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                            setRecentChats(sorted.slice(0, 5));
                        });
                    return prev;
                }
            });
        });

        socket.on('whatsapp_qr_ready', (data) => {
            console.log('>>> QR RECIBIDO EN DASHBOARD');
        });

        socket.on('sync_progress', (data) => {
            setIsSyncing(true);
            setSyncProgress(data.progress);
            setSyncMessage(data.message);
            if (data.progress === 100) {
                setTimeout(() => setIsSyncing(false), 3000);
            }
        });

        return () => {
            socket.off('device_status');
            socket.off('contacts_updated');
            socket.off('whatsapp_qr_ready');
            socket.off('sync_progress');
        };
    }, []);

    const toggleConnection = async (device) => {
        if (device.status === 'desconectado') {
            setSelectedDevice(device);
            setIsModalOpen(true);
            return;
        }

        // Si ya está conectado, procedemos a desconectar directamente o pedir confirmación
        const url = 'http://127.0.0.1:8000/disconnect_device';
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ device_id: device.id })
            });
            const data = await response.json();
            console.log(data.message);
            setDevices(prev => prev.map(d =>
                d.id === device.id ? { ...d, status: 'desconectado' } : d
            ));
        } catch (err) {
            console.error(`Error disconnecting device:`, err);
        }
    };

    const handleConfirmAPI = async () => {
        if (!selectedDevice) return;

        setIsModalOpen(false);
        // Simular apertura de pestaña de Facebook
        console.log("Simulando apertura de Facebook Business Tool...");

        try {
            const url = 'http://127.0.0.1:8000/connect_device';
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ device_id: selectedDevice.id })
            });
            const data = await response.json();
            console.log(data.message);
            setDevices(prev => prev.map(d =>
                d.id === selectedDevice.id ? { ...d, status: 'conectado' } : d
            ));
        } catch (err) {
            console.error(`Error connecting device:`, err);
        }
    };

    const handleOpenQR = async () => {
        setIsModalOpen(false);

        // Registrar sesión QR en el backend para vincular contactos al usuario correcto
        const token = localStorage.getItem('token');
        try {
            await fetch('http://127.0.0.1:8000/api/devices/start-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ device_id: selectedDevice?.id })
            });
            console.log("Sesión QR registrada para el usuario actual");

            // Si el dispositivo ya figura como conectado en nuestra lista de estado,
            // podemos saltar directamente al paso de sincronización
            if (selectedDevice?.status === 'conectado') {
                // This `setStep` is for QRModal, but it's not directly accessible here.
                // The QRModal itself handles its steps based on socket events.
                // For now, we just open the QR modal.
            }
        } catch (err) {
            console.warn("No se pudo registrar la sesión QR:", err);
        }

        setIsQRModalOpen(true);
    };

    const handleLogoutWhatsApp = async () => {
        if (!window.confirm("¿Estás seguro de que deseas cerrar la sesión de WhatsApp? Esto desconectará el dispositivo.")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/devices/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                console.log("Petición de logout enviada");
                setIsQRModalOpen(false);
            }
        } catch (err) {
            console.error("Error logging out WhatsApp:", err);
        }
    };

    const handleFinishQR = async () => {
        setIsQRModalOpen(false);
        if (!selectedDevice) return;

        console.log("Simulando sincronización de chats post-QR...");

        try {
            const url = 'http://127.0.0.1:8000/connect_device';
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ device_id: selectedDevice.id })
            });
            const data = await response.json();
            console.log(data.message);
            setDevices(prev => prev.map(d =>
                d.id === selectedDevice.id ? { ...d, status: 'conectado' } : d
            ));

            // Simular recarga de chats
            window.location.reload(); // Para propósitos de demo, esto forzará ver los nuevos chats
        } catch (err) {
            console.error(`Error finishing QR link:`, err);
        }
    };

    return (
        <div className="animate-fade-in" style={{ position: 'relative' }}>
            {/* WhatsApp Web Style Sync Overlay */}
            {isSyncing && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(10, 11, 20, 0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="glass-card" style={{ padding: '40px', width: '400px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 24px',
                            background: 'var(--primary-gradient)',
                            borderRadius: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.5)',
                            transform: 'rotate(-5deg)'
                        }}>
                            <Smile size={40} color="white" />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: 'white' }}>Optimizando tu WhatsApp</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '32px' }}>{syncMessage}</p>

                        <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                width: `${syncProgress}%`,
                                height: '100%',
                                background: 'var(--primary-gradient)',
                                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 0 15px var(--primary)'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Progreso</span>
                            <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>{syncProgress}%</span>
                        </div>
                    </div>
                </div>
            )}
            <ConnectDeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAPI}
                onQRLink={handleOpenQR}
                device={selectedDevice}
            />
            {isQRModalOpen && (
                <QRModal
                    isOpen={isQRModalOpen}
                    onClose={() => setIsQRModalOpen(false)}
                    onFinish={handleFinishQR}
                    onLogout={handleLogoutWhatsApp}
                />
            )}
            <header style={{
                marginBottom: '40px',
                animationDelay: '0s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }} className="animate-premium-entrance">
                <div>
                    <h2 style={{
                        fontFamily: 'var(--font-syne)',
                        fontSize: '34px',
                        fontWeight: '800',
                        color: '#fff',
                        marginBottom: '8px',
                        letterSpacing: '-0.03em'
                    }}>
                        Bienvenido, Admin 👋
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', background: '#10d9a0', borderRadius: '50%', boxShadow: '0 0 10px #10d9a0', animation: 'pulse-green 2s infinite' }} />
                        <p style={{ fontFamily: 'var(--font-dm)', color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>
                            Aquí tienes el resumen de tu funnel — Lunes 8 Mar, 2026
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '10px 20px',
                        color: '#94a3b8',
                        fontFamily: 'var(--font-dm)',
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}>
                        <Smartphone size={18} /> Esta semana
                    </button>
                    <button style={{
                        background: 'var(--primary-gradient)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px 20px',
                        color: '#fff',
                        fontFamily: 'var(--font-dm)',
                        fontWeight: '700',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.4)'
                    }}>
                        <Plus size={18} /> Nueva Campaña
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <StatCard icon={Users} label="Total Leads" value={stats.leads} color="#7c3aed" delay="0.05s" />
                <StatCard icon={MessageSquare} label="Conversaciones" value={stats.conversations} color="#10d9a0" delay="0.1s" />
                <StatCard icon={TrendingUp} label="Tasa de Conv." value={stats.conversion_rate} color="#f59e0b" delay="0.15s" />
                <StatCard icon={Zap} label="Automatizaciones" value={stats.automations} color="#ec4899" delay="0.2s" />
            </div>

            {/* Chart and Activity Section */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '48px', flexWrap: 'wrap' }}>
                <div className="animate-premium-entrance" style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '32px',
                    padding: '32px',
                    flex: '2.5',
                    minWidth: '600px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '32px',
                    animationDelay: '0.25s',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                        <div>
                            <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: '800', color: '#fff' }}>Actividad Semanal</h3>
                            <p style={{ fontFamily: 'var(--font-dm)', fontSize: '13px', color: 'var(--text-muted)' }}>Leads y conversiones por día</p>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.03)', padding: '6px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 8px #7c3aed' }}></div> Leads
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10d9a0', boxShadow: '0 0 8px #10d9a0' }}></div> Conv.
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '320px', position: 'relative', zIndex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10d9a0" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10d9a0" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" strokeDasharray="0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} dy={15} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                    contentStyle={{
                                        backgroundColor: '#0d1320',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '16px',
                                        padding: '12px 16px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        fontFamily: 'var(--font-dm)'
                                    }}
                                />
                                <Area type="monotone" dataKey="leads" stroke="#7c3aed" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" filter="url(#glow)" activeDot={<CustomDot />} animationDuration={2000} />
                                <Area type="monotone" dataKey="conv" stroke="#10d9a0" strokeWidth={4} fillOpacity={1} fill="url(#colorConv)" filter="url(#glow)" activeDot={<CustomDot />} animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <RecentActivityCard chats={recentChats} />
            </div>

            {/* Connections Section */}
            <section className="animate-premium-entrance" style={{ animationDelay: '0.35s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: '20px', fontWeight: '800', color: '#fff' }}>Conexiones</h3>
                    <button style={{
                        fontFamily: 'var(--font-dm)',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#7c3aed',
                        background: 'rgba(124, 58, 237, 0.08)',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }} onMouseEnter={(e) => e.target.style.background = 'rgba(124, 58, 237, 0.12)'} onMouseLeave={(e) => e.target.style.background = 'rgba(124, 58, 237, 0.08)'}>
                        Gestionar todas
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {devices.map((device, i) => (
                        <ConnectionCard
                            key={device.id}
                            device={device}
                            onToggle={toggleConnection}
                        />
                    ))}

                    <div
                        className="animate-premium-entrance"
                        style={{
                            minWidth: '320px', flex: 1,
                            border: '2px dashed rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            display: 'flex', flexDirection: 'column', gap: '16px', padding: '32px',
                            alignItems: 'center', justifyContent: 'center',
                            borderRadius: '24px',
                            animationDelay: `${0.4 + (devices.length * 0.05)}s`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <Plus size={24} color="#64748b" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{
                                display: 'block',
                                fontFamily: 'var(--font-syne)',
                                fontWeight: '700',
                                color: '#fff',
                                fontSize: '16px',
                                marginBottom: '4px'
                            }}>Nuevo Dispositivo</span>
                            <span style={{
                                display: 'block',
                                fontFamily: 'var(--font-dm)',
                                color: 'var(--text-muted)',
                                fontSize: '13px'
                            }}>Añade otra conexión</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
