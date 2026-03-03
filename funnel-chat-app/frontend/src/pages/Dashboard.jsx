import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="glass-card p-6 flex items-center gap-4 animate-fade-in" style={{ padding: '24px' }}>
        <div style={{
            backgroundColor: `${color}20`,
            padding: '12px',
            borderRadius: '12px',
            color: color
        }}>
            <Icon size={24} />
        </div>
        <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{label}</p>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        leads: '...',
        conversations: '...',
        conversion_rate: '...',
        automations: '...'
    });
    const [activity, setActivity] = useState([]);

    useEffect(() => {
        // Fetch Stats
        fetch('http://localhost:8000/api/stats')
            .then(res => res.json())
            .then(data => {
                setStats({
                    leads: data.leads.toLocaleString(),
                    conversations: data.conversations.toLocaleString(),
                    conversion_rate: data.conversion_rate,
                    automations: data.automations
                });
            })
            .catch(err => console.error("Error fetching stats:", err));

        // Fetch Activity Data for Chart
        fetch('http://localhost:8000/api/dashboard/activity')
            .then(res => res.json())
            .then(data => setActivity(data))
            .catch(err => console.error("Error fetching activity:", err));
    }, []);

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Bienvenido, Wendy</h2>
                <p style={{ color: 'var(--text-muted)' }}>Aquí tienes el resumen de tu funnel hoy.</p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <StatCard icon={Users} label="Total Leads" value={stats.leads} color="#6366f1" />
                <StatCard icon={MessageSquare} label="Conversaciones" value={stats.conversations} color="#10b981" />
                <StatCard icon={TrendingUp} label="Tasa de Conv." value={stats.conversion_rate} color="#f59e0b" />
                <StatCard icon={Zap} label="Automatizaciones" value={stats.automations} color="#ec4899" />
            </div>

            <div className="glass-card" style={{ padding: '24px', height: '400px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>Actividad Semanal</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={activity}>
                        <defs>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px' }}
                            itemStyle={{ color: 'white' }}
                        />
                        <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                        <Area type="monotone" dataKey="chats" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Acciones Rápidas</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>+ Nuevo Lead</button>
                        <button className="btn" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '8px 16px', fontSize: '13px' }}>Ver Flujos</button>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Estado del Sistema</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                        <span style={{ fontSize: '14px' }}>API: Conectada</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                        <span style={{ fontSize: '14px' }}>Base de Datos: Operativa</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
