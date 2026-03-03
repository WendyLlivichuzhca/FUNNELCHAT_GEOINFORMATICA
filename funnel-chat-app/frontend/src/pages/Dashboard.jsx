import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Zap } from 'lucide-react';

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

    useEffect(() => {
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
    }, []);

    return (
        <div>
            <header style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Bienvenido, Usuario</h2>
                <p style={{ color: 'var(--text-muted)' }}>Aquí tienes el resumen de tu funnel hoy.</p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px'
            }}>
                <StatCard icon={Users} label="Total Leads" value={stats.leads} color="#6366f1" />
                <StatCard icon={MessageSquare} label="Conversaciones" value={stats.conversations} color="#10b981" />
                <StatCard icon={TrendingUp} label="Tasa de Conv." value={stats.conversion_rate} color="#f59e0b" />
                <StatCard icon={Zap} label="Automatizaciones" value={stats.automations} color="#ec4899" />
            </div>

            <section style={{ marginTop: '48px' }}>
                <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Próximos Pasos</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 24px' }}>
                        Tu entorno está listo. Ahora podemos empezar a configurar el constructor de flujos o importar tus primeros contactos.
                    </p>
                    <button className="btn btn-primary">Configurar primer Flujo</button>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
