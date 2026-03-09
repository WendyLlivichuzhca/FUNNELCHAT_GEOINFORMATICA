import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Paperclip, Search, Check, CheckCheck, MoreVertical, Play, Download, FileText, ArrowLeft, MessageSquare, ExternalLink, Clock } from 'lucide-react';
import io from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config/api';

const socket = io(SOCKET_URL, {
    transports: ['websocket']
});

// Colores para avatares aleatorios
const AVATAR_COLORS = [
    '#7c3aed', '#10d9a0', '#f59e0b', '#ec4899', '#6366f1',
    '#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'
];

const getAvatarColor = (id) => {
    if (!id) return AVATAR_COLORS[0];
    const str = String(id);
    const sum = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

const formatTime = (ts) => {
    if (!ts) return "";
    let date;
    if (typeof ts === 'number') {
        date = new Date(ts < 10000000000 ? ts * 1000 : ts);
    } else {
        date = new Date(ts);
    }

    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isYesterday) return `ayer ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) {
        const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        return `${days[date.getDay()]} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
};

const formatLastSeen = (ts) => {
    if (!ts) return "hace mucho tiempo";
    const date = new Date(ts < 10000000000 ? ts * 1000 : ts);
    if (isNaN(date.getTime())) return "hace mucho tiempo";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "hace un momento";
    if (date.toDateString() === now.toDateString()) {
        return `hoy a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `ayer a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
        const days = ['el domingo', 'el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el sábado'];
        return days[date.getDay()];
    }
    return `el ${date.toLocaleDateString([], { day: '2-digit', month: 'short' })}`;
};

const getMessagePreview = (msg) => {
    if (!msg) return "";
    if (msg.text) return msg.text;
    const type = msg.mediaType || msg.type;
    switch (type) {
        case 'sticker': return "🎭 Sticker";
        case 'image': return "📷 Imagen";
        case 'video': return "🎥 Video";
        case 'audio': return "🎵 Audio";
        case 'document': return `📄 ${msg.fileName || 'Archivo'}`;
        case 'location': return "📍 Ubicación compartida";
        case 'contact': return "👤 Contacto compartido";
        case 'reaction': return "✨ Reacción";
        default: return "💬 Mensaje";
    }
};

const StatusIcon = ({ status, isBot }) => {
    if (!isBot) return null;
    // Baileys status: 0=error, 1=pending, 2=sent, 3=delivered, 4=read
    if (status === 4) return <CheckCheck size={14} color="#34b7f1" />; // Blue double check
    if (status === 3) return <CheckCheck size={14} color="rgba(255,255,255,0.6)" />; // Grey double check
    if (status === 2) return <Check size={14} color="rgba(255,255,255,0.6)" />; // Single check
    return <Clock size={12} color="rgba(255,255,255,0.4)" />; // Pending
};

const MediaModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px', backdropFilter: 'blur(10px)'
            }}
            onClick={onClose}
        >
            <button
                onClick={onClose}
                style={{ position: 'absolute', top: '30px', right: '30px', background: 'white', color: 'black', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}
            >
                <ArrowLeft size={24} style={{ transform: 'rotate(45deg)' }} />
            </button>

            {data.type === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '90%', maxHeight: '90%' }}>
                    <img src={data.url} alt="Full view" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
                    {data.caption && <p style={{ color: 'white', fontSize: '18px', fontWeight: '500', textAlign: 'center' }}>{data.caption}</p>}
                </div>
            )}

            {data.type === 'video' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '90%', maxHeight: '90%' }}>
                    <video src={data.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px' }} onClick={e => e.stopPropagation()} />
                    {data.caption && <p style={{ color: 'white', fontSize: '18px', fontWeight: '500', textAlign: 'center' }}>{data.caption}</p>}
                </div>
            )}
        </div>
    );
};

const AudioPlayer = ({ url }) => {
    const [speed, setSpeed] = useState(1);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const cycleSpeed = () => {
        const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
        setSpeed(next);
        audioRef.current.playbackRate = next;
    };

    return (
        <div style={{
            marginTop: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px',
            borderRadius: '20px', minWidth: '280px', display: 'flex', alignItems: 'center', gap: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            <button
                onClick={togglePlay}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
                {isPlaying ? <span style={{ fontWeight: 'bold' }}>||</span> : <Play size={16} fill="white" />}
            </button>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '40%', background: 'var(--primary)', borderRadius: '2px' }} />
            </div>
            <button
                onClick={cycleSpeed}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '12px', padding: '4px 8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', minWidth: '40px' }}
            >
                {speed}x
            </button>
            <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} hidden />
        </div>
    );
};

