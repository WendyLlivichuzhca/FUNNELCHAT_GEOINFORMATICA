const { Client, LocalAuth } = require('whatsapp-web.js');
const io = require('socket.io-client');

// Conexión al backend de FastAPI
const socket = io('http://127.0.0.1:8000', {
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('>>> BRIDGE CONECTADO AL BACKEND (SID:', socket.id, ')');
});

const client = new Client({
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

let lastQr = null;
client.on('qr', (qr) => {
    if (qr !== lastQr) {
        lastQr = qr;
        console.log('>>> NUEVO QR GENERADO. ENVIANDO AL BACKEND...');
        socket.emit('whatsapp_qr', { qr });
    }
});

client.on('ready', async () => {
    console.log('>>> WHATSAPP ESTÁ LISTO!');
    socket.emit('whatsapp_status', { status: 'conectado' });

    console.log('INICIANDO SINCRONIZACIÓN PRIORITARIA DE CHATS Y GRUPOS...');
    try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const chats = await client.getChats();
        console.log(`>>> SE ENCONTRARON ${chats.length} CHATS ACTIVOS.`);

        const validContacts = chats
            .filter(chat => chat.id.server === 'c.us' || chat.id.server === 'g.us')
            .map(chat => {
                const num = chat.isGroup ? chat.id._serialized : chat.id.user;
                return {
                    id: chat.id._serialized,
                    // Si no hay nombre, usamos el número o ID como respaldo para que no se pierda el contacto
                    name: chat.name || chat.pushname || (chat.isGroup ? 'Grupo de WhatsApp' : num),
                    number: num,
                    isGroup: chat.isGroup
                };
            });

        console.log(`>>> ENVIANDO ${validContacts.length} CONTACTOS TOTALES AL BACKEND (FILTRO FLEXIBLE)...`);
        socket.emit('whatsapp_contacts', { contacts: validContacts });
    } catch (err) {
        console.error('ERROR EN SINCRONIZACIÓN INTEGRAL:', err);
    }
});

// NUEVO: Recuperación de historial bajo demanda
socket.on('request_chat_history', async (data) => {
    const contactId = data ? data.contact_id : null;

    if (!contactId || contactId === 'null' || contactId === 'undefined') {
        console.log('>>> [BRIDGE] ID de contacto inválido recibido, ignorando petición.');
        return;
    }

    console.log(`>>> PETICIÓN DE HISTORIAL PARA: ${contactId}`);
    try {
        // Verificar que el cliente existe y está listo
        if (!client || !client.pupPage) {
            console.log('>>> [BRIDGE] El cliente de WhatsApp no ha cargado aún el navegador.');
            return;
        }

        const state = await client.getState().catch(() => null);
        if (state !== 'CONNECTED') {
            console.log(`>>> [BRIDGE] Cliente en estado ${state}, no se puede recuperar historial aún.`);
            return;
        }

        const chat = await client.getChatById(contactId);
        const messages = await chat.fetchMessages({ limit: 40 });

        const history = messages.map(msg => ({
            id: msg.id._serialized,
            text: msg.body,
            sender: msg.fromMe ? 'bot' : 'user',
            timestamp: msg.timestamp
        }));

        console.log(`>>> ENVIANDO ${history.length} MENSAJES DE HISTORIAL A ${contactId}`);
        socket.emit('whatsapp_history_response', { contact_id: contactId, history });
    } catch (err) {
        console.error('ERROR AL RECUPERAR HISTORIAL:', err.message);
    }
});

socket.on('request_contacts_sync', async () => {
    console.log('PETICIÓN MANUAL DE SINCRONIZACIÓN DE CHATS RECIBIDA');
    try {
        const chats = await client.getChats();
        const validContacts = chats
            .filter(chat => !chat.isGroup && chat.id.server === 'c.us')
            .map(chat => {
                return {
                    id: chat.id._serialized,
                    name: chat.name || chat.pushname || chat.id.user,
                    number: chat.id.user,
                    isGroup: false
                };
            })
            .filter(c => c.name && c.name.trim() !== '');

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
