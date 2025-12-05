const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Database = require('../utils/database');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-durum')
        .setDescription('Destek sistemi durumunu ve istatistikleri gösterir'),
    
    async execute(interaction) {
        const guild = interaction.guild;
        const guildData = Database.getGuild(guild.id);
        const activeTickets = Database.getActiveTickets(guild.id);
        const ticketCount = Object.keys(activeTickets).length;

        // Ana durum embed'i
        const mainEmbed = new EmbedBuilder()
            .setTitle('📊 Destek Sistemi Durumu')
            .setColor(config.colors.primary)
            .setThumbnail(guild.iconURL())
            .setTimestamp();

        if (!guildData || !guildData.supportRole) {
            mainEmbed
                .setDescription('❌ Destek sistemi henüz kurulmamış!')
                .addFields({
                    name: '🔧 Kurulum',
                    value: 'Destek sistemini kurmak için `/setup-destek` komutunu kullanın.',
                    inline: false
                })
                .setColor(config.colors.error);

            return interaction.reply({ embeds: [mainEmbed] });
        }

        // Sistem bilgileri
        const supportRole = guild.roles.cache.get(guildData.supportRole);
        const supportChannel = guild.channels.cache.get(guildData.supportChannel);
        const feedbackChannel = guild.channels.cache.get(guildData.feedbackChannel);
        const logChannel = guild.channels.cache.get(guildData.logChannel);
        const ticketCategory = guild.channels.cache.get(guildData.ticketCategory);

        mainEmbed.setDescription(`**${guild.name}** sunucusunun destek sistemi durumu`)
            .addFields(
                {
                    name: '🎟️ Aktif Ticket\'lar',
                    value: `**${ticketCount}** ticket açık`,
                    inline: true
                },
                {
                    name: '👥 Destek Ekibi',
                    value: supportRole ? `<@&${supportRole.id}>` : '❌ Bulunamadı',
                    inline: true
                },
                {
                    name: '📂 Kategori',
                    value: ticketCategory ? ticketCategory.name : '❌ Bulunamadı',
                    inline: true
                },
                {
                    name: '🎯 Destek Kanalı',
                    value: supportChannel ? `<#${supportChannel.id}>` : '❌ Bulunamadı',
                    inline: true
                },
                {
                    name: '💬 Geri Bildirim',
                    value: feedbackChannel ? `<#${feedbackChannel.id}>` : '❌ Bulunamadı',
                    inline: true
                },
                {
                    name: '📋 Log Kanalı',
                    value: logChannel ? `<#${logChannel.id}>` : '❌ Bulunamadı',
                    inline: true
                }
            );

        // Aktif ticket listesi
        if (ticketCount > 0) {
            const ticketList = Object.entries(activeTickets)
                .map(([userId, data]) => {
                    const user = guild.members.cache.get(userId);
                    const channel = guild.channels.cache.get(data.channelId);
                    const categoryName = data.category ? 
                        data.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                        'Bilinmiyor';
                    
                    return `• **${user ? user.displayName : 'Bilinmeyen'}** - ${channel ? `<#${channel.id}>` : 'Kanal silinmiş'}\n  └ 📂 ${categoryName}`;
                })
                .join('\n');

            const ticketEmbed = new EmbedBuilder()
                .setTitle('🎟️ Aktif Ticket Listesi')
                .setDescription(ticketList.length > 4096 ? ticketList.substring(0, 4093) + '...' : ticketList)
                .setColor(config.colors.success)
                .setFooter({ text: `Toplam ${ticketCount} aktif ticket` });

            // Yenile butonu
            const refreshButton = new ButtonBuilder()
                .setCustomId('refresh-status')
                .setLabel('🔄 Yenile')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(refreshButton);

            await interaction.reply({ 
                embeds: ticketCount > 0 ? [mainEmbed, ticketEmbed] : [mainEmbed],
                components: [row]
            });
        } else {
            mainEmbed.addFields({
                name: '✨ Durum',
                value: 'Şu anda hiç aktif ticket bulunmuyor. Sistem hazır ve çalışıyor!',
                inline: false
            });

            const refreshButton = new ButtonBuilder()
                .setCustomId('refresh-status')
                .setLabel('🔄 Yenile')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(refreshButton);

            await interaction.reply({ 
                embeds: [mainEmbed],
                components: [row]
            });
        }
    }
};