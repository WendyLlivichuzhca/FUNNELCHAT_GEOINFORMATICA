import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Paperclip } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

const Chats = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: '¿Hola, podrías darme más información?', sender: 'user' },
        { id: 2, text: '¡Claro! ¿En qué puedo ayudarte hoy?', sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        socket.on('response', (data) => {
            setMessages(prev => [...prev, { id: Date.now(), text: data.text, sender: 'bot' }]);
        });

        return () => socket.off('response');
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Send to server
        socket.emit('message', inputValue);

        // Add locally immediately
        setMessages(prev => [...prev, { id: Date.now(), text: inputValue, sender: 'user' }]);
        setInputValue('');
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 64px)', display: 'flex', gap: '24px' }}>
            {/* Conversation List */}
            <div className="glass-card" style={{ width: '320px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Conversaciones</h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {[1].map(i => (
                        <div key={i} style={{
                            padding: '12px',
                            borderRadius: '12px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(109, 40, 217, 0.1)',
                            border: '1px solid var(--primary)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '500' }}>Cliente {i}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ahora</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {messages[messages.length - 1]?.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Window */}
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>C1</div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Cliente 1</h3>
                        <span style={{ fontSize: '12px', color: '#10b981' }}>En línea</span>
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
