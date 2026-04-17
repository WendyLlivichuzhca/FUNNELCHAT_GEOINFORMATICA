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
const INITIAL_HISTORY_LIMIT = 80;
const LOAD_MORE_HISTORY_LIMIT = 60;
const PHOTO_SYNC_LIMIT = 300;
const AUTH_PATH = path.join(__dirname, 'auth_info_baileys');

const contactCache = new Map();
const historyCache = new Map();
const groupParticipantsCache = new Map();
const pendingHistoryRequests = new Map();
const lidToPnCache = new Map();

const stripDeviceSuffix = (value = '') => String(value).split(':')[0];
const extractUserFromJid = (jid = '') => String(jid).split('@')[0];
const isGroupJid = (jid = '') => String(jid).endsWith('@g.us');
const isLidJid = (jid = '') => String(jid).includes('@lid');
const toCanonicalUserJid = (phone) => (phone ? `${stripDeviceSuffix(String(phone))}@s.whatsapp.net` : null);
const uniqueValues = (values = []) => [...new Set((values || []).filter(Boolean))];
const mergeSourceJids = (existing = [], incoming = []) => uniqueValues([...(existing || []), ...(incoming || [])]);

function loadPersistedLidMappings() {
    try {
        const files = fs.readdirSync(AUTH_PATH).filter((file) => file.startsWith('lid-mapping-') && file.endsWith('.json'));
        for (const file of files) {
            const fullPath = path.join(AUTH_PATH, file);
            const rawValue = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            const baseName = file.replace('lid-mapping-', '').replace('.json', '');

            if (baseName.endsWith('_reverse')) {
                const lidUser = baseName.replace('_reverse', '');
                const pnUser = stripDeviceSuffix(String(rawValue || ''));
                if (lidUser && pnUser) {
                    lidToPnCache.set(lidUser, pnUser);
                }
            } else {
                const pnUser = stripDeviceSuffix(baseName);
                const lidUser = stripDeviceSuffix(String(rawValue || ''));
                if (lidUser && pnUser) {
                    lidToPnCache.set(lidUser, pnUser);
                }
            }
        }
    } catch (e) {
        // Nada grave si aún no existen mappings.
    }
}

