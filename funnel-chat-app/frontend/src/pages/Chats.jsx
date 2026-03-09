import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Paperclip, Search, Check, CheckCheck, MoreVertical, Play, Download, FileText, ArrowLeft, MessageSquare } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://127.0.0.1:8000', {
    transports: ['websocket']
});

// Colores para avatares aleatorios
const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F06292', '#AED581', '#FFD54F', '#4DB6AC', '#7986CB'
];

const getAvatarColor = (id) => {
    if (!id) return AVATAR_COLORS[0];
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
};

const StatusIcon = ({ status, isBot }) => {
    if (!isBot) return null;
    // Baileys status: 0=error, 1=pending, 2=sent, 3=delivered, 4=read
    if (status === 4) return <CheckCheck size={16} color="#34b7f1" />; // Blue double check
    if (status === 3) return <CheckCheck size={16} color="rgba(255,255,255,0.5)" />; // Grey double check
    if (status === 2) return <Check size={16} color="rgba(255,255,255,0.5)" />; // Single check
    return <Check size={16} color="rgba(255,255,255,0.2)" />; // Pending/Sending
};

const MediaMessage = ({ msg }) => {
    if (!msg.mediaPath) return null;
    const url = `http://127.0.0.1:8000/media/${msg.mediaPath}`;

    if (msg.mediaType === 'image') {
        return (
            <div style={{ borderRadius: '8px', overflow: 'hidden', marginTop: '4px', maxWidth: '300px' }}>
                <img
                    src={url}
                    alt="WhatsApp Media"
                    style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
                    onClick={() => window.open(url, '_blank')}
                />
            </div>
        );
    }

    if (msg.mediaType === 'video') {
        return (
            <div style={{ marginTop: '4px', borderRadius: '8px', overflow: 'hidden', background: '#000', maxWidth: '300px' }}>
                <video src={url} style={{ width: '100%', display: 'block' }} controls />
            </div>
        );
    }

    if (msg.mediaType === 'audio') {
        return (
            <div style={{ marginTop: '4px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '12px', minWidth: '240px' }}>
                <audio src={url} controls style={{ width: '100%', height: '32px' }} />
            </div>
        );
    }

    if (msg.mediaType === 'document') {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px',
                marginTop: '4px', textDecoration: 'none', color: 'inherit',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                    <FileText size={24} color="#818cf8" />
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {msg.fileName || 'Archivo'}
                    </div>
                </div>
                <Download size={20} style={{ opacity: 0.5 }} />
            </a>
        );
    }

    if (msg.mediaType === 'sticker') {
        return (
            <div style={{ marginTop: '4px' }}>
                <img src={url} alt="Sticker" style={{ width: '128px', height: '128px', objectFit: 'contain' }} />
            </div>
        );
    }

    return null;
};

const Chats = () => {
    const [contacts, setContacts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncMessage, setSyncMessage] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [contactNotes, setContactNotes] = useState('');
    const chatEndRef = useRef(null);

    // Cargar contactos al inicio
    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://127.0.0.1:8000/api/contacts', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const sorted = Array.isArray(data) ? [...data].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : [];
                setContacts(sorted);
                if (sorted.length > 0 && !activeContact) handleSelectContact(sorted[0]);
            })
            .catch(err => console.error("Error fetching contacts:", err));
    }, []);

    const handleSelectContact = (contact) => {
        setActiveContact(contact);
        setSearchResults(null);
        setSearchTerm('');
        setContactNotes(contact.notes || '');
        const token = localStorage.getItem('token');

        // Limpiar contador local
        setContacts(prev => prev.map(c =>
            c.whatsapp_id === contact.whatsapp_id ? { ...c, unread_count: 0 } : c
        ));

        // Obtener historial
        fetch(`http://127.0.0.1:8000/api/chat/${contact.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setMessages(data);
                // PASO 4: Marcar como leído en WhatsApp si hay mensajes
                if (data.length > 0) {
                    const lastMsg = data[data.length - 1];
                    if (lastMsg.sender === 'user') { // Solo si el último es del cliente
                        fetch(`http://127.0.0.1:8000/api/chat/read?whatsapp_id=${contact.whatsapp_id}&message_id=${lastMsg.id}`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        }).catch(e => console.error("Error al sincronizar lectura:", e));
                    }
                }
            })
            .catch(err => console.error("Error fetching history:", err));
    };

    // PASO 4: Búsqueda Global
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 3) {
            setSearchResults(null);
            return;
        }

        const timer = setTimeout(() => {
            setIsSearchLoading(true);
            const token = localStorage.getItem('token');
            fetch(`http://127.0.0.1:8000/api/search?q=${encodeURIComponent(searchTerm)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                    setIsSearchLoading(false);
                })
                .catch(e => {
                    console.error("Search error:", e);
                    setIsSearchLoading(false);
                });
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        socket.on('new_whatsapp_message', (data) => {
            const jid = data.whatsapp_id || data.contact_id;

            setContacts(prev => {
                const updated = prev.map(c => {
                    if (c.whatsapp_id === jid) {
                        return {
                            ...c,
                            last_message: data.message.text || (data.message.mediaType === 'image' ? '📷 Foto' : data.message.mediaType === 'audio' ? '🎵 Audio' : 'Archivo'),
                            timestamp: data.message.timestamp,
                            unread_count: (activeContact?.whatsapp_id === jid) ? 0 : data.unreadCount || (c.unread_count || 0) + 1
                        };
                    }
                    return c;
                });

                const contactIndex = updated.findIndex(c => c.whatsapp_id === jid);
                if (contactIndex > 0) {
                    const [contact] = updated.splice(contactIndex, 1);
                    return [contact, ...updated];
                }
                return updated;
            });

            if (activeContact && (jid === activeContact.whatsapp_id || jid === activeContact.id)) {
                setMessages(prev => [...prev, data.message]);
                // Marcar como leído automáticamente si el chat está abierto
                const token = localStorage.getItem('token');
                fetch(`http://127.0.0.1:8000/api/chat/read?whatsapp_id=${jid}&message_id=${data.message.id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => { });
            }
        });

        socket.on('message_status_update', (receipts) => {
            setMessages(prev => prev.map(msg => {
                const update = receipts.find(r => r.key.id === msg.id);
                if (update) {
                    return { ...msg, status: update.update.status };
                }
                return msg;
            }));
        });

        socket.on('sync_progress', (data) => {
            setIsSyncing(true);
            setSyncProgress(data.progress);
            setSyncMessage(data.message);
            if (data.progress === 100) {
                setTimeout(() => setIsSyncing(false), 2000);
            }
        });

        socket.on('whatsapp_status', (data) => {
            if (data.status === 'session_expired') {
                alert("La sesión de WhatsApp ha expirado o fue cerrada. Por favor, vuelve al Dashboard para escanear el nuevo código QR.");
                window.location.href = '/dashboard';
            } else if (data.status === 'conflict') {
                alert("Conflicto de sesión: WhatsApp se abrió en otro dispositivo o pestaña. Esperando para reconectar...");
            }
        });

        socket.on('whatsapp_contacts', (data) => {
            if (data.is_batch) {
                setContacts(prev => {
                    const existingMap = new Map(prev.map(c => [c.whatsapp_id || c.id, c]));
                    data.contacts.forEach(newC => {
                        const id = newC.whatsapp_id || newC.id;
                        existingMap.set(id, { ...existingMap.get(id), ...newC });
                    });
                    return Array.from(existingMap.values())
                        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                });
            }
        });

        return () => {
            socket.off('new_whatsapp_message');
            socket.off('message_status_update');
            socket.off('sync_progress');
            socket.off('whatsapp_contacts');
        };
    }, [activeContact]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim() || !activeContact) return;

        const timestamp = Math.floor(Date.now() / 1000);
        const newMessage = {
            id: 'temp-' + Date.now(),
            text: inputValue,
            sender: 'bot',
            timestamp: timestamp,
            status: 2 // Sent
        };

        socket.emit('send_whatsapp_message', {
            to: activeContact.whatsapp_id || activeContact.id,
            text: inputValue
        });

        setContacts(prev => {
            const updated = prev.map(c => {
                if (c.whatsapp_id === activeContact.whatsapp_id) {
                    return { ...c, last_message: inputValue, timestamp: timestamp };
                }
                return c;
            });
            const idx = updated.findIndex(c => c.whatsapp_id === activeContact.whatsapp_id);
            if (idx > 0) {
                const [c] = updated.splice(idx, 1);
                return [c, ...updated];
            }
            return updated;
        });

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
    };

    const handleSaveNotes = () => {
        if (!activeContact) return;
        const token = localStorage.getItem('token');
        fetch(`http://127.0.0.1:8000/api/contacts/${activeContact.id}/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes: contactNotes })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setContacts(prev => prev.map(c =>
                        c.id === activeContact.id ? { ...c, notes: contactNotes } : c
                    ));
                    setActiveContact(prev => ({ ...prev, notes: contactNotes }));
                    alert("Nota guardada exitosamente");
                }
            })
            .catch(err => console.error("Error saving notes:", err));
    };

    const filteredContacts = Array.isArray(contacts) ? contacts.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || c.whatsapp_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return (
        <div className="animate-fade-in" style={{
            height: 'calc(100vh - 80px)',
            display: 'flex',
            background: 'var(--bg-card)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            margin: '0 0 20px 0',
            boxShadow: '0 20px 50px -12px rgba(0,0,0,0.5)'
        }}>
            {isSyncing && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(10, 10, 20, 0.95)',
                    backdropFilter: 'blur(12px)', zIndex: 1000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ width: '320px', textAlign: 'center' }}>
                        <div className="spin-slow" style={{ width: '64px', height: '64px', margin: '0 auto 24px', background: 'var(--primary-gradient)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)' }}>
                            <Smile size={32} color="white" />
                        </div>
                        <h2 className="heading-xl" style={{ marginBottom: '8px' }}>Optimizando Chats</h2>
                        <p className="text-small" style={{ marginBottom: '28px' }}>{syncMessage}</p>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                            <div style={{ width: `${syncProgress}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.4s ease-out', boxShadow: '0 0 10px var(--primary)' }} />
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '800' }}>{syncProgress}%</div>
                    </div>
                </div>
            )}

            <div style={{
                width: '360px',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.01)'
            }}>
                <div style={{ padding: '28px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 className="heading-xl">Mensajes</h3>
                        <div className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                            <MoreVertical size={20} className="text-slate-500" />
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar chats o mensajes..."
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
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
                    {/* Resultados de Búsqueda Global */}
                    {searchResults && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: 'var(--primary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                <Search size={14} /> Resultados ({searchResults.length})
                            </div>
                            {searchResults.map((res, i) => (
                                <div
                                    key={`search-${i}`}
                                    onClick={() => {
                                        const c = contacts.find(c => c.whatsapp_id === res.contact_id);
                                        if (c) handleSelectContact(c);
                                    }}
                                    style={{
                                        padding: '14px', borderRadius: '14px', cursor: 'pointer', marginBottom: '6px',
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', transition: 'all 0.2s'
                                    }}
                                    className="hover:bg-white/5"
                                >
                                    <div className="heading-base" style={{ fontSize: '14px', marginBottom: '2px' }}>{res.contact_name}</div>
                                    <div className="text-small" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {res.message.text}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px', textAlign: 'right', fontWeight: '600' }}>
                                        {formatTime(res.message.timestamp)}
                                    </div>
                                </div>
                            ))}
                            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '16px 12px' }} />
                        </div>
                    )}

                    {/* Lista de Contactos Normal */}
                    {!searchResults && filteredContacts.map(contact => (
                        <div
                            key={contact.whatsapp_id || contact.id}
                            onClick={() => handleSelectContact(contact)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '14px 16px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                marginBottom: '4px',
                                background: activeContact?.whatsapp_id === contact.whatsapp_id ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                transition: 'all 0.2s',
                                border: '1px solid',
                                borderColor: activeContact?.whatsapp_id === contact.whatsapp_id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            }}
                            className={activeContact?.whatsapp_id === contact.whatsapp_id ? '' : 'hover:bg-white/5'}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: getAvatarColor(contact.whatsapp_id || contact.id),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                fontWeight: '800',
                                color: 'white',
                                flexShrink: 0,
                                boxShadow: activeContact?.whatsapp_id === contact.whatsapp_id ? '0 8px 16px -4px rgba(0,0,0,0.3)' : 'none'
                            }}>
                                {contact.name?.charAt(0) || '?'}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <h4 className="heading-base" style={{ fontSize: '14.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {contact.name || contact.phone || 'Desconocido'}
                                    </h4>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: contact.unread_count > 0 ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                        {formatTime(contact.timestamp)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p className="text-small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px' }}>
                                        {contact.last_message || 'Sin mensajes'}
                                    </p>
                                    {contact.unread_count > 0 && (
                                        <div style={{ background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: '900', minWidth: '18px', height: '18px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 4px 8px rgba(99, 102, 241, 0.4)' }}>
                                            {contact.unread_count}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {!searchResults && filteredContacts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }} className="text-small">
                            No se encontraron contactos
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.05)' }}>
                {activeContact ? (
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div
                                onClick={() => setShowInfoPanel(!showInfoPanel)}
                                style={{
                                    padding: '18px 28px',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'var(--bg-card)',
                                    cursor: 'pointer',
                                    zIndex: 10
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: getAvatarColor(activeContact.whatsapp_id || activeContact.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'white' }}>
                                        {activeContact.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 className="heading-base" style={{ fontSize: '15.5px' }}>{activeContact.name || activeContact.phone}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></div>
                                            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', letterSpacing: '0.02em' }}>En línea</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <Search size={19} className="text-slate-500 hover:text-indigo-400 transition-colors" />
                                    <MoreVertical size={19} className="text-slate-500 hover:text-indigo-400 transition-colors" />
                                </div>
                            </div>

                            <div className="custom-scrollbar" style={{
                                flex: 1,
                                padding: '32px 28px',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.03) 0%, transparent 100%)'
                            }}>
                                {messages.map((msg, idx) => {
                                    const isBot = msg.sender === 'bot';
                                    const sameAsPrev = idx > 0 && messages[idx - 1].sender === msg.sender;
                                    const showName = activeContact.isGroup && !isBot && !sameAsPrev;

                                    return (
                                        <div key={idx} style={{
                                            alignSelf: isBot ? 'flex-end' : 'flex-start',
                                            maxWidth: '70%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            marginTop: sameAsPrev ? '2px' : '12px',
                                            animation: 'fadeIn 0.3s ease-out'
                                        }}>
                                            <div style={{
                                                padding: '10px 14px',
                                                borderRadius: isBot
                                                    ? (sameAsPrev ? '14px' : '14px 2px 14px 14px')
                                                    : (sameAsPrev ? '14px' : '2px 14px 14px 14px'),
                                                background: isBot ? 'var(--primary-gradient)' : 'var(--bg-hover)',
                                                color: isBot ? 'white' : 'var(--text-title)',
                                                fontSize: '14px',
                                                fontWeight: isBot ? '500' : '400',
                                                boxShadow: isBot ? '0 10px 15px -3px rgba(99, 102, 241, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                position: 'relative',
                                                border: isBot ? 'none' : '1px solid var(--border-subtle)',
                                                lineHeight: '1.5'
                                            }}>
                                                {showName && (
                                                    <div style={{ fontSize: '11px', fontWeight: '800', color: getAvatarColor(msg.participant), marginBottom: '4px', letterSpacing: '0.02em' }}>
                                                        {msg.pushName || msg.participant?.split('@')[0]}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {msg.mediaType && msg.mediaType !== 'text' && <MediaMessage msg={msg} />}
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
                                                        <span style={{ flex: 1 }}>{msg.text}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: isBot ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', marginTop: '4px', alignSelf: 'flex-end', fontWeight: '600' }}>
                                                            {formatTime(msg.timestamp)}
                                                            <StatusIcon status={msg.status} isBot={isBot} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            <div style={{ padding: '24px 28px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    backgroundColor: 'var(--bg-hover)',
                                    padding: '8px 16px',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-subtle)',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    <div className="p-2 hover:bg-white/5 rounded-full cursor-pointer transition-colors">
                                        <Smile size={20} className="text-slate-500" />
                                    </div>
                                    <div className="p-2 hover:bg-white/5 rounded-full cursor-pointer transition-colors">
                                        <Paperclip size={20} className="text-slate-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Escribe tu respuesta aquí..."
                                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-title)', outline: 'none', padding: '10px 0', fontSize: '14.5px' }}
                                    />
                                    <div
                                        onClick={handleSend}
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            background: inputValue.trim() ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: inputValue.trim() ? 'pointer' : 'default',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: inputValue.trim() ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none',
                                            transform: inputValue.trim() ? 'scale(1)' : 'scale(0.95)'
                                        }}
                                    >
                                        <Send size={18} color="white" style={{ transform: 'translateX(1px)' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showInfoPanel && (
                            <div style={{
                                width: '340px',
                                borderLeft: '1px solid var(--border-subtle)',
                                background: 'var(--bg-card)',
                                display: 'flex',
                                flexDirection: 'column',
                                animation: 'fadeIn 0.3s ease-out'
                            }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors" onClick={() => setShowInfoPanel(false)}>
                                        <ArrowLeft size={18} className="text-slate-400" />
                                    </div>
                                    <h3 className="heading-base">Perfil del contacto</h3>
                                </div>
                                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                        <div style={{
                                            width: '120px',
                                            height: '110px',
                                            borderRadius: '24px',
                                            background: getAvatarColor(activeContact.whatsapp_id || activeContact.id),
                                            margin: '0 auto 24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '44px',
                                            fontWeight: '900',
                                            color: 'white',
                                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
                                            transform: 'rotate(-2deg)'
                                        }}>
                                            {activeContact.name?.charAt(0) || '?'}
                                        </div>
                                        <h2 className="heading-xl" style={{ marginBottom: '6px' }}>{activeContact.name}</h2>
                                        <p className="text-small" style={{ fontWeight: '600' }}>{activeContact.phone || activeContact.whatsapp_id}</p>
                                    </div>

                                    <div style={{ marginBottom: '40px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <div style={{ width: '4px', height: '14px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                                            <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-subtitle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notas de Gestión</h4>
                                        </div>
                                        <textarea
                                            value={contactNotes}
                                            onChange={(e) => setContactNotes(e.target.value)}
                                            placeholder="Añade recordatorios, preferencias o datos clave del cliente..."
                                            className="input-styled"
                                            style={{
                                                width: '100%', minHeight: '140px', padding: '14px',
                                                fontSize: '13.5px', resize: 'none', lineHeight: '1.6'
                                            }}
                                        />
                                        <button
                                            onClick={handleSaveNotes}
                                            className="btn-primary"
                                            style={{
                                                width: '100%', marginTop: '16px', justifyContent: 'center', fontSize: '13px'
                                            }}
                                        >
                                            Actualizar Notas
                                        </button>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <div style={{ width: '4px', height: '14px', background: 'var(--text-secondary)', borderRadius: '4px' }}></div>
                                            <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Metadatos</h4>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="text-small" style={{ fontWeight: '600' }}>ID WhatsApp</span>
                                                <span className="text-small" style={{ color: 'var(--text-subtitle)', fontFamily: 'monospace', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px' }}>{activeContact.whatsapp_id?.split('@')[0]}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="text-small" style={{ fontWeight: '600' }}>Tipo de Chat</span>
                                                <span style={{ fontSize: '10px', background: activeContact.is_group ? 'var(--accent)20' : 'var(--primary)20', color: activeContact.is_group ? 'var(--accent)' : 'var(--primary)', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                                                    {activeContact.is_group ? 'GRUPO' : 'PERSONAL'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {activeContact.is_group && activeContact.participants && (
                                        <div style={{ marginTop: '40px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                <div style={{ width: '4px', height: '14px', background: 'var(--success)', borderRadius: '4px' }}></div>
                                                <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Participantes ({activeContact.participants.length})</h4>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {activeContact.participants.map((p, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '12px' }} className="hover:bg-white/5 transition-colors">
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: getAvatarColor(p.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color: 'white' }}>
                                                            {p.id.charAt(0)}
                                                        </div>
                                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                                            <div className="text-main" style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.id.split('@')[0]}</div>
                                                            <div className="text-small" style={{ fontSize: '10px' }}>{p.admin ? (p.admin === 'superadmin' ? 'Creador' : 'Admin') : 'Miembro'}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        <div style={{ width: '80px', height: '80px', background: 'var(--bg-hover)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
                            <MessageSquare size={36} className="text-slate-500" />
                        </div>
                        <h3 className="heading-xl" style={{ marginBottom: '8px' }}>Tu Centro de Mensajes</h3>
                        <p className="text-main">Selecciona una conversación para empezar a vender.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chats;
