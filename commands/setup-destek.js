const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const Database = require('../utils/database');
const TicketManager = require('../utils/ticketManager');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-destek')
        .setDescription('Destek sistemini kurar ve gerekli kanalları oluşturur')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Bu komutu kullanmak için Yönetici yetkisine sahip olmalısınız!',
                ephemeral: true
            });
        }

        const guild = interaction.guild;
        await interaction.deferReply();

        try {
            let supportRole, ticketCategory, supportChannel, feedbackChannel, logChannel;

            // Destek rolü oluştur veya bul
            supportRole = guild.roles.cache.find(role => role.name === 'Destek Ekibi');
            if (!supportRole) {
                supportRole = await guild.roles.create({
                    name: 'Destek Ekibi',
                    color: config.colors.primary,
                    reason: 'Destek sistemi kurulumu'
                });
            }

            // Ticket kategorisi oluştur
            ticketCategory = guild.channels.cache.find(ch => ch.name === 'ticket-category' && ch.type === ChannelType.GuildCategory);
            if (!ticketCategory) {
                ticketCategory = await guild.channels.create({
                    name: 'ticket-category',
                    type: ChannelType.GuildCategory,
                    reason: 'Destek sistemi kurulumu'
                });
            }

            // Destek kanalı oluştur
            supportChannel = guild.channels.cache.find(ch => ch.name === 'destek');
            if (!supportChannel) {
                supportChannel = await guild.channels.create({
                    name: 'destek',
                    type: ChannelType.GuildText,
                    reason: 'Destek sistemi kurulumu',
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                            deny: [PermissionFlagsBits.SendMessages]
                        }
                    ]
                });
            }

            // Geri bildirim kanalı oluştur
            feedbackChannel = guild.channels.cache.find(ch => ch.name === 'geri-bildirim');
            if (!feedbackChannel) {
                feedbackChannel = await guild.channels.create({
                    name: 'geri-bildirim',
                    type: ChannelType.GuildText,
                    reason: 'Destek sistemi kurulumu',
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                            deny: [PermissionFlagsBits.SendMessages]
                        }
                    ]
                });
            }

            // Log kanalı oluştur
            logChannel = guild.channels.cache.find(ch => ch.name === 'ticket-log');
            if (!logChannel) {
                logChannel = await guild.channels.create({
                    name: 'ticket-log',
                    type: ChannelType.GuildText,
                    reason: 'Destek sistemi kurulumu',
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: supportRole.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
                        }
                    ]
                });
            }

            // Veritabanını güncelle
            Database.updateGuild(guild.id, {
                supportRole: supportRole.id,
                ticketCategory: ticketCategory.id,
                supportChannel: supportChannel.id,
                feedbackChannel: feedbackChannel.id,
                logChannel: logChannel.id
            });

            // Destek mesajını gönder
            await TicketManager.createSupportMessage(supportChannel);

            const embed = new EmbedBuilder()
                .setTitle('✅ Destek Sistemi Başarıyla Kuruldu!')
                .setDescription('Tüm gerekli kanallar ve roller oluşturuldu.')
                .addFields(
                    { name: '👥 Destek Rolü', value: `<@&${supportRole.id}>`, inline: true },
                    { name: '📂 Ticket Kategorisi', value: ticketCategory.name, inline: true },
                    { name: '🎟️ Destek Kanalı', value: `<#${supportChannel.id}>`, inline: true },
                    { name: '💬 Geri Bildirim', value: `<#${feedbackChannel.id}>`, inline: true },
                    { name: '📋 Log Kanalı', value: `<#${logChannel.id}>`, inline: true }
                )
                .setColor(config.colors.success)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Setup hatası:', error);
            await interaction.editReply({
                content: '❌ Kurulum sırasında bir hata oluştu! Bot\'un gerekli izinlere sahip olduğundan emin olun.'
            });
        }
    }
};