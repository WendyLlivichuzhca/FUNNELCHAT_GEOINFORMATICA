import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, UserPlus, RefreshCw, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:8000', {
    transports: ['websocket']
});

const Contactos = () => {
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [editNote, setEditNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSyncToast, setShowSyncToast] = useState(false);
    const [syncCount, setSyncCount] = useState(0);

    const fetchContacts = useCallback(() => {
        const token = localStorage.getItem('token');
        fetch('http://127.0.0.1:8000/api/contacts', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setContacts(data);
                }
            })
            .catch(err => console.error("Error fetching contacts:", err));
    }, []);

    useEffect(() => {
        fetchContacts();

        // Escuchar actualizaciones en tiempo real
        socket.on('contacts_updated', (data) => {
            console.log("¡Contactos actualizados en tiempo real!", data);
            setSyncCount(data.count || 0);
            setShowSyncToast(true);
            fetchContacts();

            // Ocultar notificación después de 5 segundos
            setTimeout(() => setShowSyncToast(false), 5000);
        });

        return () => {
            socket.off('contacts_updated');
        };
    }, [fetchContacts]);

    const filteredContacts = contacts.filter(contact => {
        const searchStr = (contact.name + ' ' + (contact.phone || contact.email || '')).toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'Todos' || contact.status === activeFilter || contact.tag === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        setEditNote(contact.notes || '');
    };

    const saveContactChanges = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://127.0.0.1:8000/api/contacts/${selectedContact.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notes: editNote })
            });
            if (response.ok) {
                // Actualizar lista local
                setContacts(contacts.map(c =>
                    c.id === selectedContact.id ? { ...c, notes: editNote } : c
                ));
                alert('Cambios guardados correctamente');
            }
        } catch (err) {
            console.error("Error saving contact:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ position: 'relative' }}>
            {/* Notificación de Sincronización Real-time */}
            {showSyncToast && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    backgroundColor: 'rgba(16, 185, 129, 0.95)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 2000,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    animation: 'slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        padding: '6px',
                        display: 'flex'
                    }}>
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>¡Sincronización Completada!</p>
                        <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>Se han añadido {syncCount} contactos nuevos.</p>
                    </div>
                </div>
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>Gestión de Contactos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Administra y segmenta tus leads fácilmente.</p>
                </div>
                <button className="btn btn-primary">
                    <UserPlus size={18} />
                    Nuevo Contacto
                </button>
            </header>

            <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                padding: '12px 12px 12px 42px',
                                color: 'white',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Todos', 'WhatsApp', 'Caliente', 'Tibio', 'Frío', 'Nuevo'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className="btn"
                                style={{
                                    background: activeFilter === filter ? 'var(--primary)' : 'var(--glass)',
                                    border: '1px solid var(--glass-border)',
                                    color: activeFilter === filter ? 'white' : 'var(--text-muted)',
                                    padding: '8px 16px',
                                    fontSize: '13px'
                                }}
                            >
                                {filter === 'WhatsApp' ? '📱 WhatsApp' : filter}
                            </button>
                        ))}
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                            <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Nombre</th>
                            <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Teléfono / Email</th>
                            <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Estado</th>
                            <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Etiqueta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContacts.map(contact => (
                            <tr
                                key={contact.id}
                                onClick={() => handleSelectContact(contact)}
                                style={{
                                    borderBottom: '1px solid var(--surface-border)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '16px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                            {contact.name.charAt(0)}
                                        </div>
                                        {contact.name}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    {contact.phone ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ color: '#25D366', fontSize: '12px' }}>WA</span>
                                            +{contact.phone}
                                        </span>
                                    ) : (contact.email || '-')}
                                </td>
                                <td style={{ padding: '16px 12px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        backgroundColor: contact.status === 'Caliente' ? 'rgba(239, 68, 68, 0.1)' : contact.status === 'Tibio' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                        color: contact.status === 'Caliente' ? '#ef4444' : contact.status === 'Tibio' ? '#f59e0b' : '#3b82f6',
                                        border: `1px solid ${contact.status === 'Caliente' ? 'rgba(239, 68, 68, 0.2)' : contact.status === 'Tibio' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                                    }}>
                                        {contact.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 12px' }}>
                                    <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {contact.tag}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredContacts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No se encontraron contactos que coincidan con tu búsqueda.
                    </div>
                )}
            </div>

            {/* Slide-over Detail Panel */}
            {selectedContact && (
                <div
                    style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(4px)' }}
                    onClick={() => setSelectedContact(null)}
                >
                    <div
                        className="glass-card animate-slide-in"
                        style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0, width: '450px',
                            background: 'var(--surface)', padding: '40px', borderLeft: '1px solid var(--glass-border)',
                            display: 'flex', flexDirection: 'column', gap: '32px'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                                    {selectedContact.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedContact.name}</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>{selectedContact.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedContact(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ESTADO</p>
                                <p style={{ fontWeight: 'bold', color: selectedContact.status === 'Caliente' ? '#ef4444' : '#3b82f6' }}>{selectedContact.status}</p>
                            </div>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ETIQUETA</p>
                                <p style={{ fontWeight: 'bold' }}>{selectedContact.tag}</p>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Notas Internas</h4>
                            <textarea
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="Añade una nota sobre este contacto..."
                                style={{
                                    width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                                    borderRadius: '12px', padding: '16px', color: 'white', minHeight: '120px', resize: 'none', outline: 'none'
                                }}
                            />
                            <button
                                onClick={saveContactChanges}
                                disabled={isSaving}
                                className="btn btn-primary"
                                style={{ marginTop: '12px', width: '100%', fontSize: '13px' }}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Nota'}
                            </button>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }}>Enviar Mensaje</button>
                            <button className="btn" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', flex: 1 }}>Ver Historial</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contactos;
