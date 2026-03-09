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
        className={({ isActive }) => `group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 relative ${isActive
            ? 'bg-[rgba(124,58,237,0.08)] text-[#a78bfa]'
            : 'text-[#64748b] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#f1f5f9]'
            }`}
        style={{ textDecoration: 'none' }}
    >
        {({ isActive }) => (
            <>
                {isActive && (
                    <div style={{
                        position: 'absolute', left: '-20px', top: '20%', bottom: '20%',
                        width: '3px', background: '#7c3aed', borderRadius: '0 4px 4px 0',
                        boxShadow: '0 0 10px rgba(124, 58, 237, 0.8)'
                    }} />
                )}
                <Icon size={19} className={isActive ? 'text-[#7c3aed]' : 'text-[#475569] group-hover:text-[#94a3b8] transition-colors'} />
                <span style={{
                    fontFamily: 'var(--font-dm)',
                    fontSize: '14px',
                    fontWeight: isActive ? '700' : '500',
                    letterSpacing: '0.01em'
                }}>{label}</span>
            </>
        )}
    </NavLink>
);

const SectionLabel = ({ label }) => (
    <div style={{
        fontSize: '10px',
        fontWeight: '800',
        color: 'rgba(100, 116, 139, 0.5)',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        margin: '24px 0 12px 12px'
    }}>
        {label}
    </div>
);

const Sidebar = ({ username, onLogout }) => {
    return (
        <aside style={{
            width: '260px',
            backgroundColor: '#080b12',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            padding: '36px 20px',
            height: '100vh',
            position: 'fixed',
            zIndex: 100
        }}>
            <div style={{ marginBottom: '40px', padding: '0 12px' }}>
                <h1 style={{
                    fontFamily: 'var(--font-syne)',
                    fontSize: '22px',
                    fontWeight: '800',
                    color: '#fff',
                    letterSpacing: '-0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GitBranch size={18} color="white" />
                    </div>
                    FunnelChat
                </h1>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <SectionLabel label="Principal" />
                <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
                <SidebarItem icon={Users} label="Contactos" to="/contactos" />
                <SidebarItem icon={MessageSquare} label="Chats" to="/chats" />

                <SectionLabel label="Automatización" />
                <SidebarItem icon={GitBranch} label="Flujos" to="/flujos" />
                <SidebarItem icon={Send} label="Difusión" to="/difusion" />
            </nav>

            <div style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingTop: '24px'
            }}>
                <div style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.04)',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    position: 'relative'
                }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: 'white',
                            fontSize: '15px',
                            fontFamily: 'var(--font-syne)'
                        }}>
                            {username ? username[0].toUpperCase() : 'U'}
                        </div>
                        <div style={{
                            position: 'absolute', bottom: '-2px', right: '-2px',
                            width: '12px', height: '12px', background: '#10d9a0',
                            borderRadius: '50%', border: '2px solid #080b12',
                            animation: 'pulse-green 2s infinite'
                        }} title="En línea" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {username || 'Administrador'}
                        </p>
                        <p style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan Premium</p>
                    </div>
                </div>

                <SidebarItem icon={Settings} label="Configuración" to="/configuracion" />

                <div
                    onClick={onLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'rgba(239, 68, 68, 0.7)',
                        transition: 'all 0.3s',
                        fontSize: '13px',
                        fontWeight: '700'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                        e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)';
                    }}
                >
                    <LogOut size={17} />
                    <span>Cerrar Sesión</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
