const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({
        dataId: 'funnel-chat-session'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', async () => {
    console.log('Client is ready!');
    const contacts = await client.getContacts();

    // Buscar algunos que no tengan nombre y no sean grupo
    const noNames = contacts.filter(c => !c.isGroup && !c.name);

    console.log(`Total contacts: ${contacts.length}`);
    console.log(`Contacts without 'name' property: ${noNames.length}`);

    if (noNames.length > 0) {
        // Imprimir los 3 primeros contactos sin nombre para analizarlos
        console.log('Sample of contacts without name:');
        console.log(JSON.stringify(noNames.slice(0, 3), null, 2));
    }

    // También buscar chats
    const chats = await client.getChats();
    console.log(`Total chats: ${chats.length}`);

    if (chats.length > 0) {
        const chat1 = chats[0];
        console.log(`Sample chat 1 name: ${chat1.name}`);
        const chatContact = await chat1.getContact();
        console.log(`Sample chat 1 contact obj:`);
        console.log(JSON.stringify(chatContact, null, 2));
    }

    process.exit(0);
});

client.on('auth_failure', () => {
    console.error('Auth failure');
    process.exit(1);
});

client.initialize();
