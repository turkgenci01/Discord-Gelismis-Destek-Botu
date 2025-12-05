const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const Database = require('./database');
const config = require('../config.json');

class TicketManager {
    static async createSupportMessage(channel) {
        const embed = new EmbedBuilder()
            .setTitle('🎟️ Destek Sistemi')
            .setDescription('Merhaba! Destek talebiniz için aşağıdan uygun kategoriyi seçin.')
            .setColor(config.colors.primary)
            .addFields(
                { name: '🔧 Teknik Destek', value: 'Bot veya teknik konular hakkında', inline: true },
                { name: '📋 Rapor', value: 'Hata bildirimi veya şikayet', inline: true },
                { name: '💰 Satış İşlemi', value: 'Satın alma veya ödeme konuları', inline: true },
                { name: '❓ Diğer', value: 'Yukarıdakiler dışındaki konular', inline: true }
            )
            .setFooter({ text: 'Aynı anda sadece bir ticket açabilirsiniz.' })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket-category')
            .setPlaceholder('Destek kategorisi seçin...')
            .addOptions([
                {
                    label: 'Teknik Destek',
                    description: 'Bot veya teknik konular hakkında yardım',
                    value: 'teknik-destek',
                    emoji: '🔧'
                },
                {
                    label: 'Rapor',
                    description: 'Hata bildirimi veya şikayet',
                    value: 'rapor',
                    emoji: '📋'
                },
                {
                    label: 'Satış İşlemi',
                    description: 'Satın alma veya ödeme konuları',
                    value: 'satis-islemi',
                    emoji: '💰'
                },
                {
                    label: 'Diğer',
                    description: 'Yukarıdakiler dışındaki konular',
                    value: 'diger',
                    emoji: '❓'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        return channel.send({ embeds: [embed], components: [row] });
    }

    static async createTicket(interaction, category) {
        const guild = interaction.guild;
        const user = interaction.user;
        const guildData = Database.getGuild(guild.id);

        if (!guildData || !guildData.supportRole || !guildData.ticketCategory) {
            return interaction.reply({
                content: '❌ Destek sistemi henüz kurulmamış! Lütfen `/setup-destek` komutunu kullanın.',
                ephemeral: true
            });
        }

        // Kullanıcının aktif ticketı var mı kontrol et
        const activeTickets = Database.getActiveTickets(guild.id);
        if (activeTickets[user.id]) {
            return interaction.reply({
                content: '❌ Zaten aktif bir ticket\'ınız bulunuyor!',
                ephemeral: true
            });
        }

        try {
            // Ticket kanalı oluştur
            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: guildData.ticketCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: guildData.supportRole,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ]
            });

            // Ticket veritabanına kaydet
            Database.addTicket(guild.id, user.id, {
                channelId: ticketChannel.id,
                category: category,
                createdAt: Date.now()
            });

            // Ticket açılış mesajı
            const embed = new EmbedBuilder()
                .setTitle('🎟️ Yeni Destek Talebi')
                .setDescription(`Merhaba ${user}! Destek talebiniz oluşturuldu.`)
                .addFields(
                    { name: '📂 Kategori', value: this.getCategoryName(category), inline: true },
                    { name: '⏰ Oluşturulma Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true }
                )
                .setColor(config.colors.success)
                .setFooter({ text: 'Destek ekibimiz en kısa sürede size yardımcı olacak.' });

            const closeButton = new ButtonBuilder()
                .setCustomId('ticket-close')
                .setLabel('Ticket\'ı Kapat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒');

            const row = new ActionRowBuilder().addComponents(closeButton);

            await ticketChannel.send({
                content: `${user} - <@&${guildData.supportRole}>`,
                embeds: [embed],
                components: [row]
            });

            await interaction.reply({
                content: `✅ Ticket'ınız oluşturuldu: ${ticketChannel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Ticket oluşturma hatası:', error);
            await interaction.reply({
                content: '❌ Ticket oluşturulurken bir hata oluştu!',
                ephemeral: true
            });
        }
    }

    static getCategoryName(category) {
        const categories = {
            'teknik-destek': '🔧 Teknik Destek',
            'rapor': '📋 Rapor',
            'satis-islemi': '💰 Satış İşlemi',
            'diger': '❓ Diğer'
        };
        return categories[category] || category;
    }

    static async showRatingMenu(interaction) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket-rating')
            .setPlaceholder('Destek kalitesini değerlendirin...')
            .addOptions([
                { label: '⭐ (1 Yıldız)', value: '1', description: 'Çok kötü' },
                { label: '⭐⭐ (2 Yıldız)', value: '2', description: 'Kötü' },
                { label: '⭐⭐⭐ (3 Yıldız)', value: '3', description: 'Orta' },
                { label: '⭐⭐⭐⭐ (4 Yıldız)', value: '4', description: 'İyi' },
                { label: '⭐⭐⭐⭐⭐ (5 Yıldız)', value: '5', description: 'Mükemmel' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: '📊 Lütfen aldığınız desteği değerlendirin:',
            components: [row],
            ephemeral: true
        });
    }

    static getStarDisplay(rating) {
        const stars = '⭐'.repeat(rating) + '✩'.repeat(5 - rating);
        return stars;
    }
}

module.exports = TicketManager;