const MediaMessage = ({ msg, onOpenMedia }) => {
    if (!msg.mediaPath && msg.type !== 'location') return null;
    const url = msg.mediaPath ? `${API_URL}/media/${msg.mediaPath}` : '';

    if (msg.mediaType === 'image') {
        return (
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginTop: '6px', maxWidth: '320px', position: 'relative', cursor: 'pointer' }} onClick={() => onOpenMedia('image', url, msg.text)}>
                <img src={url} alt="Media" style={{ width: '100%', height: 'auto', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', opacity: msg.text ? 1 : 0 }} />
            </div>
        );
    }

    if (msg.mediaType === 'video') {
        return (
            <div style={{ marginTop: '6px', borderRadius: '12px', overflow: 'hidden', background: '#000', maxWidth: '320px', position: 'relative', cursor: 'pointer' }} onClick={() => onOpenMedia('video', url, msg.text)}>
                <img src={`https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg&n=-1`} alt="Video Thumb" style={{ width: '100%', opacity: 0.7 }} onError={(e) => e.target.style.display = 'none'} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                    <Play size={28} fill="white" color="white" />
                </div>
            </div>
        );
    }

    if (msg.mediaType === 'audio') {
        return <AudioPlayer url={url} />;
    }

    if (msg.mediaType === 'document') {
        const ext = msg.fileName?.split('.').pop()?.toLowerCase() || 'file';
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '16px',
                marginTop: '8px', textDecoration: 'none', color: 'inherit',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                    <FileText size={28} color={ext === 'pdf' ? '#ef4444' : '#818cf8'} />
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                        {msg.fileName || 'Documento'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {ext.toUpperCase()} • {Math.round((msg.fileSize || 0) / 1024 / 1024 * 10) / 10 || '—'} MB
                    </div>
                </div>
                <Download size={20} style={{ opacity: 0.4 }} />
            </a>
        );
    }

    if (msg.type === 'location') {
        const [lat, lon] = msg.location?.split(',') || [0, 0];
        const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
        return (
            <div style={{ marginTop: '8px', cursor: 'pointer' }} onClick={() => window.open(mapUrl, '_blank')}>
                <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img
                        src={`https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${lon},${lat}&z=14&l=map&size=300,180`}
                        alt="Location"
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                        onError={(e) => e.target.src = 'https://via.placeholder.com/300x180?text=Mapa+Ubicación'}
                    />
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>📍</div>
                        <span style={{ fontWeight: '600' }}>Ubicación compartida</span>
                    </div>
                </div>
            </div>
        );
    }

    if (msg.mediaType === 'sticker') {
        return (
            <div style={{ padding: '8px 0' }}>
                <img src={url} alt="Sticker" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
            </div>
        );
    }

    return null;
};

const QuotedMessage = ({ quoted, onScrollTo }) => {
    if (!quoted) return null;
    return (
        <div
            onClick={() => onScrollTo(quoted.id)}
            style={{
                background: 'rgba(255,255,255,0.05)', borderLeft: '3px solid #7c3aed',
                padding: '10px 14px', borderRadius: '12px', marginBottom: '8px',
                cursor: 'pointer', fontSize: '12.5px', borderRight: '1px solid rgba(255,255,255,0.03)'
            }}
        >
            <div style={{ fontWeight: '800', color: '#7c3aed', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase' }}>
                {quoted.isBot ? 'Tú' : (quoted.pushName || quoted.senderName || 'Contacto')}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: quoted.isDeleted ? 'italic' : 'normal' }}>
                {quoted.isDeleted ? '🚫 Mensaje eliminado' : (quoted.text || getMessagePreview(quoted))}
            </div>
        </div>
    );
};

