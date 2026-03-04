import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Calendar, TrendingUp, Plus, Clock, CheckCircle, BarChart2 } from 'lucide-react';

const Difusion = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        message: '',
        segment: 'Todos'
    });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8000/api/campaigns')
            .then(res => res.json())
            .then(data => setCampaigns(data))
            .catch(err => console.error("Error fetching campaigns:", err));
    }, []);

    const handleCreateCampaign = async () => {
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

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Campañas de Difusión</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Envía mensajes masivos personalizados y mide el impacto.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreate(true)}
                >
                    <Plus size={18} />
                    Nueva Campaña
                </button>
            </header>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                            <Send size={20} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>+12%</span>
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>42,850</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Mensajes Enviados (Mes)</p>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <BarChart2 size={20} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>+5.4%</span>
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>24.8%</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tasa de Apertura Media</p>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <Users size={20} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total</span>
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>3</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Segmentos Activos</p>
                </div>
            </div>

            {/* Campaigns Table */}
            <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>Campañas Recientes</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '13px' }}>NOMBRE</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '13px' }}>MENSAJE</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '13px' }}>SEGMENTO</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '13px' }}>ENVIADOS</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '13px' }}>FECHA</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '13px' }}>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map(camp => (
                                <tr key={camp.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                    <td style={{ padding: '16px 12px', fontWeight: '500' }}>{camp.name}</td>
                                    <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {camp.message}
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <span style={{ fontSize: '11px', background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '4px 8px', borderRadius: '4px' }}>
                                            {camp.segment}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>{camp.sent_count}</td>
                                    <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '13px' }}>{camp.date}</td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: camp.status === 'Completada' ? '#10b981' : '#3b82f6', fontSize: '12px', fontWeight: '600' }}>
                                            {camp.status === 'Completada' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                            {camp.status}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Campaign Modal */}
            {showCreate && (
                <div
                    style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => !isSending && setShowCreate(false)}
                >
                    <div
                        className="glass-card animate-scale-in"
                        style={{ width: '600px', padding: '40px', background: 'var(--surface)', position: 'relative', border: '1px solid var(--glass-border)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Nueva Difusión</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Configura los detalles de tu próximo envío masivo.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Nombre de la Campaña</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Promo Black Friday"
                                    value={newCampaign.name}
                                    onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '14px', color: 'white', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Segmento de Audiencia</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['Todos', 'Caliente', 'Tibio', 'Frío'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setNewCampaign({ ...newCampaign, segment: s })}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                                                background: newCampaign.segment === s ? 'var(--primary)' : 'var(--glass)',
                                                color: newCampaign.segment === s ? 'white' : 'var(--text-muted)',
                                                fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>Mensaje</label>
                                <textarea
                                    placeholder="Escribe el contenido del mensaje..."
                                    value={newCampaign.message}
                                    onChange={e => setNewCampaign({ ...newCampaign, message: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '16px', color: 'white', minHeight: '150px', resize: 'none', outline: 'none' }}
                                />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Pista: Puedes usar variable como {"{nombre}"} para personalizar.</p>
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                                <button
                                    className="btn"
                                    style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
                                    onClick={() => setShowCreate(false)}
                                    disabled={isSending}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={handleCreateCampaign}
                                    disabled={isSending || !newCampaign.name || !newCampaign.message}
                                >
                                    {isSending ? 'Enviando...' : 'Lanzar Campaña'}
                                </button>
                            </div>
                        </div>

                        {isSending && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 5 }}>
                                <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <p style={{ fontWeight: 'bold' }}>Enviando mensajes masivos...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Difusion;
