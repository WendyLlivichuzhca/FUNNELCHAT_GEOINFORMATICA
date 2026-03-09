import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Paperclip, Search, Check, CheckCheck, MoreVertical, Play, Download, FileText, ArrowLeft } from 'lucide-react';
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
            height: 'calc(100vh - 100px)',
            display: 'flex',
            background: 'rgba(10, 11, 20, 0.4)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            margin: '20px'
        }}>
            {isSyncing && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(10, 11, 20, 0.9)',
                    backdropFilter: 'blur(8px)', zIndex: 1000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ width: '300px', textAlign: 'center' }}>
                        <div className="spin-slow" style={{ width: '60px', height: '60px', margin: '0 auto 20px', background: 'var(--primary-gradient)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}>
                            <Smile size={32} color="white" />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>Sincronizando WhatsApp</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px' }}>{syncMessage}</p>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                            <div style={{ width: `${syncProgress}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.4s ease-out' }} />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{syncProgress}%</div>
                    </div>
                </div>
            )}

            <div style={{
                width: '350px',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '22px', fontWeight: '800', background: 'linear-gradient(to right, #fff, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Chats</h3>
                        <MoreVertical size={20} color="rgba(255,255,255,0.4)" style={{ cursor: 'pointer' }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input
                            type="text"
                            placeholder="Buscar chats o mensajes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 48px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {/* Resultados de Búsqueda Global */}
                    {searchResults && (
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Search size={14} /> Mensajes encontrados ({searchResults.length})
                            </div>
                            {searchResults.map((res, i) => (
                                <div
                                    key={`search-${i}`}
                                    onClick={() => {
                                        const c = contacts.find(c => c.whatsapp_id === res.contact_id);
                                        if (c) handleSelectContact(c);
                                    }}
                                    style={{
                                        padding: '14px', borderRadius: '18px', cursor: 'pointer', marginBottom: '4px',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', marginBottom: '2px' }}>{res.contact_name}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {res.message.text}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textAlign: 'right' }}>
                                        {formatTime(res.message.timestamp)}
                                    </div>
                                </div>
                            ))}
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 14px' }} />
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
                                padding: '14px',
                                borderRadius: '18px',
                                cursor: 'pointer',
                                marginBottom: '4px',
                                background: activeContact?.whatsapp_id === contact.whatsapp_id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                transition: 'all 0.2s',
                                border: '1px solid',
                                borderColor: activeContact?.whatsapp_id === contact.whatsapp_id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                            }}
                        >
                            <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '16px',
                                background: getAvatarColor(contact.whatsapp_id || contact.id),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                flexShrink: 0
                            }}>
                                {contact.name?.charAt(0) || '?'}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {contact.name || contact.phone || 'Desconocido'}
                                    </h4>
                                    <span style={{ fontSize: '11px', color: contact.unread_count > 0 ? 'var(--primary)' : 'rgba(255,255,255,0.4)' }}>
                                        {formatTime(contact.timestamp)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {contact.last_message || 'Sin mensajes'}
                                    </p>
                                    {contact.unread_count > 0 && (
                                        <div style={{ background: 'var(--primary)', color: 'white', fontSize: '11px', fontWeight: 'bold', minWidth: '20px', height: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
                                            {contact.unread_count}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {!searchResults && filteredContacts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.2)' }}>
                            No se encontraron contactos
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                {activeContact ? (
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                            <div
                                onClick={() => setShowInfoPanel(!showInfoPanel)}
                                style={{
                                    padding: '16px 24px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'rgba(255,255,255,0.02)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: getAvatarColor(activeContact.whatsapp_id || activeContact.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                        {activeContact.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{activeContact.name || activeContact.phone}</h3>
                                        <span style={{ fontSize: '11px', color: '#10b981' }}>En línea</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <Search size={20} color="rgba(255,255,255,0.4)" style={{ cursor: 'pointer' }} />
                                    <MoreVertical size={20} color="rgba(255,255,255,0.4)" style={{ cursor: 'pointer' }} />
                                </div>
                            </div>

                            <div className="custom-scrollbar" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {messages.map((msg, idx) => {
                                    const isBot = msg.sender === 'bot';
                                    const sameAsPrev = idx > 0 && messages[idx - 1].sender === msg.sender;
                                    const showName = activeContact.isGroup && !isBot && !sameAsPrev;

                                    return (
                                        <div key={idx} style={{
                                            alignSelf: isBot ? 'flex-end' : 'flex-start',
                                            maxWidth: '75%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            marginTop: sameAsPrev ? '2px' : '8px'
                                        }}>
                                            <div style={{
                                                padding: '8px 12px',
                                                borderRadius: isBot
                                                    ? (sameAsPrev ? '8px' : '8px 0px 8px 8px')
                                                    : (sameAsPrev ? '8px' : '0px 8px 8px 8px'),
                                                background: isBot ? '#056162' : '#262d31',
                                                color: 'white',
                                                fontSize: '14.5px',
                                                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                                                position: 'relative'
                                            }}>
                                                {showName && (
                                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: getAvatarColor(msg.participant), marginBottom: '2px' }}>
                                                        {msg.pushName || msg.participant?.split('@')[0]}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {msg.mediaType && msg.mediaType !== 'text' && <MediaMessage msg={msg} />}
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px' }}>
                                                        <span style={{ flex: 1 }}>{msg.text}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', alignSelf: 'flex-end' }}>
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

                            <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Smile size={22} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
                                    <Paperclip size={22} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Escribe un mensaje..."
                                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', padding: '8px 0', fontSize: '15px' }}
                                    />
                                    <div onClick={handleSend} style={{ width: '40px', height: '40px', background: inputValue.trim() ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Send size={20} color="white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showInfoPanel && (
                            <div style={{
                                width: '320px',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <ArrowLeft size={20} color="rgba(255,255,255,0.6)" style={{ cursor: 'pointer' }} onClick={() => setShowInfoPanel(false)} />
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>Info. del contacto</h3>
                                </div>
                                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            background: getAvatarColor(activeContact.whatsapp_id || activeContact.id),
                                            margin: '0 auto 20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '48px',
                                            fontWeight: 'bold',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                                        }}>
                                            {activeContact.name?.charAt(0) || '?'}
                                        </div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{activeContact.name}</h2>
                                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{activeContact.phone || activeContact.whatsapp_id}</p>
                                    </div>

                                    <div style={{ marginBottom: '32px' }}>
                                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Notas CRM</h4>
                                        <textarea
                                            value={contactNotes}
                                            onChange={(e) => setContactNotes(e.target.value)}
                                            placeholder="Escribe notas sobre este cliente..."
                                            style={{
                                                width: '100%', minHeight: '120px', background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px',
                                                color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical'
                                            }}
                                        />
                                        <button
                                            onClick={handleSaveNotes}
                                            style={{
                                                width: '100%', marginTop: '12px', padding: '10px',
                                                background: 'var(--primary-gradient)', border: 'none', borderRadius: '10px',
                                                color: 'white', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
                                            }}
                                        >
                                            Guardar Notas
                                        </button>
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Detalles Técnicos</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>ID WhatsApp:</span>
                                                <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{activeContact.whatsapp_id}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Tipo:</span>
                                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{activeContact.is_group ? 'Grupo' : 'Individual'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {activeContact.is_group && activeContact.participants && (
                                        <div style={{ marginTop: '32px' }}>
                                            <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Participantes ({activeContact.participants.length})</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {activeContact.participants.map((p, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: getAvatarColor(p.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                            {p.id.charAt(0)}
                                                        </div>
                                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                                            <div style={{ fontSize: '13px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.id.split('@')[0]}</div>
                                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{p.admin ? (p.admin === 'superadmin' ? 'Creador' : 'Admin') : 'Participante'}</div>
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
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                        <Send size={40} style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: '700' }}>WhatsApp Web Clone</h3>
                        <p>Selecciona una conversación para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chats;