const ReactionsList = ({ reactions }) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
    return (
        <div style={{
            position: 'absolute', bottom: '-10px', right: '10px',
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: '20px', padding: '3px 10px', display: 'flex', gap: '6px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)', zIndex: 10, backdropFilter: 'blur(10px)'
        }}>
            {Object.entries(reactions).map(([emoji, count]) => (
                <span key={emoji} style={{ fontSize: '13px', fontWeight: 'bold' }}>{emoji}<span style={{ fontSize: '10px', marginLeft: '2px', opacity: 0.8 }}>{count > 1 ? count : ''}</span></span>
            ))}
        </div>
    );
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
    const [modalData, setModalData] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const scrollRef = useRef(null);
    const chatEndRef = useRef(null);
    const isAtBottom = useRef(true);

    const scrollToBottom = (behavior = 'smooth') => {
        chatEndRef.current?.scrollIntoView({ behavior });
        setNewMessagesCount(0);
        setShowScrollButton(false);
        isAtBottom.current = true;
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        const atBottom = distanceToBottom < 100;
        isAtBottom.current = atBottom;

        if (atBottom) {
            setShowScrollButton(false);
            setNewMessagesCount(0);
        } else if (distanceToBottom > 300) {
            // No hacemos nada automático, pero el estado de isAtBottom ya es false
        }
    };

    const handleOpenMedia = (type, url, caption) => {
        setModalData({ type, url, caption });
    };

    // Cargar contactos al inicio
    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/chats`, {
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
        const chatId = contact.whatsapp_id || contact.id;
        fetch(`${API_URL}/api/chat/${chatId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setMessages(data);
                // PASO 4: Marcar como leído en WhatsApp si hay mensajes
                if (data.length > 0) {
                    const lastMsg = data[data.length - 1];
                    if (lastMsg.sender === 'user') { // Solo si el último es del cliente
                        fetch(`${API_URL}/api/chat/read?whatsapp_id=${contact.whatsapp_id}&message_id=${lastMsg.id}`, {
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
            fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchTerm)}`, {
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
                            last_message: getMessagePreview(data.message),
                            timestamp: data.message.timestamp,
                            unread_count: (activeContact?.whatsapp_id === jid) ? 0 : data.unreadCount || (c.unread_count || 0) + 1,
                            pushName: data.message.pushName || c.pushName
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

                if (isAtBottom.current) {
                    setTimeout(() => scrollToBottom(), 100);
                } else {
                    setNewMessagesCount(prev => prev + 1);
                    setShowScrollButton(true);
                }

                // Marcar como leído automáticamente si el chat está abierto
                const token = localStorage.getItem('token');
                fetch(`${API_URL}/api/chat/read?whatsapp_id=${jid}&message_id=${data.message.id}`, {
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

        socket.on('presence_update', (data) => {
            setContacts(prev => prev.map(c =>
                c.whatsapp_id === data.whatsapp_id
                    ? { ...c, isOnline: data.status === 'available', lastSeen: data.lastSeen || c.lastSeen }
                    : c
            ));
        });

        socket.on('user_typing', (data) => {
            setContacts(prev => prev.map(c =>
                c.whatsapp_id === data.whatsapp_id
                    ? { ...c, isTyping: data.is_typing }
                    : c
            ));
        });

        socket.on('contacts_updated', () => {
            const token = localStorage.getItem('token');
            fetch(`${API_URL}/api/chats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    const sorted = Array.isArray(data) ? [...data].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : [];
                    setContacts(sorted);
                })
                .catch(err => console.error("Error refetching chats:", err));
        });

        return () => {
            socket.off('new_whatsapp_message');
            socket.off('message_status_update');
            socket.off('sync_progress');
            socket.off('whatsapp_contacts');
            socket.off('contacts_updated');
        };
    }, [activeContact]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim() || !activeContact) return;

        const timestamp = Math.floor(Date.now() / 1000);
        const text = inputValue;

        const payload = {
            to: activeContact.whatsapp_id || activeContact.id,
            text: text,
            quotedMsg: replyingTo ? {
                key: { id: replyingTo.id, remoteJid: replyingTo.whatsapp_id || activeContact.whatsapp_id },
                message: { conversation: replyingTo.text || getMessagePreview(replyingTo) }
            } : null
        };

        socket.emit('send_whatsapp_message', payload);

        const newMessage = {
            id: 'temp-' + Date.now(),
            text: text,
            sender: 'bot',
            timestamp: timestamp,
            status: 1, // Pending
            quotedMsg: replyingTo ? {
                id: replyingTo.id,
                text: replyingTo.text || getMessagePreview(replyingTo),
                sender: replyingTo.sender,
                pushName: replyingTo.pushName
            } : null
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setReplyingTo(null);
        setTimeout(() => scrollToBottom(), 100);

        setContacts(prev => {
            const updated = prev.map(c => {
                if (c.whatsapp_id === activeContact.whatsapp_id) {
                    return { ...c, last_message: text, timestamp: timestamp };
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
    };

    const handleSaveNotes = () => {
        if (!activeContact) return;
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/contacts/${activeContact.id}/notes`, {
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
                    {!searchResults && filteredContacts.map(contact => {
                        const displayName = contact.pushName || contact.name || contact.phone || 'Desconocido';
                        const isSelected = activeContact?.whatsapp_id === contact.whatsapp_id;

                        return (
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
                                    background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                    transition: 'all 0.2s',
                                    border: '1px solid',
                                    borderColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                }}
                                className={isSelected ? '' : 'hover:bg-white/5'}
                            >
                                <div style={{ position: 'relative' }}>
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
                                        boxShadow: isSelected ? '0 8px 16px -4px rgba(0,0,0,0.3)' : 'none'
                                    }}>
                                        {displayName.charAt(0)}
                                    </div>
                                    {contact.isOnline && (
                                        <div style={{
                                            position: 'absolute', bottom: '2px', right: '2px',
                                            width: '12px', height: '12px', borderRadius: '50%',
                                            background: '#10d9a0', border: '2px solid var(--bg-card)',
                                            boxShadow: '0 0 8px #10d9a040'
                                        }} />
                                    )}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <h4 className="heading-base" style={{ fontSize: '14.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {displayName}
                                        </h4>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: contact.unread_count > 0 ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                            {formatTime(contact.timestamp)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p
                                            className="text-small"
                                            style={{
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px',
                                                color: contact.isTyping ? '#10d9a0' : 'inherit',
                                                fontWeight: contact.isTyping ? '700' : 'normal'
                                            }}
                                        >
                                            {contact.isTyping ? 'Escribiendo...' : (getMessagePreview({ text: contact.last_message, mediaType: contact.mediaType }) || 'Sin mensajes')}
                                        </p>
                                        {contact.unread_count > 0 && (
                                            <div style={{ background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: '900', minWidth: '18px', height: '18px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 4px 8px rgba(99, 102, 241, 0.4)' }}>
                                                {contact.unread_count}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                                        {(activeContact.pushName || activeContact.name || activeContact.phone || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <h3 className="heading-base" style={{ fontSize: '15.5px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {activeContact.pushName || activeContact.name || activeContact.phone}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {(() => {
                                                const c = contacts.find(con => con.whatsapp_id === activeContact.whatsapp_id) || activeContact;
                                                if (c.isTyping) {
                                                    return (
                                                        <>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10d9a0', boxShadow: '0 0 8px #10d9a0' }}></div>
                                                            <span style={{ fontSize: '11px', color: '#10d9a0', fontWeight: '700', letterSpacing: '0.02em' }}>Escribiendo...</span>
                                                        </>
                                                    );
                                                }
                                                if (c.isOnline) {
                                                    return (
                                                        <>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10d9a0', boxShadow: '0 0 8px #10d9a0' }}></div>
                                                            <span style={{ fontSize: '11px', color: '#10d9a0', fontWeight: '700', letterSpacing: '0.02em' }}>En línea</span>
                                                        </>
                                                    );
                                                }
                                                return (
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                        Último visto {formatLastSeen(c.lastSeen)}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <Search size={19} className="text-slate-500 hover:text-indigo-400 transition-colors" />
                                    <MoreVertical size={19} className="text-slate-500 hover:text-indigo-400 transition-colors" />
                                </div>
                            </div>

                            <div
                                className="custom-scrollbar"
                                onScroll={handleScroll}
                                style={{
                                    flex: 1,
                                    padding: '32px 28px',
                                    overflowY: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.03) 0%, transparent 100%)',
                                    position: 'relative'
                                }}
                            >
                                {messages.map((msg, idx) => {
                                    const isBot = msg.sender === 'bot';
                                    const sameAsPrev = idx > 0 && messages[idx - 1].sender === msg.sender;
                                    const showName = activeContact.isGroup && !isBot && !sameAsPrev;
                                    const isDeleted = msg.text === '🚫 Este mensaje fue eliminado' || msg.isDeleted;
                                    const isForwarded = msg.isForwarded;

                                    const scrollToMessage = (id) => {
                                        const el = document.getElementById(`msg-${id}`);
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    };

                                    return (
                                        <div
                                            key={idx}
                                            id={`msg-${msg.id || idx}`}
                                            style={{
                                                alignSelf: isBot ? 'flex-end' : 'flex-start',
                                                maxWidth: '75%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                marginTop: sameAsPrev ? '2px' : '15px',
                                                animation: 'fadeIn 0.3s ease-out',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{
                                                padding: msg.mediaType === 'sticker' ? '0' : '10px 14px',
                                                borderRadius: isBot
                                                    ? (sameAsPrev ? '16px' : '16px 2px 16px 16px')
                                                    : (sameAsPrev ? '16px' : '2px 16px 16px 16px'),
                                                background: msg.mediaType === 'sticker' ? 'transparent' : (isBot ? 'var(--primary-gradient)' : 'var(--bg-hover)'),
                                                color: isBot ? 'white' : 'var(--text-title)',
                                                fontSize: '14px',
                                                fontWeight: isBot ? '500' : '400',
                                                boxShadow: (msg.mediaType === 'sticker' || !isBot) ? 'none' : '0 10px 15px -3px rgba(99, 102, 241, 0.2)',
                                                position: 'relative',
                                                border: (isBot || msg.mediaType === 'sticker') ? 'none' : '1px solid var(--border-subtle)',
                                                lineHeight: '1.5'
                                            }}>
                                                {isForwarded && !isDeleted && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', fontStyle: 'italic' }}>
                                                        <ExternalLink size={10} style={{ transform: 'rotate(180deg)' }} /> Reenviado
                                                    </div>
                                                )}

                                                {msg.quotedMsg && <QuotedMessage quoted={msg.quotedMsg} onScrollTo={scrollToMessage} />}

                                                {showName && (
                                                    <div style={{ fontSize: '11px', fontWeight: '800', color: getAvatarColor(msg.participant), marginBottom: '6px', letterSpacing: '0.02em' }}>
                                                        {msg.pushName || msg.participant?.split('@')[0]}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {(msg.mediaType && msg.mediaType !== 'text' || msg.type === 'location') && (
                                                        <MediaMessage msg={msg} onOpenMedia={handleOpenMedia} />
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between' }}>
                                                        <span style={{
                                                            flex: 1,
                                                            fontStyle: isDeleted ? 'italic' : 'normal',
                                                            color: isDeleted ? (isBot ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)') : 'inherit'
                                                        }}>
                                                            {isDeleted ? '🚫 Este mensaje fue eliminado' : (msg.text || getMessagePreview(msg))}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: isBot ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', marginTop: '4px', alignSelf: 'flex-end', fontWeight: '600' }}>
                                                            {formatTime(msg.timestamp)}
                                                            {!isDeleted && <StatusIcon status={msg.status} isBot={isBot} />}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ReactionsList reactions={msg.reactions} />
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />

                                {showScrollButton && (
                                    <button
                                        onClick={() => scrollToBottom()}
                                        style={{
                                            position: 'absolute', bottom: '20px', right: '30px',
                                            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                                            borderRadius: '50%', width: '40px', height: '40px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.4)', zIndex: 100,
                                            color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        className="hover:scale-110"
                                    >
                                        <ArrowLeft size={20} style={{ transform: 'rotate(-90deg)' }} />
                                        {newMessagesCount > 0 && (
                                            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                                {newMessagesCount}
                                            </span>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Barra de Respuestas (Reply) */}
                            {replyingTo && (
                                <div style={{
                                    padding: '12px 28px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)',
                                    display: 'flex', alignItems: 'center', gap: '15px', position: 'relative'
                                }}>
                                    <div style={{ flex: 1, borderLeft: '4px solid var(--primary)', paddingLeft: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                                        <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '11px', marginBottom: '2px', textTransform: 'uppercase' }}>
                                            Respondiendo a {replyingTo.isBot ? 'Tú' : (replyingTo.pushName || replyingTo.senderName || 'Contacto')}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {replyingTo.text || getMessagePreview(replyingTo)}
                                        </div>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <ArrowLeft size={16} style={{ transform: 'rotate(45deg)' }} />
                                    </button>
                                </div>
                            )}

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

            <MediaModal
                isOpen={!!modalData}
                onClose={() => setModalData(null)}
                data={modalData}
            />

            {contextMenu && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999
                    }}
                    onClick={() => setContextMenu(null)}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                >
                    <div style={{
                        position: 'absolute', top: contextMenu.y, left: contextMenu.x,
                        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                        borderRadius: '12px', padding: '8px', minWidth: '180px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                        animation: 'fadeIn 0.15s ease-out'
                    }}>
                        {[
                            { label: 'Responder', onClick: () => setReplyingTo(contextMenu.msg) },
                            { label: 'Copiar', onClick: () => navigator.clipboard.writeText(contextMenu.msg.text) },
                            { label: 'Reenviar', onClick: () => alert('Reenvío no disponible en demo') },
                            { label: 'Eliminar para mí', onClick: () => alert('Eliminar no disponible en demo') },
                            { label: 'Info del mensaje', onClick: () => alert('Info no disponible en demo') },
                        ].map((item, i) => (
                            <div
                                key={i}
                                onClick={() => { item.onClick(); setContextMenu(null); }}
                                style={{
                                    padding: '10px 16px', fontSize: '13.5px', color: 'var(--text-title)',
                                    cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s'
                                }}
                                className="hover:bg-white/5"
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounce { 0%, 100% { transform: translateY(0) rotate(-90deg); } 50% { transform: translateY(-5px) rotate(-90deg); } }
                
                .message-container:hover .message-options-btn {
                    opacity: 1 !important;
                }
                
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default Chats;
