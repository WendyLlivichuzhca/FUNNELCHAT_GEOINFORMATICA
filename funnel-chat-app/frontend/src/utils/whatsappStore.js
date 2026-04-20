import * as db from './db';

let socket = null;
let isInitialized = false;
const listeners = new Map();
const pendingOperations = [];
const syncState = {
  isSyncing: false,
  lastSyncTimestamp: 0,
  syncProgress: 0,
  syncMessage: '',
  contactsLoaded: false,
  chatsLoaded: false,
  historyLoaded: false
};

function getSocket() {
  if (!socket) {
    const io = require('socket.io-client');
    const { SOCKET_URL } = require('../config/api');
    socket = io(SOCKET_URL, { transports: ['websocket'] });
    setupSocketListeners(socket);
  }
  return socket;
}

function setupSocketListeners(s) {
  s.on('connect', () => {
    console.log('[WhatsAppStore] Conectado al servidor');
    processPendingOperations();
  });

  s.on('whatsapp_contacts', handleContactsBatch);
  s.on('whatsapp_chat_history', handleChatHistory);
  s.on('whatsapp_message', handleNewMessage);
  s.on('contact_photo', handleContactPhoto);
  s.on('sync_progress', handleSyncProgress);
  s.on('whatsapp_status', handleStatusUpdate);
  s.on('message-receipt.update', handleReceiptUpdate);
  s.on('presence_update', handlePresenceUpdate);
}

async function handleContactsBatch(data) {
  const { contacts, is_batch } = data;
  if (!contacts || !contacts.length) return;

  try {
    const contactsToStore = contacts.map(c => ({
      jid: c.whatsapp_id || c.id,
      phone: c.phone || c.number || '',
      name: c.name || '',
      pushName: c.pushName || '',
      verifiedName: c.verifiedName || '',
      notify: c.notify || '',
      photoUrl: c.photo_url || '',
      isGroup: c.is_group || c.isGroup || false,
      lastMessage: c.last_message || '',
      timestamp: c.timestamp || 0,
      unreadCount: c.unreadCount || c.unread_count || 0,
      isGroup,
      participants: c.participants || [],
      notes: c.notes || '',
      status: c.status || 'nuevo'
    }));

    await db.putBulk(db.STORES.CONTACTS, contactsToStore);

    const chatsToStore = contactsToStore.map(c => ({
      jid: c.jid,
      lastMessage: c.lastMessage,
      lastMessageTimestamp: c.timestamp,
      unreadCount: c.unreadCount,
      photoUrl: c.photoUrl,
      isGroup: c.isGroup
    }));
    await db.putBulk(db.STORES.CHATS, chatsToStore);

    notifyListeners('contacts', contactsToStore);
    
    if (is_batch) {
      syncState.syncProgress = 100;
      syncState.contactsLoaded = true;
      checkSyncComplete();
    }
  } catch (e) {
    console.error('[WhatsAppStore] Error guardando contactos:', e);
  }
}

async function handleChatHistory(data) {
  const { contact_id, history, prepend, hasMore, totalCount } = data;
  if (!contact_id || !history) return;

  try {
    const messagesToStore = history.map(m => ({
      id: m.id || `${m.timestamp}-${Math.random()}`,
      chatJid: contact_id,
      text: m.text || '',
      sender: m.sender || 'user',
      timestamp: m.timestamp || 0,
      mediaType: m.mediaType || null,
      mediaPath: m.mediaPath || null,
      fileName: m.fileName || null,
      participant: m.participant || null,
      pushName: m.pushName || null,
      status: m.status || 1,
      reactions: m.reactions || null,
      quotedMsg: m.quotedMsg || null,
      isDeleted: m.isDeleted || false,
      editTimestamp: m.editTimestamp || null
    }));

    if (prepend) {
      const existingMessages = await db.getMessagesByChat(contact_id);
      const existingIds = new Set(existingMessages.map(m => m.id));
      const newMessages = messagesToStore.filter(m => !existingIds.has(m.id));
      if (newMessages.length > 0) {
        await db.putBulk(db.STORES.MESSAGES, newMessages);
      }
    } else {
      await db.putBulk(db.STORES.MESSAGES, messagesToStore);
    }

    await db.setSyncMeta(`chat_${contact_id}_hasMore`, hasMore);
    await db.setSyncMeta(`chat_${contact_id}_count`, totalCount);

    notifyListeners('history', { contactId: contact_id, messages: messagesToStore, hasMore, totalCount, prepend });
  } catch (e) {
    console.error('[WhatsAppStore] Error guardando historial:', e);
  }
}

