import React from 'react';
import { Send } from 'lucide-react';

const Difusion = () => (
    <div className="animate-fade-in text-center py-20">
        <div className="glass-card p-10 max-w-lg mx-auto" style={{ margin: '0 auto' }}>
            <Send size={48} color="var(--primary)" style={{ margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Campañas de Difusión</h2>
            <p style={{ color: 'var(--text-muted)' }}>
                Próximamente: Envía mensajes masivos personalizados a tus segmentos de contactos.
            </p>
        </div>
    </div>
);

export default Difusion;
