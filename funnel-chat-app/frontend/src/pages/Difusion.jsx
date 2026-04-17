import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Calendar, TrendingUp, Plus, Clock, CheckCircle, BarChart2 } from 'lucide-react';

const Difusion = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newCampaign, setNewCampaign] = useState({ nombre: '', mensaje: '', segmento: 'Todos' });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8000/api/campaigns')
            .then(res => res.json())
            .then(data => setCampaigns(data))
            .catch(err => console.error("Error fetching campaigns:", err));
    }, []);

    const handleCreateCampaign = async () => {
        if (!newCampaign.nombre.trim() || !newCampaign.mensaje.trim()) {
            showToast('Completa el nombre y el mensaje', 'error');
            return;
        }
        setIsSending(true);
        // Simulación de envío antes de guardar
        setTimeout(async () => {
            try {
                const response = await fetch('http://localhost:8000/api/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...newCampaign,
                        sent_count: Math.floor(Math.random() * 500) + 100
                    })
                });
                const data = await response.json();
                if (data.status === 'success') {
                    setCampaigns([data.campaign, ...campaigns]);
                    setShowCreate(false);
                    setNewCampaign({ name: '', message: '', segment: 'Todos' });
                }
            } catch (err) {
                console.error("Error creating campaign:", err);
            } finally {
                setIsSending(false);
            }
        }, 2000);
    };

    const totalEnviados = campaigns.reduce((s, c) => s + (c.total_enviados || 0), 0);
    const completadas = campaigns.filter(c => c.estado === 'completado').length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '28px', right: '28px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 22px', borderRadius: '14px',
                    background: toast.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                }}>
                    {toast.type === 'success'
                        ? <CheckCircle size={18} color="#10d9a0" />
                        : <AlertCircle size={18} color="#ef4444" />}
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{toast.msg}</span>
                </div>
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="heading-xl" style={{ fontSize: '28px' }}>Campañas de Difusión</h2>
                    <p className="text-main">Envía mensajes masivos personalizados y mide el impacto en tiempo real.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ height: '44px' }}>
                    <Plus size={18} />
                    Nueva Campaña
                </button>
            </header>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div className="glass-card" style={{ padding: '28px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', boxShadow: '0 8px 16px rgba(99,102,241,0.1)' }}>
                            <Send size={22} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                            <TrendingUp size={12} color="var(--success)" />
                            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '900' }}>Total</span>
                        </div>
                    </div>
                    <h3 className="heading-xl" style={{ fontSize: '26px' }}>{totalEnviados.toLocaleString()}</h3>
                    <p className="text-small" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Envíos Acumulados</p>
                </div>
                <div className="glass-card" style={{ padding: '28px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', boxShadow: '0 8px 16px rgba(16,185,129,0.1)' }}>
                            <BarChart2 size={22} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                            <CheckCircle size={12} color="var(--success)" />
                            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '900' }}>OK</span>
                        </div>
                    </div>
                    <h3 className="heading-xl" style={{ fontSize: '26px' }}>{completadas}</h3>
                    <p className="text-small" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Campañas Completadas</p>
                </div>
                <div className="glass-card" style={{ padding: '28px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', boxShadow: '0 8px 16px rgba(245,158,11,0.1)' }}>
                            <Users size={22} />
                        </div>
                        <span className="text-small" style={{ fontWeight: '800', opacity: 0.6 }}>TOTAL</span>
                    </div>
                    <h3 className="heading-xl" style={{ fontSize: '26px' }}>{campaigns.length}</h3>
                    <p className="text-small" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Campañas Creadas</p>
                </div>
            </div>

            {/* Campaigns Table */}
            <div className="glass-card" style={{ padding: '28px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
                    <div style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '4px' }} />
                    <h3 className="heading-base" style={{ fontSize: '18px' }}>Campañas Recientes</h3>
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%' }} className="animate-spin" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        <Send size={44} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px' }}>Sin campañas todavía</p>
                        <p style={{ fontSize: '13px' }}>Crea tu primera campaña con el botón de arriba.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</th>
                                    <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensaje</th>
                                    <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Segmento</th>
                                    <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enviados</th>
                                    <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                                    <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map(camp => {
                                    const isCompleted = camp.estado === 'completado';
                                    const statusColor = isCompleted ? 'var(--success)' : 'var(--info)';
                                    const statusBg = isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)';
                                    const statusBorder = isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)';
                                    const fechaStr = camp.creado_en
                                        ? new Date(camp.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : '—';
                                    return (
                                        <tr key={camp.id} className="hover:bg-white/5 transition-colors group">
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <span className="heading-base" style={{ fontSize: '14px' }}>{camp.nombre}</span>
                                            </td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <p className="text-main" style={{ fontSize: '13px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {camp.mensaje}
                                                </p>
                                            </td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', color: 'var(--text-subtitle)' }}>
                                                    {(camp.segmento || 'Todos').toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <TrendingUp size={14} color="var(--primary)" />
                                                    <span style={{ fontWeight: '700' }}>{camp.total_enviados ?? 0}</span>
                                                </div>
                                            </td>
                                            <td className="text-small" style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: '600' }}>{fechaStr}</td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: statusColor, fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em', background: statusBg, padding: '6px 12px', borderRadius: '8px', width: 'fit-content', border: '1px solid', borderColor: statusBorder }}>
                                                    {isCompleted ? <CheckCircle size={14} /> : <Clock size={14} className="animate-pulse" />}
                                                    {camp.estado || 'pendiente'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Campaign Modal */}
            {showCreate && (
                <div
                    style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(5,5,10,0.85)', zIndex: 100, backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => !isSending && setShowCreate(false)}
                >
                    <div
                        className="glass-card animate-scale-in"
                        style={{ width: '640px', padding: '48px', background: 'var(--bg-card)', position: 'relative', border: '1px solid var(--border-subtle)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '48px', height: '48px', background: 'var(--primary-gradient)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px -5px rgba(99,102,241,0.4)' }}>
                                <Send size={22} color="white" />
                            </div>
                            <div>
                                <h3 className="heading-xl" style={{ fontSize: '26px' }}>Nueva Difusión</h3>
                                <p className="text-main" style={{ fontSize: '14px' }}>Impacta a cientos de prospectos en segundos.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '40px' }}>
                            <div>
                                <label className="text-small" style={{ display: 'block', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre de la Campaña</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Lanzamiento Exclusivo Marzo"
                                    value={newCampaign.nombre}
                                    onChange={e => setNewCampaign({ ...newCampaign, nombre: e.target.value })}
                                    className="input-styled"
                                    style={{ width: '100%', fontSize: '15px' }}
                                />
                            </div>

                            <div>
                                <label className="text-small" style={{ display: 'block', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Segmento de Audiencia</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['Todos', 'Caliente', 'Tibio', 'Frío'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setNewCampaign({ ...newCampaign, segmento: s })}
                                            style={{
                                                flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid',
                                                borderColor: newCampaign.segmento === s ? 'transparent' : 'var(--border-subtle)',
                                                background: newCampaign.segmento === s ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                                                color: newCampaign.segmento === s ? 'white' : 'var(--text-subtitle)',
                                                fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease',
                                                boxShadow: newCampaign.segmento === s ? '0 10px 20px -5px rgba(99,102,241,0.3)' : 'none'
                                            }}
                                            className={newCampaign.segmento === s ? '' : 'hover:bg-white/5'}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-small" style={{ display: 'block', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensaje Masivo</label>
                                <textarea
                                    placeholder="Hola {nombre}, tenemos algo especial para ti..."
                                    value={newCampaign.mensaje}
                                    onChange={e => setNewCampaign({ ...newCampaign, mensaje: e.target.value })}
                                    className="input-styled"
                                    style={{ width: '100%', minHeight: '160px', padding: '18px', fontSize: '15px', lineHeight: '1.6', resize: 'none' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                                    <p className="text-small">Usa <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{'{nombre}'}</span> para personalizar el envío.</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
                                <button
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', height: '52px' }}
                                    className="hover:bg-white/5 transition-colors"
                                    onClick={() => setShowCreate(false)}
                                    disabled={isSending}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn-primary"
                                    style={{ flex: 1.5, justifyContent: 'center', height: '52px' }}
                                    onClick={handleCreateCampaign}
                                    disabled={isSending || !newCampaign.nombre || !newCampaign.mensaje}
                                >
                                    {isSending ? (
                                        <>
                                            <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                                            Creando...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Lanzar Campaña
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {isSending && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,5,10,0.9)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', zIndex: 10, backdropFilter: 'blur(4px)' }}>
                                <div style={{ width: '50px', height: '50px', border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid var(--primary)', borderRadius: '50%', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }} className="animate-spin" />
                                <div>
                                    <p className="heading-base" style={{ fontSize: '18px', textAlign: 'center' }}>Creando Campaña</p>
                                    <p className="text-small" style={{ textAlign: 'center', marginTop: '6px', opacity: 0.7 }}>Guardando en la base de datos...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Difusion;
