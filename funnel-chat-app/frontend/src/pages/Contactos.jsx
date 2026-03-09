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
            setTimeout(() => setShowSyncToast(false), 5000);
        });

        socket.on('whatsapp_contacts', (data) => {
            if (data.is_batch) {
                setContacts(prev => {
                    const existingIds = new Set(prev.map(c => c.id || c.whatsapp_id));
                    const newOnes = data.contacts.filter(c => !existingIds.has(c.id) && !existingIds.has(c.whatsapp_id));
                    return [...prev, ...newOnes];
                });
            }
        });

        return () => {
            socket.off('contacts_updated');
        };
    }, [fetchContacts]);

    const filteredContacts = contacts.filter(contact => {
        const displayName = (contact.pushName || contact.name || contact.phone || '').toLowerCase();
        const searchStr = (displayName + ' ' + (contact.email || '')).toLowerCase();
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
                    top: '28px',
                    right: '28px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#ffffff',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    zIndex: 2000,
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    animation: 'slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <div style={{
                        backgroundColor: 'var(--success)',
                        borderRadius: '10px',
                        padding: '8px',
                        display: 'flex',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                    }}>
                        <CheckCircle size={20} color="white" />
                    </div>
                    <div>
                        <p className="heading-base" style={{ margin: 0, fontSize: '14px', color: 'white' }}>¡Sincronización Exitosa!</p>
                        <p className="text-small" style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Añadidos {syncCount} contactos nuevos.</p>
                    </div>
                </div>
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 className="heading-xl" style={{ fontSize: '28px' }}>Directorio de Leads</h2>
                    <p className="text-main">Gestiona y segmenta tu base de clientes con precisión.</p>
                </div>
                <button className="btn-primary">
                    <UserPlus size={18} />
                    Añadir Contacto
                </button>
            </header>

            <div className="glass-card" style={{ padding: '28px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, correo o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-styled"
                            style={{
                                width: '100%',
                                paddingLeft: '48px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Todos', 'WhatsApp', 'Caliente', 'Tibio', 'Frío', 'Nuevo'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                style={{
                                    background: activeFilter === filter ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                                    border: '1px solid',
                                    borderColor: activeFilter === filter ? 'transparent' : 'var(--border-subtle)',
                                    color: activeFilter === filter ? 'white' : 'var(--text-subtitle)',
                                    padding: '10px 18px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: activeFilter === filter ? '0 10px 20px -5px rgba(99, 102, 241, 0.4)' : 'none'
                                }}
                                className={activeFilter === filter ? '' : 'hover:bg-white/5'}
                            >
                                {filter === 'WhatsApp' ? '📱 WhatsApp' : filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left' }}>
                                <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre y Perfil</th>
                                <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacto</th>
                                <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado de Lead</th>
                                <th className="text-small" style={{ padding: '12px 16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Etiqueta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContacts.map(contact => (
                                <tr
                                    key={contact.id}
                                    onClick={() => handleSelectContact(contact)}
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    className="hover:bg-white/5 group"
                                >
                                    <td style={{ padding: '16px', borderRadius: '12px 0 0 12px', borderTop: '1px solid transparent', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '12px',
                                                background: 'var(--primary-gradient)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '16px',
                                                fontWeight: '900',
                                                color: 'white',
                                                boxShadow: '0 8px 15px -3px rgba(99, 102, 241, 0.3)'
                                            }}>
                                                {(contact.pushName || contact.name || contact.phone || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="heading-base" style={{ fontSize: '15px' }}>{contact.pushName || contact.name || contact.phone || 'Desconocido'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <div className="text-main" style={{ fontSize: '13.5px', fontWeight: '500' }}>
                                            {contact.phone ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#25D366' }}></div>
                                                    <span style={{ color: 'var(--text-subtitle)' }}>+{contact.phone}</span>
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>{contact.email || '—'}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <span style={{
                                            padding: '6px 14px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            letterSpacing: '0.02em',
                                            backgroundColor: contact.status === 'Caliente' ? 'rgba(239, 68, 68, 0.12)' : contact.status === 'Tibio' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                            color: contact.status === 'Caliente' ? 'var(--error)' : contact.status === 'Tibio' ? 'var(--warning)' : 'var(--info)',
                                            border: '1px solid',
                                            borderColor: contact.status === 'Caliente' ? 'rgba(239, 68, 68, 0.2)' : contact.status === 'Tibio' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                                        }}>
                                            {contact.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', borderRadius: '0 12px 12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <span style={{
                                            backgroundColor: 'rgba(255,255,255,0.04)',
                                            border: '1px solid var(--border-subtle)',
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {contact.tag}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredContacts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px 40px' }}>
                        <div style={{ opacity: 0.2, marginBottom: '20px' }}>
                            <Search size={48} style={{ margin: '0 auto' }} />
                        </div>
                        <p className="text-main" style={{ fontSize: '16px' }}>No se encontraron prospectos que coincidan con tu búsqueda.</p>
                        <p className="text-small" style={{ marginTop: '8px' }}>Intenta con otros filtros o términos generales.</p>
                    </div>
                )}
            </div>

            {/* Slide-over Detail Panel */}
            {selectedContact && (
                <div
                    style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(5, 5, 10, 0.8)', zIndex: 100, backdropFilter: 'blur(10px)' }}
                    onClick={() => setSelectedContact(null)}
                >
                    <div
                        className="glass-card"
                        style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0, width: '480px',
                            background: 'var(--bg-card)', padding: '50px 40px', borderLeft: '1px solid var(--border-subtle)',
                            display: 'flex', flexDirection: 'column', gap: '40px',
                            animation: 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '-40px 0 80px -20px rgba(0,0,0,0.8)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '20px',
                                    background: 'var(--primary-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    fontWeight: '900',
                                    color: 'white',
                                    boxShadow: '0 15px 30px -5px rgba(99, 102, 241, 0.4)',
                                    transform: 'rotate(-3deg)'
                                }}>
                                    {(selectedContact.pushName || selectedContact.name || selectedContact.phone || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="heading-xl" style={{ fontSize: '26px', marginBottom: '4px' }}>{selectedContact.pushName || selectedContact.name || selectedContact.phone || 'Desconocido'}</h3>
                                    <p className="text-main" style={{ fontWeight: '600', color: 'var(--primary)' }}>{selectedContact.email || (selectedContact.phone ? `+${selectedContact.phone}` : 'Lead de WhatsApp')}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedContact(null)} style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '10px',
                                display: 'flex'
                            }} className="hover:bg-white/10 transition-colors">
                                <RefreshCw size={20} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                                <p className="text-small" style={{ fontWeight: '800', marginBottom: '8px', letterSpacing: '0.05em' }}>PRIORIDAD</p>
                                <p className="heading-base" style={{ color: selectedContact.status === 'Caliente' ? 'var(--error)' : 'var(--info)', fontSize: '18px' }}>{selectedContact.status}</p>
                            </div>
                            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                                <p className="text-small" style={{ fontWeight: '800', marginBottom: '8px', letterSpacing: '0.05em' }}>CATEGORÍA</p>
                                <p className="heading-base" style={{ fontSize: '18px' }}>{selectedContact.tag}</p>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ width: '4px', height: '14px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                                <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-subtitle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notas del CRM</h4>
                            </div>
                            <textarea
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="Registra hitos, objeciones o detalles cruciales..."
                                className="input-styled"
                                style={{
                                    width: '100%', minHeight: '160px', padding: '18px',
                                    fontSize: '14px', lineHeight: '1.6', resize: 'none'
                                }}
                            />
                            <button
                                onClick={saveContactChanges}
                                disabled={isSaving}
                                className="btn-primary"
                                style={{ marginTop: '16px', width: '100%', justifyContent: 'center', height: '48px' }}
                            >
                                {isSaving ? 'Guardando registro...' : 'Actualizar Notas'}
                            </button>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '16px' }}>
                            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center', height: '52px' }}>Enviar Mensaje</button>
                            <button style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border-subtle)',
                                flex: 1,
                                color: 'white',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }} className="hover:bg-white/5 transition-colors">Historial</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contactos;
