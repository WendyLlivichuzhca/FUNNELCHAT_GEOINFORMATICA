import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Smile, Paperclip, MoreVertical, Search } from 'lucide-react';
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
        socket.emit('message', inputValue);
        setMessages(prev => [...prev, { id: Date.now(), text: inputValue, sender: 'user' }]);
        setInputValue('');
    };

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', gap: '20px' }}>
            {/* Sidebar de Chats */}
            <div className="glass-card" style={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Chats</h3>
                        <button className="btn" style={{ background: 'var(--glass)', padding: '8px' }}><Search size={18} /></button>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar conversación..."
                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '8px 12px 8px 36px', color: 'white', fontSize: '14px' }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {[1].map(i => (
                        <div key={i} style={{
                            padding: '12px',
                            borderRadius: '16px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(109, 40, 217, 0.1)',
                            border: '1px solid var(--primary)',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>JP</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '600', fontSize: '14px' }}>Juan Pérez</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ahora</span>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {messages[messages.length - 1]?.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ventana de Chat Principal */}
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>JP</div>
                            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid var(--surface)' }}></div>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Juan Pérez</h3>
                            <p style={{ fontSize: '12px', color: '#10b981' }}>Escribiendo...</p>
                        </div>
                    </div>
                    <button className="btn" style={{ background: 'transparent' }}><MoreVertical size={20} color="var(--text-muted)" /></button>
                </div>

                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{
                            alignSelf: msg.sender === 'user' ? 'flex-start' : 'flex-end',
                            maxWidth: '70%',
                            padding: '14px 18px',
                            borderRadius: msg.sender === 'user' ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
                            backgroundColor: msg.sender === 'user' ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                            border: msg.sender === 'user' ? '1px solid var(--surface-border)' : 'none',
                            boxShadow: msg.sender === 'bot' ? '0 4px 15px rgba(109, 40, 217, 0.3)' : 'none'
                        }}>
                            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.text}</p>
                            <span style={{ display: 'block', fontSize: '10px', marginTop: '6px', textAlign: 'right', opacity: 0.6 }}>
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid var(--surface-border)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        padding: '10px 16px',
                        borderRadius: '16px',
                        border: '1px solid var(--surface-border)'
                    }}>
                        <Paperclip size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Escriba su mensaje aquí..."
                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '14px' }}
                        />
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Smile size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                            <Image size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: inputValue.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Send size={18} color="white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chats;
