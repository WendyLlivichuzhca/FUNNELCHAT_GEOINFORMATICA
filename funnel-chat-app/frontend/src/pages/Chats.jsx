import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Paperclip } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://127.0.0.1:8000', {
    transports: ['websocket']
});

const Chats = () => {
    const [contacts, setContacts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef(null);

    // Cargar contactos al inicio
    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://127.0.0.1:8000/api/contacts', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setContacts(data);
                if (data.length > 0) handleSelectContact(data[0]);
            })
            .catch(err => console.error("Error fetching contacts:", err));
    }, []);

    const handleSelectContact = (contact) => {
        setActiveContact(contact);
        const token = localStorage.getItem('token');
        // Cargar historial del contacto
        fetch(`http://127.0.0.1:8000/api/chat/${contact.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(err => console.error("Error fetching history:", err));
    };

    useEffect(() => {
        socket.on('response', (data) => {
            if (activeContact && (data.contact_id === activeContact.id || data.contact_id === activeContact.number)) {
                setMessages(prev => [...prev, { id: Date.now(), text: data.text, sender: 'bot' }]);
            }
        });

        socket.on('history_ready', (data) => {
            if (activeContact && (data.contact_id === activeContact.id || data.contact_id === activeContact.number)) {
                console.log(">>> HISTORIAL RECIBIDO Y LISTO PARA MOSTRAR");
                setMessages(data.history);
            }
        });

        return () => {
            socket.off('response');
            socket.off('history_ready');
        };
    }, [activeContact]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim() || !activeContact) return;

        const newMessage = { id: Date.now(), text: inputValue, sender: 'user' };

        // Send to server
        socket.emit('message', { contact_id: activeContact.id, text: inputValue });

        // Add locally
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 64px)', display: 'flex', gap: '24px' }}>
            {/* Conversation List */}
            <div className="glass-card" style={{ width: '320px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Conversaciones</h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {contacts.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => handleSelectContact(contact)}
                            style={{
                                padding: '12px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                backgroundColor: activeContact?.id === contact.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                border: `1px solid ${activeContact?.id === contact.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{contact.name}</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{contact.status}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {contact.email}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Window */}
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {activeContact?.name.charAt(0)}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{activeContact?.name || 'Selecciona un chat'}</h3>
                        <span style={{ fontSize: '12px', color: '#10b981' }}>Activo en el Funnel</span>
                    </div>
                </div>

                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{
                            alignSelf: msg.sender === 'user' ? 'flex-start' : 'flex-end',
                            maxWidth: '70%',
                            padding: '12px 16px',
                            borderRadius: msg.sender === 'user' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                            backgroundColor: msg.sender === 'user' ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                            border: msg.sender === 'user' ? '1px solid var(--surface-border)' : 'none',
                            color: 'white'
                        }}>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid var(--surface-border)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--surface-border)'
                    }}>
                        <Paperclip size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe un mensaje..."
                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', padding: '8px 0' }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Smile size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                            <Image size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                            <div
                                onClick={handleSend}
                                style={{ width: '36px', height: '36px', backgroundColor: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <Send size={18} color="white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chats;
