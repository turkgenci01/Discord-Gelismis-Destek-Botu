const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const config = require('../config.json');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-durum')
        .setDescription('Bot\'un detaylı sistem durumunu gösterir'),
    
    async execute(interaction) {
        const client = interaction.client;
        
        // Uptime hesaplama
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime) % 60;
        const uptimeString = `${days}g ${hours}s ${minutes}d ${seconds}sn`;

        // Memory kullanımı
        const memoryUsage = process.memoryUsage();
        const memoryUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memoryTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

        // Sistem bilgileri
        const systemMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const cpuUsage = os.loadavg()[0].toFixed(2);

        // Bot istatistikleri
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = client.channels.cache.size;

        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Sistem Durumu')
            .setDescription(`**${client.user.tag}** botunun detaylı sistem bilgileri`)
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setColor(config.colors.primary)
            .addFields(
                {
                    name: '📊 Bot İstatistikleri',
                    value: [
                        `**Sunucular:** ${totalGuilds}`,
                        `**Kullanıcılar:** ${totalUsers.toLocaleString('tr-TR')}`,
                        `**Kanallar:** ${totalChannels}`,
                        `**Ping:** ${client.ws.ping}ms`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⏱️ Çalışma Süresi',
                    value: [
                        `**Aktif Süre:** ${uptimeString}`,
                        `**Başlatılma:** <t:${Math.floor((Date.now() - uptime * 1000) / 1000)}:R>`,
                        `**Discord.js:** v${version}`,
                        `**Node.js:** ${process.version}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💾 Bellek Kullanımı',
                    value: [
                        `**Bot Bellek:** ${memoryUsed}MB / ${memoryTotal}MB`,
                        `**Sistem Bellek:** ${(systemMemory - freeMemory).toFixed(2)}GB / ${systemMemory}GB`,
                        `**CPU Yükü:** ${cpuUsage}%`,
                        `**Platform:** ${os.platform()} ${os.arch()}`
                    ].join('\n'),
                    inline: true
                }
            )
            .setFooter({ 
                text: `${client.user.username} • Sistem Durumu`,
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Durum aktivitesi bilgisi
        const currentActivity = client.user.presence?.activities[0];
        if (currentActivity) {
            embed.addFields({
                name: '🎮 Mevcut Aktivite',
                value: `**${currentActivity.name}** (${currentActivity.type})`,
                inline: true
            });
        }

        // Ses kanalı durumu
        const statusManager = client.statusManager;
        const voiceStatus = statusManager?.voiceConnection ? '🔊 Bağlı' : '🔇 Bağlı Değil';
        embed.addFields({
            name: '🎵 Ses Durumu',
            value: voiceStatus,
            inline: true
        });

        await interaction.reply({ embeds: [embed] });
    }
};