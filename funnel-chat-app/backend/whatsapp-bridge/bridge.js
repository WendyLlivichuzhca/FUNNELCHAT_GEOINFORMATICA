const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const io = require('socket.io-client');

// Conexión al backend de FastAPI
const socket = io('http://localhost:8000');

socket.on('connect', () => {
    console.log('CONECTADO AL BACKEND FASTAPI (SOCKET.IO)');
});

socket.on('connect_error', (err) => {
    console.error('ERROR DE CONEXIÓN AL BACKEND:', err.message);
});

const client = new Client({
    authStrategy: new LocalAuth({
        dataId: 'funnel-chat-session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('NUEVO QR RECIBIDO. ENVIANDO A FRON END...');
    // qrcode.generate(qr, { small: true }); // Opcional: Ver en consola
    socket.emit('whatsapp_qr', { qr });
});

client.on('ready', async () => {
    console.log('WHATSAPP ESTÁ LISTO!');
    socket.emit('whatsapp_status', { status: 'conectado' });

    console.log('ESPERANDO 2 SEGUNDOS PARA QUE LA LIBRETA SE DESCARGUE (OPTIMIZADO)...');
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const [contacts, chats] = await Promise.all([
            client.getContacts(),
            client.getChats()
        ]);

        console.log(`SE ENCONTRARON ${contacts.length} CONTACTOS EN TOTAL Y ${chats.length} CHATS.`);

        // Crear mapa de nombres desde los chats (útil si la libreta aún no se sincroniza)
        const chatNames = {};
        for (const chat of chats) {
            if (!chat.isGroup && chat.name && chat.name !== chat.id.user) {
                chatNames[chat.id._serialized] = chat.name;
            }
        }

        // Filtrar para incluir SOLO los que tengan algún tipo de nombre textual (no solo el número)
        const validContacts = contacts
            .filter(c => !c.isGroup && c.id && c.id.server === 'c.us')
            .map(c => {
                const finalName = c.name || chatNames[c.id._serialized] || c.pushname || c.verifiedName;
                return {
                    id: c.id._serialized,
                    name: finalName,
                    number: c.number || c.id._serialized.split('@')[0],
                    isGroup: false
                };
            })
            .filter(c => c.name && c.name.trim() !== ''); // Excluir si no hay nombre

        console.log(`ENVIANDO ${validContacts.length} CONTACTOS IDENTIFICADOS AL BACKEND...`);
        socket.emit('whatsapp_contacts', { contacts: validContacts });
    } catch (err) {
        console.error('ERROR AL OBTENER CONTACTOS:', err);
    }
});

socket.on('request_contacts_sync', async () => {
    console.log('PETICIÓN MANUAL DE SINCRONIZACIÓN DE CONTACTOS RECIBIDA');
    try {
        const [contacts, chats] = await Promise.all([
            client.getContacts(),
            client.getChats()
        ]);

        const chatNames = {};
        for (const chat of chats) {
            if (!chat.isGroup && chat.name && chat.name !== chat.id.user) {
                chatNames[chat.id._serialized] = chat.name;
            }
        }

        const validContacts = contacts
            .filter(c => !c.isGroup && c.id && c.id.server === 'c.us')
            .map(c => {
                const finalName = c.name || chatNames[c.id._serialized] || c.pushname || c.verifiedName;
                return {
                    id: c.id._serialized,
                    name: finalName,
                    number: c.number || c.id._serialized.split('@')[0],
                    isGroup: false
                };
            })
            .filter(c => c.name && c.name.trim() !== ''); // Excluir si no hay nombre

        socket.emit('whatsapp_contacts', { contacts: validContacts });
    } catch (err) {
        console.error('ERROR EN SINCRONIZACIÓN MANUAL:', err);
    }
});

client.on('authenticated', () => {
    console.log('AUTENTICADO CORRECTAMENTE');
});

client.on('auth_failure', (msg) => {
    console.error('FALLO DE AUTENTICACIÓN', msg);
    socket.emit('whatsapp_status', { status: 'error', message: msg });
});

client.on('disconnected', (reason) => {
    console.log('DESCONECTADO', reason);
    socket.emit('whatsapp_status', { status: 'desconectado' });
});

client.on('message', async (msg) => {
    // Reenviar mensajes al backend para el motor de flujos
    socket.emit('whatsapp_message', {
        from: msg.from,
        body: msg.body,
        name: msg._data.notifyName
    });
});

client.initialize();
