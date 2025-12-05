const { Events, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const Database = require('../utils/database');
const TicketManager = require('../utils/ticketManager');
const config = require('../config.json');
const fs = require('fs');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`${interaction.commandName} komutu bulunamadı.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Komut çalıştırma hatası:', error);
                
                const errorMessage = { 
                    content: '❌ Bu komutu çalıştırırken bir hata oluştu!', 
                    ephemeral: true 
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }

        // Select menu etkileşimleri
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket-category') {
                const category = interaction.values[0];
                await TicketManager.createTicket(interaction, category);
            }

            if (interaction.customId === 'ticket-rating') {
                const rating = parseInt(interaction.values[0]);
                
                const modal = new ModalBuilder()
                    .setCustomId(`feedback-modal-${rating}`)
                    .setTitle('Geri Bildirim');

                const commentInput = new TextInputBuilder()
                    .setCustomId('feedback-comment')
                    .setLabel('Yorumunuz (İsteğe bağlı)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Aldığınız destek hakkında yorumunuzu yazabilirsiniz...')
                    .setRequired(false)
                    .setMaxLength(1000);

                const row = new ActionRowBuilder().addComponents(commentInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }
        }

        // Button etkileşimleri
        if (interaction.isButton()) {
            if (interaction.customId === 'ticket-close') {
                await TicketManager.showRatingMenu(interaction);
            }

            if (interaction.customId === 'refresh-status') {
                // Ticket durum komutunu yeniden çalıştır
                const command = interaction.client.commands.get('ticket-durum');
                if (command) {
                    await command.execute(interaction);
                }
            }
        }

        // Modal etkileşimleri
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('feedback-modal-')) {
                const rating = parseInt(interaction.customId.split('-')[2]);
                const comment = interaction.fields.getTextInputValue('feedback-comment') || 'Yorum yok';
                
                await this.closeTicket(interaction, rating, comment);
            }
        }
    },

    async closeTicket(interaction, rating, comment) {
        const guild = interaction.guild;
        const user = interaction.user;
        const channel = interaction.channel;
        const guildData = Database.getGuild(guild.id);

        if (!guildData) {
            return interaction.reply({
                content: '❌ Destek sistemi ayarları bulunamadı!',
                ephemeral: true
            });
        }

        try {
            // Ticket log'u oluştur
            const messages = await channel.messages.fetch({ limit: 100 });
            const logContent = messages.reverse().map(msg => {
                const timestamp = new Date(msg.createdTimestamp).toLocaleString('tr-TR');
                return `[${timestamp}] ${msg.author.tag}: ${msg.content}`;
            }).join('\n');

            const logBuffer = Buffer.from(logContent, 'utf-8');
            const attachment = new AttachmentBuilder(logBuffer, { 
                name: `ticket-${user.username}-${Date.now()}.txt` 
            });

            // Geri bildirim embed'i
            const feedbackEmbed = new EmbedBuilder()
                .setTitle('⭐ Yeni Geri Bildirim')
                .addFields(
                    { name: '👤 Kullanıcı', value: `${user}`, inline: true },
                    { name: '⭐ Puan', value: TicketManager.getStarDisplay(rating), inline: true },
                    { name: '🕐 Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                    { name: '💬 Yorum', value: comment }
                )
                .setColor(rating >= 4 ? config.colors.success : rating >= 3 ? config.colors.warning : config.colors.error)
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            // Geri bildirim kanalına gönder
            const feedbackChannel = guild.channels.cache.get(guildData.feedbackChannel);
            if (feedbackChannel) {
                await feedbackChannel.send({ embeds: [feedbackEmbed] });
            }

            // Log kanalına ticket log'unu gönder
            const logChannel = guild.channels.cache.get(guildData.logChannel);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📋 Ticket Kapatıldı')
                    .addFields(
                        { name: '👤 Kullanıcı', value: `${user}`, inline: true },
                        { name: '📂 Kanal', value: channel.name, inline: true },
                        { name: '⭐ Puan', value: `${rating}/5`, inline: true }
                    )
                    .setColor(config.colors.primary)
                    .setTimestamp();

                await logChannel.send({ 
                    embeds: [logEmbed], 
                    files: [attachment] 
                });
            }

            // Veritabanından ticket'ı kaldır
            Database.removeTicket(guild.id, user.id);

            await interaction.reply({
                content: '✅ Geri bildiriminiz kaydedildi! Ticket 5 saniye sonra kapatılacak.',
                ephemeral: true
            });

            // 5 saniye bekle ve kanalı sil
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (error) {
                    console.error('Kanal silme hatası:', error);
                }
            }, 5000);

        } catch (error) {
            console.error('Ticket kapatma hatası:', error);
            await interaction.reply({
                content: '❌ Ticket kapatılırken bir hata oluştu!',
                ephemeral: true
            });
        }
    }
};