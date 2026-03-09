const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');
const io = require('socket.io-client');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Conexión al backend de FastAPI
const socket = io('http://127.0.0.1:8000', {
    transports: ['websocket']
});

const logger = pino({ level: 'info' });

let sock;
let isStarted = false;
let isClosing = false; // Nueva bandera para evitar bucles durante el cierre
let retryCount = 0;
const MAX_NET_RETRIES = 3;
const MAX_TOTAL_RETRIES = 10;
const BASE_DELAY = 3000;

async function downloadMedia(msg) {
    try {
        const msgContent = msg.message;
        if (!msgContent) return null;

        const type = Object.keys(msgContent).find(key => key.endsWith('Message') && !['protocolMessage', 'senderKeyDistributionMessage'].includes(key));
        if (!type || !['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(type)) return null;

        const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });

        let extension = 'bin';
        if (type === 'imageMessage') extension = 'jpg';
        else if (type === 'videoMessage') extension = 'mp4';
        else if (type === 'audioMessage') extension = 'ogg';
        else if (type === 'stickerMessage') extension = 'webp';
        else if (type === 'documentMessage') {
            const fileName = msgContent.documentMessage.fileName || 'file';
            extension = fileName.split('.').pop();
        }

        const fileName = `${msg.key.id}.${extension}`;
        const filePath = path.join(__dirname, 'media', fileName);
        fs.writeFileSync(filePath, buffer);
        console.log(`>>> [BAILEYS] MEDIA DESCARGADA: ${fileName}`);
        return fileName;
    } catch (e) {
        if (e.output?.statusCode !== 403) {
            console.error('>>> [BAILEYS] ERROR DESCARGANDO MEDIA:', e.message || e);
        } else {
            console.log('>>> [BAILEYS] MEDIA EXPIRADA (403). IGNORANDO.');
        }
        return null;
    }
}

