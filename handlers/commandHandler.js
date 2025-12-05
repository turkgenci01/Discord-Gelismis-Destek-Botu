const { readdirSync } = require('fs');
const { join } = require('path');

module.exports = (client) => {
    const commandsPath = join(__dirname, '..', 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Komut yüklendi: ${command.data.name}`);
        } else {
            console.log(`⚠️ Komut eksik özellik: ${filePath}`);
        }
    }
};