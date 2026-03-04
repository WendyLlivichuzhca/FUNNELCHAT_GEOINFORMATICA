import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Zap, Plus, Smartphone, CheckCircle, XCircle, MoreVertical, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000');

const data = [
    { name: 'Lun', leads: 40, conv: 24 },
    { name: 'Mar', leads: 30, conv: 18 },
    { name: 'Mie', leads: 90, conv: 100 },
    { name: 'Jue', leads: 40, conv: 35 },
    { name: 'Vie', leads: 45, conv: 40 },
    { name: 'Sab', leads: 35, conv: 30 },
    { name: 'Dom', leads: 40, conv: 45 },
];

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <div className={`glass-card p-6 flex items-center gap-4 animate-fade-in`} style={{ padding: '24px', animationDelay: delay }}>
        <div style={{
            backgroundColor: `${color}15`,
            padding: '14px',
            borderRadius: '16px',
            color: color,
            boxShadow: `0 8px 16px -4px ${color}30`
        }}>
            <Icon size={24} />
        </div>
        <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>{label}</p>
            <h3 style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '4px', letterSpacing: '-0.5px' }}>{value}</h3>
        </div>
    </div>
);

const ConnectionCard = ({ device, onToggle }) => {
    const isConnected = device.status.toLowerCase() === 'conectado';
    return (
        <div className="glass-card" style={{ padding: '24px', minWidth: '280px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)'
                }}>
                    <Smartphone size={24} color={isConnected ? '#10b981' : 'var(--text-muted)'} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                        fontSize: '11px', padding: '4px 8px', borderRadius: '20px',
                        background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isConnected ? '#10b981' : '#ef4444',
                        border: `1px solid ${isConnected ? '#10b98130' : '#ef444430'}`,
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                    }}>
                        {device.status}
                    </span>
                    <MoreVertical size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                </div>
            </div>
            <h4 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{device.device_name}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>{device.phone || 'Sin registro'}</p>

            <button
                onClick={() => onToggle(device)}
                className="btn"
                style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                    fontSize: '13px', fontWeight: '600'
                }}
            >
                {isConnected ? 'Desconectar dispositivo' : 'Conectar número'}
            </button>
        </div>
    );
};

