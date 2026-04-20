const DB_NAME = 'FunnelChatDB';
const DB_VERSION = 1;

let dbInstance = null;

const STORES = {
  CONTACTS: 'contacts',
  MESSAGES: 'messages',
  CHATS: 'chats',
  STORIES: 'stories',
  REACTIONS: 'reactions',
  MEDIA: 'media',
  SYNC_META: 'syncMeta'
};

export async function openDatabase() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
        const contactsStore = db.createObjectStore(STORES.CONTACTS, { keyPath: 'jid' });
        contactsStore.createIndex('phone', 'phone', { unique: false });
        contactsStore.createIndex('timestamp', 'timestamp', { unique: false });
        contactsStore.createIndex('isGroup', 'isGroup', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        messagesStore.createIndex('chatJid', 'chatJid', { unique: false });
        messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CHATS)) {
        const chatsStore = db.createObjectStore(STORES.CHATS, { keyPath: 'jid' });
        chatsStore.createIndex('lastMessageTimestamp', 'lastMessageTimestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.STORIES)) {
        const storiesStore = db.createObjectStore(STORES.STORIES, { keyPath: 'id' });
        storiesStore.createIndex('userJid', 'userJid', { unique: false });
        storiesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.REACTIONS)) {
        const reactionsStore = db.createObjectStore(STORES.REACTIONS, { keyPath: 'id' });
        reactionsStore.createIndex('messageId', 'messageId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MEDIA)) {
        const mediaStore = db.createObjectStore(STORES.MEDIA, { keyPath: 'id' });
        mediaStore.createIndex('messageId', 'messageId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
      }
    };
  });
}

export async function getAll(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function get(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function put(storeName, data) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putBulk(storeName, items) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    items.forEach(item => store.put(item));
    
    transaction.oncomplete = () => resolve(items.length);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function remove(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clear(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getByIndex(storeName, indexName, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getMessagesByChat(chatJid, limit = 50, direction = 'newer') {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MESSAGES, 'readonly');
    const store = transaction.objectStore(STORES.MESSAGES);
    const index = store.index('chatJid');
    const request = index.getAll(chatJid);
    request.onsuccess = () => {
      let messages = request.result || [];
      messages.sort((a, b) => a.timestamp - b.timestamp);
      resolve(messages);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getChatsOrdered() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CHATS, 'readonly');
    const store = transaction.objectStore(STORES.CHATS);
    const request = store.getAll();
    request.onsuccess = () => {
      const chats = request.result || [];
      chats.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
      resolve(chats);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSyncMeta(key) {
  return get(STORES.SYNC_META, key);
}

export async function setSyncMeta(key, value) {
  return put(STORES.SYNC_META, { key, value, timestamp: Date.now() });
}

export { STORES };