async function startSock() {
    if (isStarted) {
        console.log('>>> [BAILEYS] EL SOCKET YA SE ESTÁ INICIANDO O ESTÁ ACTIVO. IGNORANDO.');
        return;
    }
    isStarted = true;

    const authPath = path.join(__dirname, 'auth_info_baileys');
    const hasCreds = fs.existsSync(path.join(authPath, 'creds.json'));

    if (!hasCreds) {
        console.log('>>> [BAILEYS] NO HAY CREDENCIALES GUARDADAS. GENERANDO NUEVO QR...');
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
        }
    }

    if (sock) {
        console.log('>>> [BAILEYS] CERRANDO SOCKET ANTERIOR...');
        try { sock.end(); } catch (e) { }
        sock = null;
    }

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    console.log('>>> [BAILEYS] VERIFICANDO VERSIÓN DE WHATSAPP...');
    let version;
    try {
        const result = await fetchLatestBaileysVersion();
        version = result.version;
    } catch (e) {
        version = [2, 3010, 1012354789];
    }

    sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityQR: false,
        syncFullHistory: false,
        connectTimeoutMs: 120000,
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: 60000,
        maxRetries: 5,
        retryRequestDelayMs: 10000,
        shouldSyncHistoryMessage: () => true,
        shouldIgnoreJid: (jid) => jid.endsWith('@newsletter')
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) socket.emit('whatsapp_qr_ready', { qr: qr });

        if (connection === 'close') {
            const errorCode = lastDisconnect.error?.output?.statusCode;
            isStarted = false;

            if (errorCode === DisconnectReason.loggedOut || isClosing) {
                console.log('>>> [BAILEYS] SESIÓN CERRADA/EXPIRADA. LIMPIANDO...');
                socket.emit('whatsapp_status', { status: 'session_expired' });

                // Borrar carpeta de sesión y reiniciar
                if (fs.existsSync(authPath)) {
                    fs.rmSync(authPath, { recursive: true, force: true });
                }

                isClosing = false;
                // Reiniciar para generar nuevo QR automáticamente
                setTimeout(startSock, 1000);
            } else if (errorCode === DisconnectReason.connectionReplaced) {
                console.log('>>> [BAILEYS] SESIÓN ABIERTA EN OTRO LUGAR (CONFLICTO). ESPERANDO 10s...');
                socket.emit('whatsapp_status', { status: 'conflict' });
                setTimeout(startSock, 10000);
            } else if (retryCount < MAX_TOTAL_RETRIES) {
                retryCount++;
                const isSilent = retryCount <= MAX_NET_RETRIES;
                if (!isSilent) {
                    console.log(`>>> [BAILEYS] ERROR DE CONEXIÓN. REINTENTO ${retryCount}/${MAX_TOTAL_RETRIES}...`);
                }
                setTimeout(startSock, Math.min(BASE_DELAY * Math.pow(2, retryCount - 1), 60000));
            } else {
                console.error('>>> [BAILEYS] ERROR CRÍTICO: MÁXIMO DE REINTENTOS ALCANZADO.');
                socket.emit('whatsapp_status', { status: 'error' });
            }
        } else if (connection === 'open') {
            retryCount = 0;
            isClosing = false;
            console.log('>>> ✅ BAILEYS CONECTADO');
            socket.emit('whatsapp_status', { status: 'conectado' });
            setTimeout(() => socket.emit('whatsapp_ready_for_sync'), 2000);
        }
    });

    sock.ev.on('messaging-history.set', async ({ chats, contacts, messages }) => {
        console.log(`>>> [BAILEYS] RECIBIDO HISTORIAL: ${chats.length} CHATS.`);
        socket.emit('sync_progress', { progress: 10, message: 'Vinculando chats...' });

        const activeChats = chats.filter(chat => {
            // Excluir newsletters y broadcasts
            if (chat.id.endsWith('@newsletter')) return false;
            if (chat.id.endsWith('@broadcast')) return false;
            if (chat.id === 'status@broadcast') return false;

            // DEBE tener al menos 1 mensaje real con contenido
            const chatMessages = messages.filter(m =>
                m.key.remoteJid === chat.id &&
                m.message &&
                !m.message.protocolMessage &&
                !m.message.senderKeyDistributionMessage
            );
            if (chatMessages.length === 0) return false;

            // DEBE tener timestamp de conversación real
            if (!chat.conversationTimestamp && !chat.lastMsgTimestamp) return false;

            return true;
        });

        console.log(`>>> [FILTRO] Recibidos: ${chats.length} | Con conversación real: ${activeChats.length}`);

        const total = activeChats.length;
        for (let index = 0; index < activeChats.length; index++) {
            const chat = activeChats[index];
            const jid = chat.id;
            const isGroup = jid.endsWith('@g.us');
            const num = isGroup ? jid : jid.split('@')[0];
            let name = chat.name || (contacts || []).find(c => c.id === jid)?.name || `+${num}`;

            const chatMessagesBatch = messages.filter(m => m.key.remoteJid === jid);
            const lastMsg = chatMessagesBatch[chatMessagesBatch.length - 1];
            let lastMsgText = "";
            let lastTimestamp = chat.conversationTimestamp || chat.lastMsgTimestamp || 0;

            if (lastMsg?.message) {
                const m = lastMsg.message;
                lastMsgText = m.conversation || m.extendedTextMessage?.text ||
                    (m.imageMessage ? "📷 Foto" :
                        m.audioMessage ? "🎵 Audio" :
                            m.videoMessage ? "🎥 Video" :
                                m.documentMessage ? "📄 Documento" : "Mensaje");
                if (isGroup && !lastMsg.key.fromMe) lastMsgText = `${lastMsg.pushName || "Alguien"}: ${lastMsgText}`;
                lastTimestamp = lastMsg.messageTimestamp;
            }

            socket.emit('whatsapp_contacts', {
                contacts: [{
                    id: jid, whatsapp_id: jid, name, number: num, isGroup,
                    unreadCount: chat.unreadCount || 0,
                    lastMessage: lastMsgText, timestamp: lastTimestamp,
                    participants: chat.participants || []
                }],
                is_batch: true, batch_index: index, total_chats: total
            });

            const chatMessages = [];
            const recentBatch = chatMessagesBatch.slice(-20);

            for (const m of recentBatch) {
                const msg = m.message;
                let text = msg?.conversation || msg?.extendedTextMessage?.text || (msg?.imageMessage?.caption) || (msg?.videoMessage?.caption) || (msg?.documentMessage?.caption) || "";
                let mediaType = msg?.imageMessage ? "image" : msg?.videoMessage ? "video" : msg?.audioMessage ? "audio" : msg?.documentMessage ? "document" : "text";

                let mediaPath = null;
                if (mediaType !== 'text') {
                    mediaPath = await downloadMedia(m);
                }

                chatMessages.push({
                    id: m.key.id, text, sender: m.key.fromMe ? 'bot' : 'user',
                    timestamp: m.messageTimestamp, mediaType, status: m.status || 1,
                    participant: m.key.participant || null, pushName: m.pushName || null,
                    mediaPath: mediaPath,
                    fileName: msg?.documentMessage?.fileName || null
                });
            }

            if (chatMessages.length > 0) socket.emit('whatsapp_chat_history', { contact_id: jid, whatsapp_id: jid, history: chatMessages });
        }
        socket.emit('sync_progress', { progress: 100, message: 'Finalizado' });
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe || (msg.key.fromMe && msg.message)) {
                    const jid = msg.key.remoteJid;
                    const msgContent = msg.message;
                    let text = msgContent?.conversation || msgContent?.extendedTextMessage?.text || msgContent?.imageMessage?.caption || msgContent?.videoMessage?.caption || msgContent?.documentMessage?.caption || "";
                    let mediaType = msgContent?.imageMessage ? "image" : msgContent?.videoMessage ? "video" : msgContent?.audioMessage ? "audio" : msgContent?.documentMessage ? "document" : "text";

                    let mediaPath = null;
                    if (mediaType !== 'text') {
                        mediaPath = await downloadMedia(msg);
                    }

                    socket.emit('whatsapp_message', {
                        id: msg.key.id, contact_id: jid, whatsapp_id: jid, text,
                        sender: msg.key.fromMe ? 'bot' : 'user', timestamp: msg.messageTimestamp,
                        fromMe: msg.key.fromMe, status: msg.status || 1,
                        participant: msg.key.participant || null, pushName: msg.pushName || null,
                        mediaType, mediaPath, fileName: msgContent?.documentMessage?.fileName || null
                    });
                }
            }
        }
    });

    sock.ev.on('message-receipt.update', (receipts) => {
        socket.emit('whatsapp_receipt', receipts);
    });

    socket.on('send_whatsapp_message', async (data) => {
        const { to, text } = data;
        await sock.sendMessage(to, { text: text });
    });

    socket.on('mark_as_read', async (data) => {
        const { whatsapp_id, message_id } = data;
        try {
            await sock.readMessages([{ remoteJid: whatsapp_id, id: message_id, fromMe: false }]);
            console.log(`>>> [BAILEYS] MARCADO COMO LEÍDO: ${whatsapp_id}`);
        } catch (e) {
            console.error('>>> [BAILEYS] ERROR AL MARCAR COMO LEÍDO:', e);
        }
    });

    socket.on('whatsapp_logout', async () => {
        console.log('>>> [BAILEYS] PETICIÓN DE LOGOUT RECIBIDA.');
        isClosing = true;
        try {
            if (sock) await sock.logout();
        } catch (e) {
            // Si falla el logout (ej. ya cerrado), forzamos reinicio
            isStarted = false;
            const authPath = path.join(__dirname, 'auth_info_baileys');
            if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
            setTimeout(startSock, 1000);
        }
    });
}

socket.on('connect', () => { startSock(); });
