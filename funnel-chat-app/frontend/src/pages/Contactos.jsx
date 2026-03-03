import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Tag } from 'lucide-react';

const Contactos = () => {
    const [contacts, setContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredContacts, setFilteredContacts] = useState([]);

    useEffect(() => {
        fetch('http://localhost:8000/api/contacts')
            .then(res => res.json())
            .then(data => {
                setContacts(data);
                setFilteredContacts(data);
            })
            .catch(err => console.error("Error fetching contacts:", err));
    }, []);

    useEffect(() => {
        const results = contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredContacts(results);
    }, [searchTerm, contacts]);

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
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '14px' }}>NOMBRE</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '14px' }}>EMAIL</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '14px' }}>ESTADO</th>
                                <th style={{ padding: '12px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '14px' }}>ETIQUETA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map(contact => (
                                    <tr key={contact.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: '500' }}>{contact.name}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{contact.email}</td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                backgroundColor: contact.status === 'Caliente' ? 'rgba(239, 68, 68, 0.2)' : contact.status === 'Tibio' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                color: contact.status === 'Caliente' ? '#ef4444' : contact.status === 'Tibio' ? '#f59e0b' : '#3b82f6'
                                            }}>
                                                {contact.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', width: 'fit-content' }}>
                                                <Tag size={12} style={{ color: 'var(--primary)' }} />
                                                {contact.tag}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No se encontraron contactos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Contactos;