const normalizeTimestamp = (value) => {
    if (!value) return 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

async function resolvePublicPhone(jid) {
    if (!jid || isGroupJid(jid)) {
        return null;
    }

    if (!isLidJid(jid)) {
        return stripDeviceSuffix(extractUserFromJid(jid));
    }

    const lidUser = stripDeviceSuffix(extractUserFromJid(jid));
    if (lidToPnCache.has(lidUser)) {
        return lidToPnCache.get(lidUser);
    }

    try {
        const pnJid = await sock?.signalRepository?.lidMapping?.getPNForLID(jid);
        if (pnJid) {
            const pnUser = stripDeviceSuffix(extractUserFromJid(pnJid));
            if (pnUser) {
                lidToPnCache.set(lidUser, pnUser);
                return pnUser;
            }
        }
    } catch (e) {
        // Ignorar y caer al fallback.
    }

    return null;
}

async function resolvePublicParticipantJid(jid) {
    if (!jid) {
        return null;
    }
    const phone = await resolvePublicPhone(jid);
    return phone ? `${phone}@s.whatsapp.net` : jid;
}

async function getCanonicalJid(jid) {
    if (!jid || isGroupJid(jid)) {
        return jid;
    }
    const phone = await resolvePublicPhone(jid);
    return toCanonicalUserJid(phone) || jid;
}

const getMessageText = (message = {}) => (
    message?.conversation ||
    message?.extendedTextMessage?.text ||
    message?.imageMessage?.caption ||
    message?.videoMessage?.caption ||
    message?.documentMessage?.caption ||
    ''
);

const getMediaType = (message = {}) => {
    if (message?.imageMessage) return 'image';
    if (message?.videoMessage) return 'video';
    if (message?.audioMessage) return 'audio';
    if (message?.documentMessage) return 'document';
    if (message?.stickerMessage) return 'sticker';
    return 'text';
};

const getMessagePreview = (message = {}, fallbackPushName = null, isGroup = false, fromMe = false) => {
    const text = getMessageText(message);
    let preview = text;
    if (!preview) {
        const mediaType = getMediaType(message);
        preview =
            mediaType === 'image' ? '📷 Foto'
                : mediaType === 'audio' ? '🎵 Audio'
                    : mediaType === 'video' ? '🎥 Video'
                        : mediaType === 'document' ? '📄 Documento'
                            : mediaType === 'sticker' ? '🎭 Sticker'
                                : 'Mensaje';
    }
    if (isGroup && !fromMe) {
        return `${fallbackPushName || 'Alguien'}: ${preview}`;
    }
    return preview;
};

const toPublicMessage = (message) => ({
    id: message.id,
    text: message.text,
    sender: message.sender,
    timestamp: message.timestamp,
    mediaType: message.mediaType,
    status: message.status || 1,
    participant: message.participant || null,
    pushName: message.pushName || null,
    mediaPath: message.mediaPath || null,
    fileName: message.fileName || null
});

const mergeHistory = (jid, incomingMessages = []) => {
    const existing = historyCache.get(jid) || [];
    const merged = new Map();
    [...existing, ...incomingMessages].forEach((message) => {
        const key = message.id || `${message.timestamp || 0}-${message.text || ''}`;
        merged.set(key, message);
    });
    const ordered = Array.from(merged.values()).sort((a, b) => normalizeTimestamp(a.timestamp) - normalizeTimestamp(b.timestamp));
    historyCache.set(jid, ordered);
    return ordered;
};

const resolveContactName = (entry = {}, jid, publicPhone = null) => {
    return (
        entry.name ||
        entry.verifiedName ||
        entry.pushName ||
        entry.notify ||
        (publicPhone ? `+${publicPhone}` : null) ||
        (isGroupJid(jid) ? 'Grupo de WhatsApp' : null) ||
        'Contacto de WhatsApp'
    );
};

const migrateCanonicalState = (fromJid, toJid) => {
    if (!fromJid || !toJid || fromJid === toJid) {
        return;
    }

    if (historyCache.has(fromJid)) {
        mergeHistory(toJid, historyCache.get(fromJid) || []);
        historyCache.delete(fromJid);
    }

    if (contactCache.has(fromJid)) {
        const previous = contactCache.get(fromJid) || {};
        const current = contactCache.get(toJid) || {};
        contactCache.set(toJid, {
            ...previous,
            ...current,
            id: toJid,
            whatsapp_id: toJid,
            sourceJids: mergeSourceJids(previous.sourceJids, [fromJid, toJid, ...(current.sourceJids || [])])
        });
        contactCache.delete(fromJid);
    }

    if (groupParticipantsCache.has(fromJid) && !groupParticipantsCache.has(toJid)) {
        groupParticipantsCache.set(toJid, groupParticipantsCache.get(fromJid));
        groupParticipantsCache.delete(fromJid);
    }

    if (pendingHistoryRequests.has(fromJid) && !pendingHistoryRequests.has(toJid)) {
        pendingHistoryRequests.set(toJid, pendingHistoryRequests.get(fromJid));
    }
    pendingHistoryRequests.delete(fromJid);
};

async function upsertContactEntry(rawJid, partial = {}) {
    const canonicalJid = partial.whatsapp_id || partial.id || await getCanonicalJid(rawJid);
    migrateCanonicalState(rawJid, canonicalJid);

    const previous = contactCache.get(canonicalJid) || {};
    const publicPhone = partial.number || previous.number || await resolvePublicPhone(rawJid);
    const mergedParticipants = uniqueValues([...(previous.participants || []), ...(partial.participants || [])]);
    const mergedSourceJids = mergeSourceJids(previous.sourceJids, [rawJid, canonicalJid, ...(partial.sourceJids || [])]);
    const isGroup = Boolean(
        partial.isGroup !== undefined
            ? partial.isGroup
            : (previous.isGroup !== undefined ? previous.isGroup : (isGroupJid(rawJid) || isGroupJid(canonicalJid)))
    );

    const entry = {
        ...previous,
        ...partial,
        id: canonicalJid,
        whatsapp_id: canonicalJid,
        number: publicPhone || previous.number || null,
        isGroup,
        participants: mergedParticipants,
        sourceJids: mergedSourceJids,
        timestamp: normalizeTimestamp(partial.timestamp ?? previous.timestamp),
        unreadCount: partial.unreadCount ?? previous.unreadCount ?? 0,
    };

    entry.name = resolveContactName({
        name: partial.name || previous.name,
        pushName: partial.pushName || previous.pushName,
        verifiedName: partial.verifiedName || previous.verifiedName,
        notify: partial.notify || previous.notify
    }, canonicalJid, entry.number);

    contactCache.set(canonicalJid, entry);
    return entry;
}

const getHistoryMeta = (jid) => {
    const history = historyCache.get(jid) || [];
    const oldestMessage = history[0];
    return {
        hasMore: Boolean(oldestMessage?._key && oldestMessage?._messageTimestamp),
        totalCount: history.length
    };
};

const sanitizeParticipants = (participants = []) => {
    if (!Array.isArray(participants)) return [];
    return participants
        .map((item) => {
            if (!item) return null;
            if (typeof item === 'string') return item;
            return item.id || item.jid || item.participant || null;
        })
        .filter(Boolean);
};

async function getGroupParticipants(jid, fallbackParticipants = []) {
    if (!jid?.endsWith('@g.us')) {
        return [];
    }
    if (groupParticipantsCache.has(jid)) {
        return groupParticipantsCache.get(jid);
    }
    const fallback = sanitizeParticipants(fallbackParticipants);
    try {
        const metadata = await sock.groupMetadata(jid);
        const participants = await Promise.all(
            sanitizeParticipants(metadata?.participants || fallback).map((participant) => resolvePublicParticipantJid(participant))
        );
        groupParticipantsCache.set(jid, participants);
        return participants;
    } catch (e) {
        const normalizedFallback = await Promise.all(fallback.map((participant) => resolvePublicParticipantJid(participant)));
        groupParticipantsCache.set(jid, normalizedFallback);
        return normalizedFallback;
    }
}

function normalizeIncomingMessage(msg) {
    const content = msg?.message || {};
    return {
        id: msg?.key?.id,
        text: getMessageText(content),
        sender: msg?.key?.fromMe ? 'bot' : 'user',
        timestamp: normalizeTimestamp(msg?.messageTimestamp),
        mediaType: getMediaType(content),
        status: msg?.status || 1,
        participant: msg?.key?.participant || null,
        pushName: msg?.pushName || null,
        mediaPath: null,
        fileName: content?.documentMessage?.fileName || null,
        _key: msg?.key,
        _messageTimestamp: normalizeTimestamp(msg?.messageTimestamp)
    };
}

async function emitContactBatch(entries = []) {
    if (!entries.length) {
        return;
    }
    socket.emit('whatsapp_contacts', { contacts: entries, is_batch: true });
}

async function emitChatHistory(jid, limit = null, options = {}) {
    const history = historyCache.get(jid) || [];
    const publicHistory = history.slice(limit ? -limit : undefined).map(toPublicMessage);
    socket.emit('whatsapp_chat_history', {
        contact_id: jid,
        whatsapp_id: jid,
        history: publicHistory,
        prepend: Boolean(options.prepend),
        ...getHistoryMeta(jid)
    });
}

async function syncProfilePhotos(jids = []) {
    const uniqueJids = [...new Set(jids)].slice(0, PHOTO_SYNC_LIMIT);
    for (const jid of uniqueJids) {
        try {
            const targetJid = contactCache.get(jid)?.sourceJids?.[0] || jid;
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
            if (ppUrl) {
                const existing = contactCache.get(jid) || {};
                contactCache.set(jid, { ...existing, photo_url: ppUrl });
                socket.emit('contact_photo', { whatsapp_id: jid, photo_url: ppUrl });
            }
        } catch (e) {
            // Sin foto o no disponible.
        }
        await new Promise(resolve => setTimeout(resolve, 150));
    }
}

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

    loadPersistedLidMappings();

    const authPath = AUTH_PATH;
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
        syncFullHistory: true,
        connectTimeoutMs: 120000,
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: 60000,
        maxRetries: 5,
        retryRequestDelayMs: 10000,
        shouldSyncHistoryMessage: () => true,
        shouldIgnoreJid: (jid) => {
            if (!jid || typeof jid !== 'string') return true;
            return jid.endsWith('@newsletter');
        }
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
            const phone = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0];
            console.log(`>>> ✅ BAILEYS CONECTADO: ${phone}`);
            socket.emit('whatsapp_status', {
                status: 'conectado',
                phone: phone
            });
            setTimeout(() => socket.emit('whatsapp_ready_for_sync'), 2000);
        }
    });

    sock.ev.on('messaging-history.set', async ({ chats, contacts, messages }) => {
        console.log(`>>> [BAILEYS] RECIBIDO HISTORIAL: ${chats.length} CHATS.`);
        socket.emit('sync_progress', { progress: 10, message: 'Vinculando chats...' });

        const contactLookup = new Map();
        const messagesByJid = new Map();

        for (const entry of contacts || []) {
            if (!entry?.id) {
                continue;
            }
            const canonicalJid = await getCanonicalJid(entry.id);
            migrateCanonicalState(entry.id, canonicalJid);
            const existing = contactLookup.get(canonicalJid) || {};
            contactLookup.set(canonicalJid, {
                ...existing,
                ...entry,
                id: canonicalJid,
                sourceJids: mergeSourceJids(existing.sourceJids, [entry.id])
            });
            await upsertContactEntry(entry.id, {
                name: entry.name,
                pushName: entry.pushName,
                verifiedName: entry.verifiedName,
                notify: entry.notify,
                sourceJids: [entry.id]
            });
        }

        for (const message of messages || []) {
            const rawJid = message?.key?.remoteJid;
            if (!rawJid || rawJid.endsWith('@newsletter') || rawJid.endsWith('@broadcast') || rawJid === 'status@broadcast') {
                continue;
            }
            const canonicalJid = await getCanonicalJid(rawJid);
            migrateCanonicalState(rawJid, canonicalJid);
            if (!messagesByJid.has(canonicalJid)) {
                messagesByJid.set(canonicalJid, []);
            }
            messagesByJid.get(canonicalJid).push(message);
        }

        const activeChats = [];
        for (const chat of chats) {
            if (!chat?.id) continue;
            if (chat.id.endsWith('@newsletter')) continue;
            if (chat.id.endsWith('@broadcast')) continue;
            if (chat.id === 'status@broadcast') continue;
            const canonicalJid = await getCanonicalJid(chat.id);
            if (chat.lastMsgTimestamp || chat.conversationTimestamp || messagesByJid.has(canonicalJid) || chat.readOnly === false) {
                activeChats.push(chat);
            }
        }

        console.log(`>>> [FILTRO] Recibidos: ${chats.length} | Con conversación real: ${activeChats.length}`);

        const chatSnapshots = new Map();
        for (const chat of activeChats) {
            const canonicalJid = await getCanonicalJid(chat.id);
            migrateCanonicalState(chat.id, canonicalJid);
            const previous = chatSnapshots.get(canonicalJid) || {
                id: canonicalJid,
                sourceJids: [],
                participants: [],
                unreadCount: 0,
                conversationTimestamp: 0,
                lastMsgTimestamp: 0,
                name: ''
            };
            chatSnapshots.set(canonicalJid, {
                ...previous,
                name: chat.name || previous.name,
                sourceJids: mergeSourceJids(previous.sourceJids, [chat.id]),
                participants: uniqueValues([...(previous.participants || []), ...sanitizeParticipants(chat.participants || [])]),
                unreadCount: Math.max(previous.unreadCount || 0, chat.unreadCount || 0),
                conversationTimestamp: Math.max(
                    normalizeTimestamp(previous.conversationTimestamp),
                    normalizeTimestamp(chat.conversationTimestamp)
                ),
                lastMsgTimestamp: Math.max(
                    normalizeTimestamp(previous.lastMsgTimestamp),
                    normalizeTimestamp(chat.lastMsgTimestamp)
                )
            });
        }

        const chatList = Array.from(chatSnapshots.values());
        const total = chatList.length;
        const BATCH_SIZE = 40;

        for (let i = 0; i < chatList.length; i += BATCH_SIZE) {
            const chunk = chatList.slice(i, i + BATCH_SIZE);
            const contactsBatch = [];

            for (let localIndex = 0; localIndex < chunk.length; localIndex++) {
                const chat = chunk[localIndex];
                const globalIndex = i + localIndex;
                const jid = chat.id;
                const isGroup = isGroupJid(jid);
                const rawMessages = messagesByJid.get(jid) || [];
                const normalizedBatch = [];

                for (const message of rawMessages.slice(-INITIAL_HISTORY_LIMIT)) {
                    const normalized = normalizeIncomingMessage(message);
                    if (normalized.mediaType !== 'text') {
                        normalized.mediaPath = await downloadMedia(message);
                    }
                    normalizedBatch.push(normalized);
                }

                const publicPhone = contactCache.get(jid)?.number || await resolvePublicPhone(jid);
                for (const item of normalizedBatch) {
                    item.participant = await resolvePublicParticipantJid(item.participant);
                }
                const mergedHistory = mergeHistory(jid, normalizedBatch);
                const lastMsg = mergedHistory[mergedHistory.length - 1];
                const contactEntry = contactLookup.get(jid) || {};
                const name = resolveContactName({
                    name: chat.name || contactEntry.name || contactCache.get(jid)?.name,
                    pushName: contactEntry.pushName,
                    verifiedName: contactEntry.verifiedName,
                    notify: contactEntry.notify
                }, jid, publicPhone);
                const participants = isGroup
                    ? await getGroupParticipants(chat.sourceJids?.[0] || jid, chat.participants || contactCache.get(jid)?.participants || [])
                    : [];
                const timestamp = normalizeTimestamp(
                    lastMsg?.timestamp ||
                    chat.conversationTimestamp ||
                    chat.lastMsgTimestamp
                );
                const lastMessage = lastMsg
                    ? getMessagePreview(
                        { ...lastMsg, conversation: lastMsg.text },
                        lastMsg.pushName,
                        isGroup,
                        lastMsg.sender === 'bot'
                    )
                    : '';

                const contactPayload = {
                    id: jid,
                    whatsapp_id: jid,
                    name,
                    pushName: contactEntry.pushName || lastMsg?.pushName || '',
                    verifiedName: contactEntry.verifiedName || '',
                    notify: contactEntry.notify || '',
                    number: publicPhone,
                    isGroup,
                    unreadCount: chat.unreadCount || 0,
                    lastMessage,
                    timestamp,
                    mediaType: lastMsg?.mediaType || null,
                    participants,
                    sourceJids: chat.sourceJids || [jid],
                    photo_url: contactCache.get(jid)?.photo_url || null,
                    batch_index: globalIndex,
                    total_chats: total
                };

                const updatedContact = await upsertContactEntry(jid, contactPayload);
                contactsBatch.push(updatedContact);

                if (mergedHistory.length > 0) {
                    const pendingRequest = pendingHistoryRequests.get(jid);
                    await emitChatHistory(
                        jid,
                        pendingRequest?.mode === 'older' ? null : INITIAL_HISTORY_LIMIT,
                        { prepend: pendingRequest?.mode === 'older' }
                    );
                    pendingHistoryRequests.delete(jid);
                }
            }

            await emitContactBatch(contactsBatch);
        }

        socket.emit('sync_progress', { progress: 100, message: 'Finalizado' });

        setTimeout(async () => {
            console.log('>>> [BAILEYS] 📸 Obteniendo fotos de perfil...');
            await syncProfilePhotos(chatList.map((chat) => chat.id));
            console.log('>>> [BAILEYS] ✅ Fotos de perfil sincronizadas.');
        }, 5000);
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.fromMe || (msg.key.fromMe && msg.message)) {
                    const rawJid = msg.key.remoteJid;
                    const jid = await getCanonicalJid(rawJid);
                    migrateCanonicalState(rawJid, jid);
                    const msgContent = msg.message;
                    let text = getMessageText(msgContent);
                    let mediaType = getMediaType(msgContent);

                    let mediaPath = null;
                    if (mediaType !== 'text') {
                        mediaPath = await downloadMedia(msg);
                    }

                    const normalized = {
                        id: msg.key.id,
                        text,
                        sender: msg.key.fromMe ? 'bot' : 'user',
                        timestamp: normalizeTimestamp(msg.messageTimestamp),
                        mediaType,
                        status: msg.status || 1,
                        participant: await resolvePublicParticipantJid(msg.key.participant || null),
                        pushName: msg.pushName || null,
                        mediaPath,
                        fileName: msgContent?.documentMessage?.fileName || null,
                        _key: msg.key,
                        _messageTimestamp: normalizeTimestamp(msg.messageTimestamp)
                    };
                    const merged = mergeHistory(jid, [normalized]);
                    const isGroup = jid.endsWith('@g.us');
                    const publicPhone = contactCache.get(jid)?.number || await resolvePublicPhone(rawJid);
                    const updatedContact = await upsertContactEntry(rawJid, {
                        name: contactCache.get(jid)?.name,
                        pushName: msg.pushName || contactCache.get(jid)?.pushName || '',
                        verifiedName: contactCache.get(jid)?.verifiedName || '',
                        notify: contactCache.get(jid)?.notify || '',
                        number: publicPhone || null,
                        isGroup,
                        lastMessage: getMessagePreview(msgContent, msg.pushName, isGroup, msg.key.fromMe),
                        timestamp: normalizeTimestamp(msg.messageTimestamp),
                        mediaType,
                        participants: contactCache.get(jid)?.participants || []
                    });
                    await emitContactBatch([updatedContact]);
                    if (pendingHistoryRequests.has(jid)) {
                        const pendingRequest = pendingHistoryRequests.get(jid);
                        await emitChatHistory(jid, null, { prepend: pendingRequest?.mode === 'older' });
                        pendingHistoryRequests.delete(jid);
                    }

                    socket.emit('whatsapp_message', {
                        id: msg.key.id, contact_id: jid, whatsapp_id: jid, text,
                        sender: msg.key.fromMe ? 'bot' : 'user', timestamp: msg.messageTimestamp,
                        fromMe: msg.key.fromMe, status: msg.status || 1,
                        participant: normalized.participant || null, pushName: msg.pushName || null,
                        mediaType, mediaPath, fileName: msgContent?.documentMessage?.fileName || null
                    });
                }
            }
        }
    });

    sock.ev.on('contacts.upsert', async (entries) => {
        const payloads = [];
        for (const entry of entries || []) {
            if (!entry?.id || entry.id.endsWith('@newsletter') || entry.id === 'status@broadcast') {
                continue;
            }
            const updated = await upsertContactEntry(entry.id, {
                name: entry.name,
                pushName: entry.pushName,
                verifiedName: entry.verifiedName,
                notify: entry.notify,
                number: await resolvePublicPhone(entry.id),
                isGroup: isGroupJid(entry.id),
                sourceJids: [entry.id]
            });
            payloads.push(updated);
        }
        await emitContactBatch(payloads);
    });

    sock.ev.on('contacts.update', async (entries) => {
        const payloads = [];
        for (const entry of entries || []) {
            if (!entry?.id || entry.id.endsWith('@newsletter') || entry.id === 'status@broadcast') {
                continue;
            }
            const updated = await upsertContactEntry(entry.id, {
                name: entry.name,
                pushName: entry.pushName,
                verifiedName: entry.verifiedName,
                notify: entry.notify,
                number: await resolvePublicPhone(entry.id),
                sourceJids: [entry.id]
            });
            payloads.push(updated);
        }
        await emitContactBatch(payloads);
    });

    sock.ev.on('chats.upsert', async (entries) => {
        const payloads = [];
        for (const entry of entries || []) {
            if (!entry?.id || entry.id.endsWith('@newsletter') || entry.id === 'status@broadcast') {
                continue;
            }
            const updated = await upsertContactEntry(entry.id, {
                name: entry.name,
                number: await resolvePublicPhone(entry.id),
                isGroup: isGroupJid(entry.id),
                unreadCount: entry.unreadCount || 0,
                timestamp: normalizeTimestamp(entry.conversationTimestamp || entry.lastMsgTimestamp),
                participants: isGroupJid(entry.id) ? await getGroupParticipants(entry.id, entry.participants || []) : [],
                sourceJids: [entry.id]
            });
            payloads.push(updated);
        }
        await emitContactBatch(payloads);
    });

    sock.ev.on('chats.update', async (entries) => {
        const payloads = [];
        for (const entry of entries || []) {
            if (!entry?.id || entry.id.endsWith('@newsletter') || entry.id === 'status@broadcast') {
                continue;
            }
            const updated = await upsertContactEntry(entry.id, {
                unreadCount: entry.unreadCount,
                timestamp: normalizeTimestamp(entry.conversationTimestamp || entry.lastMsgTimestamp),
                sourceJids: [entry.id]
            });
            payloads.push(updated);
        }
        await emitContactBatch(payloads);
    });

    sock.ev.on('groups.update', async (entries) => {
        const payloads = [];
        for (const entry of entries || []) {
            if (!entry?.id) {
                continue;
            }
            const updated = await upsertContactEntry(entry.id, {
                name: entry.subject || entry.desc || entry.name,
                isGroup: true,
                participants: await getGroupParticipants(entry.id),
                sourceJids: [entry.id]
            });
            payloads.push(updated);
        }
        await emitContactBatch(payloads);
    });

    sock.ev.on('group-participants.update', async (data) => {
        const jid = data?.id;
        if (!jid) {
            return;
        }
        const participants = await getGroupParticipants(jid, data.participants || []);
        const updated = await upsertContactEntry(jid, {
            isGroup: true,
            participants,
            sourceJids: [jid]
        });
        await emitContactBatch([updated]);
    });

    sock.ev.on('lid-mapping.update', async ({ lid, pn }) => {
        const lidUser = stripDeviceSuffix(extractUserFromJid(lid));
        const pnUser = stripDeviceSuffix(extractUserFromJid(pn));
        if (!lidUser || !pnUser) {
            return;
        }
        lidToPnCache.set(lidUser, pnUser);
        const lidJid = lid?.includes('@') ? lid : `${lidUser}@lid`;
        const canonicalJid = toCanonicalUserJid(pnUser);
        migrateCanonicalState(lidJid, canonicalJid);
        const updated = await upsertContactEntry(lidJid, {
            number: pnUser,
            sourceJids: [lidJid, canonicalJid]
        });
        await emitContactBatch([updated]);
    });

    sock.ev.on('message-receipt.update', (receipts) => {
        socket.emit('whatsapp_receipt', receipts);
    });

    socket.on('send_whatsapp_message', async (data) => {
        const { to, text, quotedMsg } = data;
        try {
            const msgContent = { text: text };
            // Soporte para responder/citar mensajes
            if (quotedMsg) {
                msgContent.quoted = quotedMsg;
            }
            await sock.sendMessage(to, msgContent);
        } catch (e) {
            console.error('>>> [BAILEYS] ERROR ENVIANDO MENSAJE:', e.message);
        }
    });

    // Enviar archivos multimedia (imagen, video, audio, documento)
    socket.on('send_whatsapp_media', async (data) => {
        const { to, mediaType, base64Data, fileName, caption, mimeType } = data;
        try {
            const buffer = Buffer.from(base64Data, 'base64');
            let msgContent = {};

            if (mediaType === 'image') {
                msgContent = { image: buffer, caption: caption || '' };
            } else if (mediaType === 'video') {
                msgContent = { video: buffer, caption: caption || '' };
            } else if (mediaType === 'audio') {
                // ptt:true lo muestra como nota de voz, ptt:false como archivo de audio
                const isPtt = mimeType?.includes('ogg') || mimeType?.includes('opus');
                msgContent = {
                    audio: buffer,
                    mimetype: mimeType || 'audio/ogg; codecs=opus',
                    ptt: isPtt
                };
            } else {
                msgContent = {
                    document: buffer,
                    fileName: fileName || 'archivo',
                    mimetype: mimeType || 'application/octet-stream',
                    caption: caption || ''
                };
            }

            const sent = await sock.sendMessage(to, msgContent);
            console.log(`>>> [BAILEYS] ✅ MEDIA ENVIADA a ${to}: ${mediaType} (${fileName})`);
            socket.emit('media_sent', { success: true, to, mediaType, messageId: sent?.key?.id });
        } catch (e) {
            console.error('>>> [BAILEYS] ERROR ENVIANDO MEDIA:', e.message);
            socket.emit('media_sent', { success: false, error: e.message });
        }
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

    // ============================================================
    // INDICADOR DE ESCRITURA Y PRESENCIA
    // ============================================================
    sock.ev.on('presence.update', ({ id, presences }) => {
        const jid = id;
        Object.values(presences).forEach(presence => {
            const state = presence.lastKnownPresence;
            const isTyping = state === 'composing' || state === 'recording';
            const isOnline = state === 'available';

            socket.emit('presence_update', {
                whatsapp_id: jid,
                status: state,
                lastSeen: presence.lastSeen || null,
                isOnline
            });

            socket.emit('user_typing', { whatsapp_id: jid, is_typing: isTyping });

            // Auto-limpiar typing después de 4 segundos si no llega otro update
            if (isTyping) {
                setTimeout(() => {
                    socket.emit('user_typing', { whatsapp_id: jid, is_typing: false });
                }, 4000);
            }
        });
    });

    // Suscribirse a la presencia de un contacto cuando se abre su chat
    socket.on('subscribe_presence', async (data) => {
        const { whatsapp_id } = data;
        try {
            await sock.presenceSubscribe(whatsapp_id);
            console.log(`>>> [BAILEYS] 👁 Suscrito a presencia: ${whatsapp_id}`);
        } catch (e) {
            // Silenciar errores de presencia (no todos los contactos los permiten)
        }
    });

    socket.on('request_contacts_sync', async () => {
        const contacts = Array.from(contactCache.values())
            .sort((a, b) => normalizeTimestamp(b.timestamp) - normalizeTimestamp(a.timestamp));

        if (contacts.length > 0) {
            socket.emit('whatsapp_contacts', {
                contacts: contacts.map((contact, index) => ({
                    ...contact,
                    batch_index: index,
                    total_chats: contacts.length
                })),
                is_batch: true
            });
            setTimeout(() => {
                syncProfilePhotos(contacts.map((contact) => contact.whatsapp_id || contact.id));
            }, 500);
        }
    });

    socket.on('request_chat_history', async (data) => {
        const jid = data?.whatsapp_id || data?.contact_id;
        if (!jid) {
            return;
        }

        const mode = data?.mode === 'older' ? 'older' : 'latest';
        const requestCount = Number(data?.count) > 0 ? Number(data.count) : LOAD_MORE_HISTORY_LIMIT;
        pendingHistoryRequests.set(jid, { mode, count: requestCount });

        if (historyCache.has(jid)) {
            await emitChatHistory(jid, null, { prepend: mode === 'older' });
        }

        const history = historyCache.get(jid) || [];
        const oldestMessage = history.find((message) => message?._key && message?._messageTimestamp);
        if (!oldestMessage) {
            await emitChatHistory(jid, null, { prepend: mode === 'older' });
            pendingHistoryRequests.delete(jid);
            return;
        }

        try {
            await sock.fetchMessageHistory(
                requestCount,
                oldestMessage._key,
                oldestMessage._messageTimestamp
            );
        } catch (e) {
            pendingHistoryRequests.delete(jid);
            console.error(`>>> [BAILEYS] ERROR PIDIENDO HISTORIAL PARA ${jid}:`, e.message || e);
        }
    });

    // Estado actual de WhatsApp (para el frontend al reconectarse)
    socket.on('request_whatsapp_status', async () => {
        const phone = sock?.user?.id?.split(':')[0] || sock?.user?.id?.split('@')[0];
        if (phone) {
            socket.emit('whatsapp_status', { status: 'conectado', phone });
        } else {
            socket.emit('whatsapp_status', { status: 'desconectado' });
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
