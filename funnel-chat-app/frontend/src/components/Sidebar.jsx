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

const Sidebar = () => {
    return (
        <aside style={{
            width: '260px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderRight: '1px solid var(--surface-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 16px',
            height: '100vh',
            position: 'fixed'
        }}>
            <div style={{ marginBottom: '32px', padding: '0 12px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>FunnelChat</h1>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
                <SidebarItem icon={Users} label="Contactos" to="/contactos" />
                <SidebarItem icon={MessageSquare} label="Chats" to="/chats" />
                <SidebarItem icon={GitBranch} label="Flujos" to="/flujos" />
                <SidebarItem icon={Send} label="Difusión" to="/difusion" />
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                <SidebarItem icon={Settings} label="Configuración" to="/configuracion" />
                <SidebarItem icon={LogOut} label="Cerrar Sesión" to="/login" />
            </div>
        </aside>
    );
};

export default Sidebar;
