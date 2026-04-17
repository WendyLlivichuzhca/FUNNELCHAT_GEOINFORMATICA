import React, { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Phone, Globe, Lock, Eye, EyeOff, Save,
    Shield, Bell, Smartphone, CheckCircle, AlertCircle,
    Camera, Zap, Clock, LogOut, Trash2, MoreVertical,
    Plus, XCircle, Check, Building2, MessageSquare, Hash, AlignLeft
} from 'lucide-react';

const TIMEZONES = [
    'America/Guayaquil',
    'America/Bogota',
    'America/Lima',
    'America/Mexico_City',
    'America/Santiago',
    'America/Buenos_Aires',
    'America/Caracas',
    'America/La_Paz',
    'America/Asuncion',
    'America/Montevideo',
    'America/Panama',
    'America/Costa_Rica',
    'America/Guatemala',
    'America/Tegucigalpa',
    'America/Managua',
    'America/El_Salvador',
    'America/Santo_Domingo',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/Madrid',
    'Europe/London',
    'UTC',
];

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    const isSuccess = type === 'success';
    return (
        <div style={{
            position: 'fixed', top: '28px', right: '28px', zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '16px 24px', borderRadius: '16px',
            background: isSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
            animation: 'slide-in-right 0.5s cubic-bezier(0.16,1,0.3,1)',
        }}>
            <div style={{
                padding: '8px', borderRadius: '10px',
                background: isSuccess ? 'var(--success)' : '#ef4444',
                display: 'flex', boxShadow: isSuccess ? '0 0 15px rgba(16,185,129,0.4)' : '0 0 15px rgba(239,68,68,0.4)'
            }}>
                {isSuccess ? <CheckCircle size={20} color="white" /> : <AlertCircle size={20} color="white" />}
            </div>
            <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'white' }}>
                    {isSuccess ? '¡Éxito!' : 'Error'}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{message}</p>
            </div>
        </div>
    );
};