async function handleNewMessage(data) {
  const { contact_id, message } = data;
  if (!message) return;

  try {
    const msg = {
      id: message.id || `${message.timestamp}-${Math.random()}`,
      chatJid: contact_id,
      text: message.text || '',
      sender: message.sender || (message.fromMe ? 'bot' : 'user'),
      timestamp: message.timestamp || Math.floor(Date.now() / 1000),
      mediaType: message.mediaType || null,
      mediaPath: message.mediaPath || null,
      fileName: message.fileName || null,
      participant: message.participant || null,
      pushName: message.pushName || null,
      status: message.status || 1,
      reactions: message.reactions || null,
      quotedMsg: message.quotedMsg || null,
      isDeleted: message.isDeleted || false,
      editTimestamp: message.editTimestamp || null
    };

    await db.put(db.STORES.MESSAGES, msg);

    const contact = await db.get(db.STORES.CONTACTS, contact_id);
    if (contact) {
      contact.lastMessage = msg.text || getMediaPreview(msg.mediaType);
      contact.timestamp = msg.timestamp;
      contact.unreadCount = (contact.unreadCount || 0) + 1;
      await db.put(db.STORES.CONTACTS, contact);

      const chat = await db.get(db.STORES.CHATS, contact_id);
      if (chat) {
        chat.lastMessage = contact.lastMessage;
        chat.lastMessageTimestamp = msg.timestamp;
        chat.unreadCount = contact.unreadCount;
        await db.put(db.STORES.CHATS, chat);
      }
    }

    notifyListeners('newMessage', { contactId: contact_id, message: msg });
  } catch (e) {
    console.error('[WhatsAppStore] Error guardando mensaje:', e);
  }
}

async function handleContactPhoto(data) {
  const { whatsapp_id, photo_url } = data;
  if (!whatsapp_id || !photo_url) return;

  try {
    const contact = await db.get(db.STORES.CONTACTS, whatsapp_id);
    if (contact) {
      contact.photoUrl = photo_url;
      await db.put(db.STORES.CONTACTS, contact);

      const chat = await db.get(db.STORES.CHATS, whatsapp_id);
      if (chat) {
        chat.photoUrl = photo_url;
        await db.put(db.STORES.CHATS, chat);
      }

      notifyListeners('photoUpdate', { whatsapp_id, photo_url });
    }
  } catch (e) {
    console.error('[WhatsAppStore] Error guardando foto:', e);
  }
}

function handleSyncProgress(data) {
  syncState.isSyncing = true;
  syncState.syncProgress = data.progress;
  syncState.syncMessage = data.message;
  notifyListeners('syncProgress', syncState);

  if (data.progress >= 100) {
    setTimeout(() => {
      syncState.isSyncing = false;
      syncState.syncProgress = 100;
      notifyListeners('syncProgress', syncState);
    }, 2000);
  }
}

function handleStatusUpdate(data) {
  notifyListeners('statusUpdate', data);
}

async function handleReceiptUpdate(receipts) {
  if (!receipts || !receipts.length) return;

  for (const receipt of receipts) {
    const { key, update } = receipt;
    if (!key || !update) continue;

    try {
      const msg = await db.get(db.STORES.MESSAGES, key.id);
      if (msg) {
        msg.status = update.status || msg.status;
        await db.put(db.STORES.MESSAGES, msg);
        notifyListeners('receiptUpdate', { messageId: key.id, status: msg.status });
      }
    } catch (e) {
      console.error('[WhatsAppStore] Error actualizando receipt:', e);
    }
  }
}

function handlePresenceUpdate(data) {
  notifyListeners('presenceUpdate', data);
}

function getMediaPreview(mediaType) {
  const previews = {
    image: '📷 Foto',
    video: '🎥 Video',
    audio: '🎵 Audio',
    document: '📄 Documento',
    sticker: '🎭 Sticker',
    location: '📍 Ubicación',
    contact: '👤 Contacto'
  };
  return previews[mediaType] || '💬 Mensaje';
}

async function checkSyncComplete() {
  if (syncState.contactsLoaded && syncState.chatsLoaded) {
    syncState.isSyncing = false;
    syncState.lastSyncTimestamp = Date.now();
    notifyListeners('syncComplete', syncState);
  }
}

function notifyListeners(event, data) {
  const callbacks = listeners.get(event) || [];
  callbacks.forEach(cb => cb(data));

  const allCallbacks = listeners.get('*') || [];
  allCallbacks.forEach(cb => cb(event, data));
}

