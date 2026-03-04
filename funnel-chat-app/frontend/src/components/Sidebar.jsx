import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    Users,
    GitBranch,
    Send,
    Settings,
    LogOut
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
        style={{ textDecoration: 'none' }}
    >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
    </NavLink>
);

const Sidebar = ({ username, onLogout }) => {
    return (
        <aside style={{
            width: '260px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderRight: '1px solid var(--surface-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 16px',
            height: '100vh',
            position: 'fixed',
            zIndex: 100
        }}>
            <div style={{ marginBottom: '32px', padding: '0 12px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '-0.02em' }}>FunnelChat</h1>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
                <SidebarItem icon={Users} label="Contactos" to="/contactos" />
                <SidebarItem icon={MessageSquare} label="Chats" to="/chats" />
                <SidebarItem icon={GitBranch} label="Flujos" to="/flujos" />
                <SidebarItem icon={Send} label="Difusión" to="/difusion" />
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                <div style={{
                    padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                    marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'var(--primary-gradient)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                    }}>
                        {username ? username[0].toUpperCase() : 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {username || 'Usuario'}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Plan Premium</p>
                    </div>
                </div>
                <SidebarItem icon={Settings} label="Configuración" to="/configuracion" />
                <div
                    onClick={onLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                        borderRadius: '8px', cursor: 'pointer', color: '#f87171',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                    <LogOut size={20} />
                    <span style={{ fontWeight: '500' }}>Cerrar Sesión</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
