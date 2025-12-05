const { Events } = require('discord.js');
const StatusManager = require('../utils/statusManager');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ Bot ${client.user.tag} olarak giriş yaptı!`);
        console.log(`📊 ${client.guilds.cache.size} sunucuda aktif`);
        
        // Status Manager'ı başlat
        const statusManager = new StatusManager(client);
        statusManager.startStatusRotation();
        
        // Ses kanalına bağlan
        setTimeout(() => {
            statusManager.connectToVoiceChannel();
            statusManager.checkVoiceConnection();
        }, 3000);
        
        // Global olarak erişim için client'a ekle
        client.statusManager = statusManager;
    }
};