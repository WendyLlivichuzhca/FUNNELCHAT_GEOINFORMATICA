import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';

const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'phone', weight: 0.3 },
    { name: 'pushName', weight: 0.2 },
    { name: 'lastMessage', weight: 0.1 }
  ],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2
};

export function useSearch(contacts, messages) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ contacts: [], messages: [] });

  const contactFuse = useMemo(() => {
    if (!contacts || contacts.length === 0) return null;
    return new Fuse(contacts, fuseOptions);
  }, [contacts]);

  const messageFuse = useMemo(() => {
    if (!messages || messages.length === 0) return null;
    return new Fuse(messages, {
      keys: [
        { name: 'text', weight: 0.8 },
        { name: 'fileName', weight: 0.2 }
      ],
      threshold: 0.5,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2
    });
  }, [messages]);

  const search = useCallback((searchQuery) => {
    setQuery(searchQuery);
    
    if (!searchQuery || searchQuery.length < 2) {
      setResults({ contacts: [], messages: [] });
      return;
    }

    const q = searchQuery.toLowerCase();
    const contactResults = contactFuse ? contactFuse.search(q).slice(0, 20) : [];
    const messageResults = messageFuse ? messageFuse.search(q).slice(0, 30) : [];

    setResults({
      contacts: contactResults.map(r => r.item),
      messages: messageResults.map(r => r.item)
    });
  }, [contactFuse, messageFuse]);

  useEffect(() => {
    if (query.length >= 2) {
      search(query);
    } else {
      setResults({ contacts: [], messages: [] });
    }
  }, [query, search]);

  return {
    query,
    setQuery: search,
    results,
    isSearching: query.length >= 2
  };
}

export function useMessageSearch(allMessages) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const messageFuse = useMemo(() => {
    if (!allMessages || allMessages.length === 0) return null;
    return new Fuse(allMessages, {
      keys: [
        { name: 'text', weight: 0.9 },
        { name: 'pushName', weight: 0.1 }
      ],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2
    });
  }, [allMessages]);

  const searchMessages = useCallback((searchQuery) => {
    setQuery(searchQuery);
    
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchResults = messageFuse ? messageFuse.search(searchQuery).slice(0, 50) : [];
    setResults(searchResults.map(r => r.item));
  }, [messageFuse]);

  useEffect(() => {
    if (query.length >= 2) {
      searchMessages(query);
    } else {
      setResults([]);
    }
  }, [query, searchMessages]);

  return {
    query,
    setQuery: searchMessages,
    results,
    isSearching: query.length >= 2
  };
}