const QRConnectionModal = ({ isOpen, onClose, onFinish }) => {
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

        setQrError(false);
        setQrCode(null);

        // Timeout de 20 segundos: si no llega QR, mostrar error
        const timeout = setTimeout(() => {
            setQrError(true);
            console.warn('[QR] Timeout: no llegó QR del bridge en 20 segundos');
        }, 20000);

        // Escuchar QR real del backend
        socket.on('whatsapp_qr_ready', (data) => {
            clearTimeout(timeout);
            console.log("QR Real recibido para mostrar:", data.qr.substring(0, 20) + "...");
            setQrCode(data.qr);
            setQrError(false);
        });

        // Escuchar estado para cambiar a sincronización automáticamente
        socket.on('device_status', (data) => {
            if (data.status === 'conectado') {
                clearTimeout(timeout);
                setStep(2);
            }
        });

        // Escuchar cuando la sincronización real termina para cerrar el modal
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
            socket.off('contacts_updated');
        };
    }, [isOpen]);

    useEffect(() => {
        if (step === 2) {
            // Animación rápida inicial hasta el 90%
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10; // Aumento mucho más rápido (10% cada 100ms)
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [step]);

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
                border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center'
            }}>
                {step === 1 ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'left' }}>Conecta tu WhatsApp Real</h3>
                            <XCircle size={28} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={onClose} />
                        </div>

                        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', textAlign: 'left' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <ol style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: '1.4' }}>
                                    <li>Abre <span style={{ fontWeight: 'bold', color: 'white' }}>WhatsApp</span> en tu teléfono</li>
                                    <li>Toca <span style={{ fontWeight: 'bold', color: 'white' }}>Dispositivos vinculados</span></li>
                                    <li>Toca <span style={{ fontWeight: 'bold', color: 'white' }}>Vincular un dispositivo</span></li>
                                    <li>Escanea el código de la derecha con la cámara de tu WhatsApp</li>
                                </ol>
                                <div style={{
                                    padding: '12px', background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                    <p style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>
                                        ✓ Conexión Segura Calidad FunnelChat
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                padding: '16px', background: 'white', borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', width: '250px', height: '250px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
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
                                        <p style={{ color: '#64748b', fontSize: '10px', margin: 0, textAlign: 'center' }}>Asegúrate de que el bridge de WhatsApp esté corriendo</p>
                                        <button
                                            onClick={() => { setQrError(false); setQrCode(null); }}
                                            style={{ marginTop: '4px', padding: '6px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
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
            <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Conectar Dispositivo</h3>
                        <XCircle size={24} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={onClose} />
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
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Fetch stats
        fetch('http://localhost:8000/api/stats', { headers })
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
        fetch('http://localhost:8000/api/devices', { headers })
            .then(res => res.json())
            .then(data => setDevices(data))
            .catch(err => console.error("Error fetching devices:", err));

        // Socket.io for Real-time Device Status
        socket.on('device_status', (data) => {
            console.log("Device status update received:", data);
            setDevices(prev => prev.map(d =>
                d.id === data.device_id ? { ...d, status: data.status } : d
            ));
        });

        socket.on('contacts_updated', (data) => {
            console.log("Contactos sincronizados correctamente:", data);
            alert(`¡Éxito! Se han sincronizado ${data.count} contactos reales de tu WhatsApp.`);
        });

        return () => {
            socket.off('device_status');
            socket.off('contacts_updated');
        };
    }, []);

    const toggleConnection = async (device) => {
        if (device.status === 'desconectado') {
            setSelectedDevice(device);
            setIsModalOpen(true);
            return;
        }

        // Si ya está conectado, procedemos a desconectar directamente o pedir confirmación
        const url = 'http://localhost:8000/disconnect_device';
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
            const url = 'http://localhost:8000/connect_device';
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
            await fetch('http://localhost:8000/api/devices/start-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ device_id: selectedDevice?.id })
            });
            console.log("Sesión QR registrada para el usuario actual");
        } catch (err) {
            console.warn("No se pudo registrar la sesión QR:", err);
        }

        setIsQRModalOpen(true);
    };

    const handleFinishQR = async () => {
        setIsQRModalOpen(false);
        if (!selectedDevice) return;

        console.log("Simulando sincronización de chats post-QR...");

        try {
            const url = 'http://localhost:8000/connect_device';
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
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <ConnectDeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAPI}
                onQRLink={handleOpenQR}
                device={selectedDevice}
            />
            <QRConnectionModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                onFinish={handleFinishQR}
            />
            <header>
                <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>
                    Bienvenido, {localStorage.getItem('username') || 'Usuario'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Aquí tienes el resumen de tu funnel hoy.</p>
            </header>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <StatCard icon={Users} label="Total Leads" value={stats.leads} color="#6366f1" delay="0s" />
                <StatCard icon={MessageSquare} label="Conversaciones" value={stats.conversations} color="#10b981" delay="0.1s" />
                <StatCard icon={TrendingUp} label="Tasa de Conv." value={stats.conversion_rate} color="#f59e0b" delay="0.2s" />
                <StatCard icon={Zap} label="Automatizaciones" value={stats.automations} color="#ec4899" delay="0.3s" />
            </div>

            {/* Chart Section */}
            <div className="glass-card" style={{ padding: '32px', minHeight: '450px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Actividad Semanal</h3>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}></div> Leads
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div> Conv.
                        </div>
                    </div>
                </div>
                <div style={{ width: '100%', height: '300px', flexGrow: 1, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis hide domain={[0, 'auto']} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                }}
                                itemStyle={{ fontSize: '12px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorLeads)"
                                animationDuration={1500}
                            />
                            <Area
                                type="monotone"
                                dataKey="conv"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorConv)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Connections Section */}
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Conexiones</h3>
                    <button className="btn" style={{ fontSize: '13px', background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                        Gestionar todas
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {devices.map(device => (
                        <ConnectionCard
                            key={device.id}
                            device={device}
                            onToggle={toggleConnection}
                        />
                    ))}
                    <div className="glass-card flex-center" style={{
                        minWidth: '280px', flex: 1, border: '2px dashed var(--glass-border)',
                        background: 'transparent', cursor: 'pointer', transition: 'all 0.3s',
                        display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Plus size={24} color="var(--text-muted)" />
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Mejorar plan</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
