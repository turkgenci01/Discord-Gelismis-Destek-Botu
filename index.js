const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const config = require('./config.json');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Load handlers
commandHandler(client);
eventHandler(client);

// Komutları Discord'a kaydet
async function deployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST().setToken(config.token);

    try {
        console.log('🔄 Slash komutları yükleniyor...');
        
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log('✅ Slash komutları başarıyla yüklendi!');
    } catch (error) {
        console.error('❌ Komut yükleme hatası:', error);
    }
}

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

client.login(config.token).then(() => {
    deployCommands();
});