const SectionCard = ({ title, subtitle, icon: Icon, children }) => (
    <div className="glass-card animate-premium-entrance" style={{
        padding: '32px',
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px',
        marginBottom: '24px',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: 'var(--primary-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px -5px rgba(124,58,237,0.4)',
                flexShrink: 0
            }}>
                <Icon size={20} color="white" />
            </div>
            <div>
                <h3 style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>{title}</h3>
                {subtitle && <p style={{ fontFamily: 'var(--font-dm)', fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{subtitle}</p>}
            </div>
        </div>
        {children}
    </div>
);

const FormField = ({ label, children, hint }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontFamily: 'var(--font-dm)', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {label}
        </label>
        {children}
        {hint && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{hint}</p>}
    </div>
);

const Configuracion = () => {
    const [activeTab, setActiveTab] = useState('perfil');
    const [toast, setToast] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Perfil
    const [profile, setProfile] = useState({
        nombre: '',
        correo: '',
        whatsapp_personal: '',
        zona_horaria: 'America/Guayaquil',
        foto_perfil: '',
        rol: 'admin',
        creado_en: '',
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const avatarInputRef = useRef(null);

    // Contraseña
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // Dispositivos
    const [devices, setDevices] = useState([]);

    // Notificaciones
    const [notifications, setNotifications] = useState({
        nuevos_mensajes: true,
        nuevos_leads: true,
        campanas_completadas: true,
        actualizaciones_sistema: false,
        resumen_diario: true,
    });

    // Negocio
    const [negocio, setNegocio] = useState({
        nombre_negocio: '',
        logo_url: '',
        mensaje_bienvenida: '',
        mensaje_fuera_horario: '',
        idioma: 'es',
    });
    const [isSavingNegocio, setIsSavingNegocio] = useState(false);

    // Horarios
    const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const DIAS_LABEL = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };
    const [horarios, setHorarios] = useState(
        DIAS.reduce((acc, d) => ({ ...acc, [d]: { activo: d !== 'sabado' && d !== 'domingo', hora_inicio: '09:00', hora_fin: '18:00' } }), {})
    );
    const [isSavingHorarios, setIsSavingHorarios] = useState(false);

    // Respuestas Rápidas
    const [respuestas, setRespuestas] = useState([]);
    const [newRespuesta, setNewRespuesta] = useState({ atajo: '', contenido: '' });
    const [isAddingRespuesta, setIsAddingRespuesta] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        Promise.all([
            fetch('http://127.0.0.1:8000/api/profile', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('http://127.0.0.1:8000/api/devices', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('http://127.0.0.1:8000/api/configuracion', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('http://127.0.0.1:8000/api/horarios', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('http://127.0.0.1:8000/api/respuestas-rapidas', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ])
            .then(([profileData, devicesData, configData, horariosData, respuestasData]) => {
                if (profileData && !profileData.detail) setProfile(profileData);
                if (Array.isArray(devicesData)) setDevices(devicesData);
                if (configData && !configData.detail) setNegocio(prev => ({ ...prev, ...configData }));
                if (Array.isArray(horariosData)) {
                    setHorarios(prev => {
                        const updated = { ...prev };
                        horariosData.forEach(h => {
                            if (updated[h.dia_semana]) {
                                updated[h.dia_semana] = { activo: h.activo, hora_inicio: h.hora_inicio, hora_fin: h.hora_fin };
                            }
                        });
                        return updated;
                    });
                }
                if (Array.isArray(respuestasData)) setRespuestas(respuestasData);
            })
            .catch(err => console.error('Error cargando configuración:', err))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    nombre: profile.nombre,
                    whatsapp_personal: profile.whatsapp_personal,
                    zona_horaria: profile.zona_horaria,
                    foto_perfil: profile.foto_perfil,
                }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                localStorage.setItem('username', profile.nombre);
                showToast('Perfil actualizado correctamente');
            } else {
                showToast(data.detail || 'Error al guardar perfil', 'error');
            }
        } catch {
            showToast('Error de conexión con el servidor', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            showToast('Completa todos los campos de contraseña', 'error');
            return;
        }
        if (passwords.new !== passwords.confirm) {
            showToast('Las contraseñas nuevas no coinciden', 'error');
            return;
        }
        if (passwords.new.length < 6) {
            showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        setIsSavingPassword(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ current_password: passwords.current, new_password: passwords.new }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                setPasswords({ current: '', new: '', confirm: '' });
                showToast('Contraseña actualizada correctamente');
            } else {
                showToast(data.detail || 'Contraseña actual incorrecta', 'error');
            }
        } catch {
            showToast('Error de conexión con el servidor', 'error');
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('La imagen no puede superar 2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfile(prev => ({ ...prev, foto_perfil: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSaveNegocio = async () => {
        setIsSavingNegocio(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/configuracion', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(negocio),
            });
            const data = await res.json();
            if (data.status === 'success') showToast('Configuración de negocio guardada');
            else showToast(data.detail || 'Error al guardar', 'error');
        } catch { showToast('Error de conexión', 'error'); }
        finally { setIsSavingNegocio(false); }
    };

    const handleSaveHorarios = async () => {
        setIsSavingHorarios(true);
        try {
            const token = localStorage.getItem('token');
            const payload = Object.entries(horarios).map(([dia, h]) => ({
                dia_semana: dia,
                hora_inicio: h.hora_inicio,
                hora_fin: h.hora_fin,
                activo: h.activo,
            }));
            const res = await fetch('http://127.0.0.1:8000/api/horarios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.status === 'success') showToast('Horarios de atención guardados');
            else showToast(data.detail || 'Error al guardar', 'error');
        } catch { showToast('Error de conexión', 'error'); }
        finally { setIsSavingHorarios(false); }
    };

    const handleAddRespuesta = async () => {
        if (!newRespuesta.atajo.trim() || !newRespuesta.contenido.trim()) {
            showToast('Completa el atajo y el contenido', 'error');
            return;
        }
        setIsAddingRespuesta(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://127.0.0.1:8000/api/respuestas-rapidas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newRespuesta),
            });
            const data = await res.json();
            if (data.id) {
                setRespuestas(prev => [...prev, data]);
                setNewRespuesta({ atajo: '', contenido: '' });
                showToast('Respuesta rápida creada');
            } else showToast(data.detail || 'Error al crear', 'error');
        } catch { showToast('Error de conexión', 'error'); }
        finally { setIsAddingRespuesta(false); }
    };

    const handleDeleteRespuesta = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://127.0.0.1:8000/api/respuestas-rapidas/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setRespuestas(prev => prev.filter(r => r.id !== id));
            showToast('Respuesta eliminada');
        } catch { showToast('Error al eliminar', 'error'); }
    };

    const tabs = [
        { id: 'perfil', label: 'Perfil', icon: User },
        { id: 'seguridad', label: 'Seguridad', icon: Shield },
        { id: 'dispositivos', label: 'Dispositivos', icon: Smartphone },
        { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
        { id: 'negocio', label: 'Negocio', icon: Building2 },
        { id: 'horarios', label: 'Horarios', icon: Clock },
        { id: 'respuestas', label: 'Respuestas Rápidas', icon: MessageSquare },
    ];

    const createdDate = profile.creado_en
        ? new Date(profile.creado_en).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%' }} className="animate-spin" />
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '860px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <header style={{ marginBottom: '36px' }}>
                <h2 className="heading-xl" style={{ fontSize: '28px', marginBottom: '6px' }}>Configuración</h2>
                <p className="text-main">Personaliza tu cuenta y gestiona tus preferencias.</p>
            </header>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: '4px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px', padding: '6px',
                marginBottom: '32px',
                width: 'fit-content'
            }}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                fontFamily: 'var(--font-dm)', fontSize: '13px', fontWeight: '700',
                                transition: 'all 0.25s ease',
                                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--text-muted)',
                                boxShadow: isActive ? '0 8px 20px -5px rgba(124,58,237,0.4)' : 'none',
                            }}
                        >
                            <tab.icon size={15} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ===== TAB PERFIL ===== */}
            {activeTab === 'perfil' && (
                <>
                    <SectionCard title="Información Personal" subtitle="Tu identidad pública en la plataforma" icon={User}>
                        {/* Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginBottom: '32px', paddingBottom: '28px', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={{
                                    width: '88px', height: '88px', borderRadius: '22px',
                                    background: profile.foto_perfil ? 'transparent' : 'var(--primary-gradient)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '32px', fontWeight: '900', color: 'white',
                                    fontFamily: 'var(--font-syne)',
                                    overflow: 'hidden',
                                    boxShadow: '0 12px 30px -8px rgba(124,58,237,0.5)',
                                    border: '2px solid rgba(124,58,237,0.2)'
                                }}>
                                    {profile.foto_perfil
                                        ? <img src={profile.foto_perfil} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : (profile.nombre?.[0] || 'U').toUpperCase()
                                    }
                                </div>
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    style={{
                                        position: 'absolute', bottom: '-6px', right: '-6px',
                                        width: '30px', height: '30px', borderRadius: '50%',
                                        background: 'var(--primary-gradient)', border: '2px solid #080b12',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.4)'
                                    }}
                                >
                                    <Camera size={13} color="white" />
                                </button>
                                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                            </div>
                            <div>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 4px' }}>{profile.nombre || 'Sin nombre'}</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 12px' }}>{profile.correo}</p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 12px', borderRadius: '100px', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                        {profile.rol || 'Admin'}
                                    </span>
                                    <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 12px', borderRadius: '100px', background: 'rgba(16,217,160,0.08)', color: '#10d9a0', border: '1px solid rgba(16,217,160,0.2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                        Plan Premium
                                    </span>
                                </div>
                            </div>
                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Miembro desde</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-subtitle)', margin: 0, fontWeight: '600' }}>{createdDate}</p>
                            </div>
                        </div>

                        {/* Fields Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                            <FormField label="Nombre completo">
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        value={profile.nombre}
                                        onChange={e => setProfile(p => ({ ...p, nombre: e.target.value }))}
                                        className="input-styled"
                                        style={{ width: '100%', paddingLeft: '46px', fontSize: '14px' }}
                                        placeholder="Tu nombre"
                                    />
                                </div>
                            </FormField>

                            <FormField label="Correo electrónico" hint="El correo no puede modificarse">
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="email"
                                        value={profile.correo}
                                        disabled
                                        className="input-styled"
                                        style={{ width: '100%', paddingLeft: '46px', fontSize: '14px', opacity: 0.5, cursor: 'not-allowed' }}
                                    />
                                </div>
                            </FormField>

                            <FormField label="WhatsApp Personal" hint="Número con código de país (Ej: 593987654321)">
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        value={profile.whatsapp_personal}
                                        onChange={e => setProfile(p => ({ ...p, whatsapp_personal: e.target.value }))}
                                        className="input-styled"
                                        style={{ width: '100%', paddingLeft: '46px', fontSize: '14px' }}
                                        placeholder="593987654321"
                                    />
                                </div>
                            </FormField>

                            <FormField label="Zona Horaria">
                                <div style={{ position: 'relative' }}>
                                    <Globe size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }} />
                                    <select
                                        value={profile.zona_horaria}
                                        onChange={e => setProfile(p => ({ ...p, zona_horaria: e.target.value }))}
                                        className="input-styled"
                                        style={{
                                            width: '100%', paddingLeft: '46px', fontSize: '14px',
                                            appearance: 'none', cursor: 'pointer',
                                            background: 'var(--bg-card)'
                                        }}
                                    >
                                        {TIMEZONES.map(tz => (
                                            <option key={tz} value={tz} style={{ background: '#1a1a2e' }}>{tz}</option>
                                        ))}
                                    </select>
                                </div>
                            </FormField>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="btn-primary"
                                style={{ height: '46px', minWidth: '180px', opacity: isSavingProfile ? 0.7 : 1 }}
                            >
                                {isSavingProfile ? (
                                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                                ) : (
                                    <Save size={17} />
                                )}
                                {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </SectionCard>
                </>
            )}

            {/* ===== TAB SEGURIDAD ===== */}
            {activeTab === 'seguridad' && (
                <>
                    <SectionCard title="Cambiar Contraseña" subtitle="Usa una contraseña fuerte de al menos 6 caracteres" icon={Lock}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px' }}>
                            {[
                                { key: 'current', label: 'Contraseña Actual', placeholder: '••••••••' },
                                { key: 'new', label: 'Nueva Contraseña', placeholder: '••••••••' },
                                { key: 'confirm', label: 'Confirmar Nueva Contraseña', placeholder: '••••••••' },
                            ].map(field => (
                                <FormField key={field.key} label={field.label}>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            type={showPasswords[field.key] ? 'text' : 'password'}
                                            value={passwords[field.key]}
                                            onChange={e => setPasswords(p => ({ ...p, [field.key]: e.target.value }))}
                                            className="input-styled"
                                            style={{ width: '100%', paddingLeft: '46px', paddingRight: '46px', fontSize: '14px' }}
                                            placeholder={field.placeholder}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => ({ ...p, [field.key]: !p[field.key] }))}
                                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
                                        >
                                            {showPasswords[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </FormField>
                            ))}

                            {/* Requisitos */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', padding: '16px 20px', border: '1px solid var(--border-subtle)' }}>
                                <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 12px' }}>Requisitos de contraseña</p>
                                {[
                                    { text: 'Mínimo 6 caracteres', met: passwords.new.length >= 6 },
                                    { text: 'Las contraseñas nuevas coinciden', met: passwords.new && passwords.new === passwords.confirm },
                                ].map((req, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: req.met ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${req.met ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {req.met && <Check size={10} color="#10d9a0" strokeWidth={3} />}
                                        </div>
                                        <span style={{ fontSize: '12px', color: req.met ? '#10d9a0' : 'var(--text-muted)', fontWeight: req.met ? '700' : '500' }}>{req.text}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleChangePassword}
                                disabled={isSavingPassword}
                                className="btn-primary"
                                style={{ height: '46px', opacity: isSavingPassword ? 0.7 : 1, alignSelf: 'flex-start', minWidth: '200px' }}
                            >
                                {isSavingPassword ? (
                                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                                ) : (
                                    <Shield size={17} />
                                )}
                                {isSavingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </button>
                        </div>
                    </SectionCard>

                    {/* Sesiones activas */}
                    <SectionCard title="Sesión Activa" subtitle="Información sobre tu sesión actual" icon={Zap}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '16px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={20} color="#10d9a0" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 2px' }}>Sesión Web Activa</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Token válido por 7 días</p>
                                </div>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '800', padding: '5px 14px', borderRadius: '100px', background: 'rgba(16,185,129,0.1)', color: '#10d9a0', border: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Activa
                            </span>
                        </div>
                    </SectionCard>
                </>
            )}

            {/* ===== TAB DISPOSITIVOS ===== */}
            {activeTab === 'dispositivos' && (
                <SectionCard title="Dispositivos WhatsApp" subtitle="Administra los números de WhatsApp vinculados a tu cuenta" icon={Smartphone}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {devices.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <Smartphone size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                <p style={{ fontSize: '14px', fontWeight: '600' }}>No hay dispositivos vinculados</p>
                                <p style={{ fontSize: '12px', marginTop: '4px' }}>Ve al Dashboard para conectar un número de WhatsApp.</p>
                            </div>
                        ) : (
                            devices.map(device => {
                                const isConnected = device.status?.toLowerCase() === 'conectado';
                                const statusColor = isConnected ? '#10d9a0' : '#ef4444';
                                return (
                                    <div
                                        key={device.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '20px 24px', borderRadius: '18px',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${isConnected ? 'rgba(16,217,160,0.15)' : 'var(--border-subtle)'}`,
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                            <div style={{
                                                width: '48px', height: '48px', borderRadius: '14px',
                                                background: isConnected ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${isConnected ? 'rgba(124,58,237,0.2)' : 'var(--border-subtle)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Smartphone size={22} color={isConnected ? '#7c3aed' : '#64748b'} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 4px' }}>
                                                    {device.device_name || device.nombre}
                                                </p>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                                                    {device.phone ? `+${device.phone}` : 'Sin número registrado'}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}60` }} />
                                                <span style={{ fontSize: '11px', fontWeight: '800', color: statusColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {device.status || 'Desconectado'}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '10px', fontWeight: '800', padding: '5px 14px', borderRadius: '100px',
                                                background: `${statusColor}15`, color: statusColor,
                                                border: `1px solid ${statusColor}30`, textTransform: 'uppercase', letterSpacing: '0.8px'
                                            }}>
                                                {isConnected ? 'En línea' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={13} color="var(--primary)" />
                                Para conectar o desconectar dispositivos, ve al <a href="/" style={{ color: '#a78bfa', fontWeight: '700', textDecoration: 'none' }}>Dashboard</a>.
                            </p>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ===== TAB NOTIFICACIONES ===== */}
            {activeTab === 'notificaciones' && (
                <SectionCard title="Preferencias de Notificación" subtitle="Controla qué alertas quieres recibir" icon={Bell}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[
                            { key: 'nuevos_mensajes', label: 'Nuevos mensajes de WhatsApp', desc: 'Notificación cuando llegue un mensaje nuevo' },
                            { key: 'nuevos_leads', label: 'Nuevos leads sincronizados', desc: 'Cuando se sincroniza un nuevo contacto' },
                            { key: 'campanas_completadas', label: 'Campañas completadas', desc: 'Cuando una campaña de difusión termina' },
                            { key: 'resumen_diario', label: 'Resumen diario de actividad', desc: 'Reporte diario de conversaciones y métricas' },
                            { key: 'actualizaciones_sistema', label: 'Actualizaciones del sistema', desc: 'Nuevas funcionalidades y mantenimientos' },
                        ].map(item => (
                            <div
                                key={item.key}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '18px 20px', borderRadius: '14px',
                                    transition: 'background 0.2s ease',
                                    cursor: 'pointer',
                                }}
                                className="hover:bg-white/5"
                                onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                            >
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 3px' }}>{item.label}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
                                </div>
                                {/* Toggle switch */}
                                <div
                                    style={{
                                        width: '48px', height: '26px', borderRadius: '100px',
                                        background: notifications[item.key] ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)',
                                        border: `1px solid ${notifications[item.key] ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                                        position: 'relative', cursor: 'pointer', flexShrink: 0,
                                        transition: 'all 0.3s ease',
                                        boxShadow: notifications[item.key] ? '0 4px 12px rgba(124,58,237,0.3)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '3px',
                                        left: notifications[item.key] ? 'calc(100% - 23px)' : '3px',
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        background: notifications[item.key] ? 'white' : 'rgba(255,255,255,0.3)',
                                        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => showToast('Preferencias de notificación guardadas')}
                            className="btn-primary"
                            style={{ height: '46px', minWidth: '180px' }}
                        >
                            <Save size={17} />
                            Guardar Preferencias
                        </button>
                    </div>
                </SectionCard>
            )}

            {/* ===== TAB NEGOCIO ===== */}
            {activeTab === 'negocio' && (
                <SectionCard title="Información del Negocio" subtitle="Datos generales de tu empresa en la plataforma" icon={Building2}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <FormField label="Nombre del Negocio">
                                <div style={{ position: 'relative' }}>
                                    <Building2 size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        value={negocio.nombre_negocio}
                                        onChange={e => setNegocio(p => ({ ...p, nombre_negocio: e.target.value }))}
                                        className="input-styled"
                                        style={{ width: '100%', paddingLeft: '46px', fontSize: '14px' }}
                                        placeholder="Mi Empresa S.A."
                                    />
                                </div>
                            </FormField>
                            <FormField label="Idioma" hint="Idioma de la interfaz">
                                <div style={{ position: 'relative' }}>
                                    <Globe size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', zIndex: 1 }} />
                                    <select
                                        value={negocio.idioma}
                                        onChange={e => setNegocio(p => ({ ...p, idioma: e.target.value }))}
                                        className="input-styled"
                                        style={{ width: '100%', paddingLeft: '46px', fontSize: '14px', appearance: 'none', cursor: 'pointer', background: 'var(--bg-card)' }}
                                    >
                                        <option value="es" style={{ background: '#1a1a2e' }}>Español</option>
                                        <option value="en" style={{ background: '#1a1a2e' }}>English</option>
                                        <option value="pt" style={{ background: '#1a1a2e' }}>Português</option>
                                    </select>
                                </div>
                            </FormField>
                        </div>

                        <FormField label="URL del Logo" hint="Enlace público a la imagen del logo de tu negocio">
                            <div style={{ position: 'relative' }}>
                                <Globe size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="url"
                                    value={negocio.logo_url}
                                    onChange={e => setNegocio(p => ({ ...p, logo_url: e.target.value }))}
                                    className="input-styled"
                                    style={{ width: '100%', paddingLeft: '46px', fontSize: '14px' }}
                                    placeholder="https://ejemplo.com/logo.png"
                                />
                            </div>
                            {negocio.logo_url && (
                                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img
                                        src={negocio.logo_url}
                                        alt="logo preview"
                                        style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.04)' }}
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vista previa del logo</span>
                                </div>
                            )}
                        </FormField>

                        <FormField label="Mensaje de Bienvenida" hint="Se envía automáticamente cuando un nuevo contacto inicia conversación">
                            <div style={{ position: 'relative' }}>
                                <AlignLeft size={16} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} />
                                <textarea
                                    value={negocio.mensaje_bienvenida}
                                    onChange={e => setNegocio(p => ({ ...p, mensaje_bienvenida: e.target.value }))}
                                    className="input-styled"
                                    rows={3}
                                    style={{ width: '100%', paddingLeft: '46px', fontSize: '14px', resize: 'vertical', minHeight: '88px' }}
                                    placeholder="¡Hola! Bienvenido a nuestro servicio. ¿En qué podemos ayudarte hoy?"
                                />
                            </div>
                        </FormField>

                        <FormField label="Mensaje Fuera de Horario" hint="Se envía cuando se recibe un mensaje fuera del horario de atención">
                            <div style={{ position: 'relative' }}>
                                <Clock size={16} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} />
                                <textarea
                                    value={negocio.mensaje_fuera_horario}
                                    onChange={e => setNegocio(p => ({ ...p, mensaje_fuera_horario: e.target.value }))}
                                    className="input-styled"
                                    rows={3}
                                    style={{ width: '100%', paddingLeft: '46px', fontSize: '14px', resize: 'vertical', minHeight: '88px' }}
                                    placeholder="Gracias por contactarnos. Nuestro horario es de lunes a viernes de 9:00 a 18:00. Te responderemos pronto."
                                />
                            </div>
                        </FormField>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSaveNegocio}
                                disabled={isSavingNegocio}
                                className="btn-primary"
                                style={{ height: '46px', minWidth: '180px', opacity: isSavingNegocio ? 0.7 : 1 }}
                            >
                                {isSavingNegocio
                                    ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                                    : <Save size={17} />
                                }
                                {isSavingNegocio ? 'Guardando...' : 'Guardar Negocio'}
                            </button>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ===== TAB HORARIOS ===== */}
            {activeTab === 'horarios' && (
                <SectionCard title="Horarios de Atención" subtitle="Define cuándo está disponible tu equipo para atender chats" icon={Clock}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                        {DIAS.map(dia => {
                            const h = horarios[dia] || { activo: false, hora_inicio: '09:00', hora_fin: '18:00' };
                            return (
                                <div
                                    key={dia}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '20px',
                                        padding: '18px 24px', borderRadius: '16px',
                                        background: h.activo ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${h.activo ? 'rgba(124,58,237,0.2)' : 'var(--border-subtle)'}`,
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {/* Toggle */}
                                    <div
                                        onClick={() => setHorarios(prev => ({ ...prev, [dia]: { ...prev[dia], activo: !prev[dia].activo } }))}
                                        style={{
                                            width: '44px', height: '24px', borderRadius: '100px',
                                            background: h.activo ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)',
                                            border: `1px solid ${h.activo ? 'rgba(124,58,237,0.3)' : 'var(--border-subtle)'}`,
                                            position: 'relative', cursor: 'pointer', flexShrink: 0,
                                            transition: 'all 0.3s ease',
                                            boxShadow: h.activo ? '0 4px 12px rgba(124,58,237,0.3)' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute', top: '3px',
                                            left: h.activo ? 'calc(100% - 21px)' : '3px',
                                            width: '16px', height: '16px', borderRadius: '50%',
                                            background: h.activo ? 'white' : 'rgba(255,255,255,0.3)',
                                            transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                        }} />
                                    </div>

                                    {/* Day name */}
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: h.activo ? '#f1f5f9' : 'var(--text-muted)', minWidth: '90px', transition: 'color 0.3s' }}>
                                        {DIAS_LABEL[dia]}
                                    </span>

                                    {/* Time inputs */}
                                    {h.activo ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                            <Clock size={14} color="var(--text-secondary)" />
                                            <input
                                                type="time"
                                                value={h.hora_inicio}
                                                onChange={e => setHorarios(prev => ({ ...prev, [dia]: { ...prev[dia], hora_inicio: e.target.value } }))}
                                                className="input-styled"
                                                style={{ width: '120px', fontSize: '13px', padding: '8px 12px', height: '38px' }}
                                            />
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>hasta</span>
                                            <input
                                                type="time"
                                                value={h.hora_fin}
                                                onChange={e => setHorarios(prev => ({ ...prev, [dia]: { ...prev[dia], hora_fin: e.target.value } }))}
                                                className="input-styled"
                                                style={{ width: '120px', fontSize: '13px', padding: '8px 12px', height: '38px' }}
                                            />
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Cerrado</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleSaveHorarios}
                            disabled={isSavingHorarios}
                            className="btn-primary"
                            style={{ height: '46px', minWidth: '200px', opacity: isSavingHorarios ? 0.7 : 1 }}
                        >
                            {isSavingHorarios
                                ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                                : <Save size={17} />
                            }
                            {isSavingHorarios ? 'Guardando...' : 'Guardar Horarios'}
                        </button>
                    </div>
                </SectionCard>
            )}

            {/* ===== TAB RESPUESTAS RÁPIDAS ===== */}
            {activeTab === 'respuestas' && (
                <SectionCard title="Respuestas Rápidas" subtitle="Crea atajos de texto para mensajes frecuentes" icon={MessageSquare}>
                    {/* Add new */}
                    <div style={{ background: 'rgba(124,58,237,0.04)', borderRadius: '18px', border: '1px solid rgba(124,58,237,0.15)', padding: '24px', marginBottom: '28px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 20px' }}>Crear Nueva Respuesta</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px', alignItems: 'start' }}>
                            <FormField label="Atajo" hint="Ej: /bienvenida">
                                <div style={{ position: 'relative' }}>
                                    <Hash size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        value={newRespuesta.atajo}
                                        onChange={e => setNewRespuesta(p => ({ ...p, atajo: e.target.value }))}
                                        className="input-styled"
                                        style={{ width: '100%', paddingLeft: '38px', fontSize: '13px' }}
                                        placeholder="/atajo"
                                    />
                                </div>
                            </FormField>
                            <FormField label="Contenido del Mensaje">
                                <div style={{ position: 'relative' }}>
                                    <AlignLeft size={15} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-secondary)' }} />
                                    <textarea
                                        value={newRespuesta.contenido}
                                        onChange={e => setNewRespuesta(p => ({ ...p, contenido: e.target.value }))}
                                        className="input-styled"
                                        rows={2}
                                        style={{ width: '100%', paddingLeft: '38px', fontSize: '13px', resize: 'vertical', minHeight: '70px' }}
                                        placeholder="Escribe el mensaje completo aquí..."
                                    />
                                </div>
                            </FormField>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleAddRespuesta}
                                disabled={isAddingRespuesta}
                                className="btn-primary"
                                style={{ height: '40px', minWidth: '160px', opacity: isAddingRespuesta ? 0.7 : 1 }}
                            >
                                {isAddingRespuesta
                                    ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                                    : <Plus size={15} />
                                }
                                {isAddingRespuesta ? 'Creando...' : 'Añadir Respuesta'}
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {respuestas.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Sin respuestas rápidas todavía</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Crea tu primera respuesta rápida arriba.</p>
                            </div>
                        ) : respuestas.map(r => (
                            <div
                                key={r.id}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '16px',
                                    padding: '18px 20px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-subtle)',
                                    transition: 'border-color 0.2s ease',
                                }}
                            >
                                <div style={{
                                    flexShrink: 0, padding: '6px 12px', borderRadius: '8px',
                                    background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                                }}>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#a78bfa', fontFamily: 'monospace' }}>
                                        {r.atajo}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '13px', color: '#f1f5f9', margin: 0, lineHeight: '1.5', wordBreak: 'break-word' }}>
                                        {r.contenido}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteRespuesta(r.id)}
                                    style={{
                                        flexShrink: 0, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                                        borderRadius: '10px', padding: '8px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#ef4444', transition: 'all 0.2s ease',
                                    }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {respuestas.length > 0 && (
                        <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                            <p style={{ fontSize: '12px', color: '#10d9a0', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={13} />
                                Usa estos atajos escribiendo "/" en el chat para insertar respuestas rápidas al instante.
                            </p>
                        </div>
                    )}
                </SectionCard>
            )}
        </div>
    );
};

export default Configuracion;
