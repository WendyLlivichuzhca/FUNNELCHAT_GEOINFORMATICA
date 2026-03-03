import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus } from 'lucide-react';

const Contactos = () => {
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/contacts')
            .then(res => res.json())
            .then(data => setContacts(data))
            .catch(err => console.error("Error fetching contacts:", err));
    }, []);

    return (
        <div className="animate-fade-in">
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
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar contactos..."
                            style={{
                                width: '100%',
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--surface-border)',
                                borderRadius: '8px',
                                padding: '10px 10px 10px 40px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <button className="btn" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                            <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Nombre</th>
                            <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Email</th>
                            <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Estado</th>
                            <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Etiqueta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(contact => (
                            <tr key={contact.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                                <td style={{ padding: '16px 12px' }}>{contact.name}</td>
                                <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{contact.email}</td>
                                <td style={{ padding: '16px 12px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        backgroundColor: contact.status === 'Caliente' ? 'rgba(239, 68, 68, 0.2)' : contact.status === 'Tibio' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                        color: contact.status === 'Caliente' ? '#ef4444' : contact.status === 'Tibio' ? '#f59e0b' : '#3b82f6'
                                    }}>
                                        {contact.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 12px' }}>
                                    <span style={{ backgroundColor: 'var(--surface-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                        {contact.tag}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Contactos;
