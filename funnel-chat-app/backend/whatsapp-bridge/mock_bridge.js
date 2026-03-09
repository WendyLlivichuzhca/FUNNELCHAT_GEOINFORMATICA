/**
 * mock_bridge.js
 * Un simulador de puente de WhatsApp que imita el comportamiento de Baileys
 * para facilitar el desarrollo y pruebas sin necesidad de un teléfono real.
 * Basado en la lógica de simulación proporcionada por el usuario.
 */

const io = require('socket.io-client');

// Conexión al backend de FastAPI
const socket = io('http://127.0.0.1:8000', {
    transports: ['websocket']
});

console.log('>>> [SIMULADOR] INICIANDO PUENTE SIMULADO...');

socket.on('connect', () => {
    console.log('>>> [SIMULADOR] CONECTADO AL BACKEND (SID:', socket.id, ')');

    // 1. Simular generación de QR
    console.log('>>> [SIMULADOR] GENERANDO QR DE PRUEBA...');
    socket.emit('whatsapp_qr', { qr: 'MOCK_QR_CODE_FOR_TESTING_PURPOSES' });

    // 2. Simular escaneo después de 5 segundos
    setTimeout(() => {
        console.log('>>> [SIMULADOR] SIMULANDO ESCANEO EXITOSO...');
        socket.emit('whatsapp_status', { status: 'conectado' });

        // 3. Simular Sincronización de Contactos
        setTimeout(() => {
            console.log('>>> [SIMULADOR] ENVIANDO CONTACTOS DE PRUEBA...');
            const mockContacts = [
                { id: '123456789@c.us', name: 'Juan Prueba (Simulado)', number: '123456789' },
                { id: '987654321@c.us', name: 'Maria Test (Simulado)', number: '987654321' },
                { id: '555123456@g.us', name: 'Grupo de Desarrollo', number: '555123456', isGroup: true }
            ];

            socket.emit('whatsapp_contacts', {
                contacts: mockContacts,
                is_batch: false
            });

            // 4. Enviar un mensaje inicial
            socket.emit('whatsapp_message', {
                id: 'MOCK_MSG_1',
                contact_id: '123456789@c.us',
                whatsapp_id: '123456789@c.us',
                text: '¡Hola! Soy un mensaje de prueba del simulador.',
                sender: 'user',
                timestamp: Math.floor(Date.now() / 1000),
                fromMe: false
            });
        }, 2000);
    }, 5000);
});

// Manejar envío de mensajes desde el CRM
socket.on('send_whatsapp_message', (data) => {
    const { to, text } = data;
    console.log(`>>> [SIMULADOR] RECIBIDO PARA ENVIAR A ${to}: ${text}`);

    // Simular eco o respuesta automática
    setTimeout(() => {
        socket.emit('whatsapp_message', {
            id: 'MOCK_REPLY_' + Date.now(),
            contact_id: to,
            whatsapp_id: to,
            text: `[SIMULADOR] He recibido tu mensaje: "${text}"`,
            sender: 'user',
            timestamp: Math.floor(Date.now() / 1000),
            fromMe: false
        });
    }, 1000);
});

socket.on('disconnect', () => {
    console.log('>>> [SIMULADOR] DESCONECTADO DEL BACKEND');
});

// Mantener el proceso vivo
setInterval(() => { }, 1000);