export function subscribe(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);

  return () => {
    listeners.get(event).delete(callback);
  };
}

export async function initialize() {
  if (isInitialized) return;
  isInitialized = true;

  const s = getSocket();
  
  await db.openDatabase();
  
  console.log('[WhatsAppStore] Base de datos local inicializada');
}

export async function loadContacts() {
  try {
    const contacts = await db.getAll(db.STORES.CONTACTS);
    if (contacts && contacts.length > 0) {
      notifyListeners('contacts', contacts);
      return contacts;
    }
  } catch (e) {
    console.error('[WhatsAppStore] Error cargando contactos:', e);
  }
  return [];
}

export async function loadChats() {
  try {
    const chats = await db.getChatsOrdered();
    if (chats && chats.length > 0) {
      notifyListeners('chats', chats);
      return chats;
    }
  } catch (e) {
    console.error('[WhatsAppStore] Error cargando chats:', e);
  }
  return [];
}

export async function loadChatHistory(contactId, limit = 50) {
  try {
    const messages = await db.getMessagesByChat(contactId, limit);
    const hasMoreMeta = await db.getSyncMeta(`chat_${contactId}_hasMore`);
    const countMeta = await db.getSyncMeta(`chat_${contactId}_count`);

    return {
      messages: messages.slice(-limit),
      hasMore: hasMoreMeta?.value || false,
      totalCount: countMeta?.value || messages.length
    };
  } catch (e) {
    console.error('[WhatsAppStore] Error cargando historial:', e);
    return { messages: [], hasMore: false, totalCount: 0 };
  }
}

export async function requestSync() {
  const s = getSocket();
  if (s.connected) {
    s.emit('request_contacts_sync');
    syncState.isSyncing = true;
    syncState.syncProgress = 0;
    syncState.syncMessage = 'Solicitando sincronización...';
    notifyListeners('syncProgress', syncState);
  } else {
    pendingOperations.push({ type: 'sync' });
  }
}

export async function requestMoreHistory(contactId, mode = 'older', count = 60) {
  const s = getSocket();
  if (s.connected) {
    s.emit('request_chat_history', {
      contact_id: contactId,
      whatsapp_id: contactId,
      mode,
      count
    });
  }
}

export async function sendMessage(to, text, quotedMsg = null) {
  const s = getSocket();
  const payload = { to, text, quotedMsg };
  
  s.emit('send_whatsapp_message', payload);

  const tempId = `temp-${Date.now()}`;
  const tempMsg = {
    id: tempId,
    chatJid: to,
    text,
    sender: 'bot',
    timestamp: Math.floor(Date.now() / 1000),
    status: 1,
    quotedMsg: quotedMsg ? {
      id: quotedMsg.key?.id,
      text: quotedMsg.message?.conversation || quotedMsg.message?.extendedTextMessage?.text
    } : null
  };

  await db.put(db.STORES.MESSAGES, tempMsg);
  notifyListeners('messageSent', { message: tempMsg });

  return tempId;
}

export async function sendMedia(to, mediaType, file, caption = '') {
  const s = getSocket();
  
  const formData = new FormData();
  formData.append('to', to);
  formData.append('media_type', mediaType);
  formData.append('caption', caption);
  formData.append('file', file);

  notifyListeners('mediaSending', { to, mediaType });

  // Convertir a base64 primero
  const base64Data = await fileToBase64(file);

  return new Promise((resolve, reject) => {
    s.emit('send_whatsapp_media', {
      to,
      mediaType,
      base64Data,
      fileName: file.name,
      caption,
      mimeType: file.type
    });

    s.once('media_sent', (response) => {
      if (response.success) {
        resolve(response.messageId);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function markAsRead(whatsappId, messageId) {
  const s = getSocket();
  s.emit('mark_as_read', { whatsapp_id: whatsappId, message_id: messageId });
}

export async function subscribePresence(whatsappId) {
  const s = getSocket();
  s.emit('subscribe_presence', { whatsapp_id: whatsappId });
}

export async function logout() {
  const s = getSocket();
  s.emit('whatsapp_logout');
  await db.clear(db.STORES.CONTACTS);
  await db.clear(db.STORES.MESSAGES);
  await db.clear(db.STORES.CHATS);
  isInitialized = false;
}

export function getSyncState() {
  return { ...syncState };
}

export async function processPendingOperations() {
  while (pendingOperations.length > 0) {
    const op = pendingOperations.shift();
    if (op.type === 'sync') {
      await requestSync();
    }
  }
}

export { syncState };