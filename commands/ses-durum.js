const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ses-durum')
        .setDescription('Bot\'un ses kanalı bağlantı durumunu gösterir')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        const client = interaction.client;
        const statusManager = client.statusManager;

        if (!statusManager) {
            return interaction.reply({
                content: '❌ Status Manager bulunamadı!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🔊 Ses Kanalı Durumu')
            .setColor(config.colors.primary)
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp();

        // Ses bağlantısı durumu
        if (statusManager.voiceConnection) {
            const connection = statusManager.voiceConnection;
            const state = connection.state;
            
            // Bağlı olduğu kanalı bul
            let channelInfo = 'Bilinmiyor';
            if (config.voiceChannelId && config.voiceChannelId !== "BURAYA_SES_KANALI_ID_GIRIN") {
                for (const guild of client.guilds.cache.values()) {
                    const channel = guild.channels.cache.get(config.voiceChannelId);
                    if (channel && channel.isVoiceBased()) {
                        channelInfo = `<#${channel.id}> (${guild.name})`;
                        break;
                    }
                }
            }

            embed.setDescription('✅ Bot ses kanalına bağlı')
                .addFields(
                    { name: '📍 Kanal', value: channelInfo, inline: true },
                    { name: '🔗 Bağlantı Durumu', value: state.status, inline: true },
                    { name: '⏱️ Ping', value: `${connection.ping.ws || 'N/A'}ms`, inline: true },
                    { name: '🎵 Audio Player', value: statusManager.audioPlayer ? '✅ Aktif' : '❌ Pasif', inline: true },
                    { name: '🔄 Otomatik Yeniden Bağlanma', value: '✅ Etkin', inline: true }
                )
                .setColor(config.colors.success);
        } else {
            embed.setDescription('❌ Bot ses kanalına bağlı değil')
                .addFields(
                    { name: '⚠️ Durum', value: 'Bağlantı yok', inline: true },
                    { name: '🔧 Çözüm', value: 'Config dosyasında ses kanalı ID\'sini kontrol edin', inline: true }
                )
                .setColor(config.colors.error);
        }

        // Config durumu
        const configStatus = config.voiceChannelId && config.voiceChannelId !== "BURAYA_SES_KANALI_ID_GIRIN" 
            ? '✅ Ayarlanmış' 
            : '❌ Ayarlanmamış';

        embed.addFields(
            { name: '⚙️ Config Durumu', value: configStatus, inline: true }
        );

        await interaction.reply({ embeds: [embed] });
    }
};