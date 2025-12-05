const { ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const config = require('../config.json');

class StatusManager {
    constructor(client) {
        this.client = client;
        this.currentActivityIndex = 0;
        this.voiceConnection = null;
        this.audioPlayer = null;
    }

    // Durum döngüsünü başlat
    startStatusRotation() {
        if (!config.status || !config.status.activities || config.status.activities.length === 0) {
            console.log('⚠️ Config dosyasında durum ayarları bulunamadı');
            return;
        }

        // İlk durumu ayarla
        this.updateStatus();

        // Belirtilen aralıklarla durumu değiştir
        setInterval(() => {
            this.updateStatus();
        }, config.status.interval || 30000);

        console.log('✅ Durum döngüsü başlatıldı');
    }

    // Durumu güncelle
    updateStatus() {
        const activities = config.status.activities;
        const activity = activities[this.currentActivityIndex];

        const activityOptions = {
            name: activity.name,
            type: this.getActivityType(activity.type)
        };

        // Streaming için URL ekle
        if (activity.type === 'STREAMING' && activity.url) {
            activityOptions.url = activity.url;
        }

        this.client.user.setActivity(activityOptions);

        // Sonraki aktiviteye geç
        this.currentActivityIndex = (this.currentActivityIndex + 1) % activities.length;

        console.log(`🔄 Durum güncellendi: ${activity.name}`);
    }

    // Activity type'ı dönüştür
    getActivityType(type) {
        const types = {
            'PLAYING': ActivityType.Playing,
            'STREAMING': ActivityType.Streaming,
            'LISTENING': ActivityType.Listening,
            'WATCHING': ActivityType.Watching,
            'COMPETING': ActivityType.Competing
        };
        return types[type] || ActivityType.Playing;
    }

    // Ses kanalına bağlan
    async connectToVoiceChannel() {
        if (!config.voiceChannelId || config.voiceChannelId === "BURAYA_SES_KANALI_ID_GIRIN") {
            console.log('⚠️ Ses kanalı ID\'si config dosyasında ayarlanmamış');
            return;
        }

        try {
            // Tüm sunucularda ses kanalını ara
            let voiceChannel = null;
            for (const guild of this.client.guilds.cache.values()) {
                const channel = guild.channels.cache.get(config.voiceChannelId);
                if (channel && channel.isVoiceBased()) {
                    voiceChannel = channel;
                    break;
                }
            }

            if (!voiceChannel) {
                console.log('❌ Belirtilen ses kanalı bulunamadı');
                return;
            }

            // Ses kanalına bağlan
            this.voiceConnection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true
            });

            // Bağlantı durumunu dinle
            this.voiceConnection.on(VoiceConnectionStatus.Ready, () => {
                console.log(`✅ Ses kanalına bağlandı: ${voiceChannel.name} (${voiceChannel.guild.name})`);
            });

            this.voiceConnection.on(VoiceConnectionStatus.Disconnected, () => {
                console.log('⚠️ Ses kanalından bağlantı kesildi, yeniden bağlanmaya çalışılıyor...');
                setTimeout(() => {
                    this.connectToVoiceChannel();
                }, 5000);
            });

            this.voiceConnection.on('error', (error) => {
                console.error('❌ Ses bağlantısı hatası:', error);
                setTimeout(() => {
                    this.connectToVoiceChannel();
                }, 10000);
            });

            // Audio player oluştur (sessiz kalması için)
            this.audioPlayer = createAudioPlayer();
            this.voiceConnection.subscribe(this.audioPlayer);

        } catch (error) {
            console.error('❌ Ses kanalına bağlanırken hata:', error);
            // 30 saniye sonra tekrar dene
            setTimeout(() => {
                this.connectToVoiceChannel();
            }, 30000);
        }
    }

    // Bağlantıyı kontrol et ve gerekirse yeniden bağlan
    checkVoiceConnection() {
        setInterval(() => {
            if (!this.voiceConnection || this.voiceConnection.state.status === VoiceConnectionStatus.Destroyed) {
                console.log('🔄 Ses bağlantısı kontrol ediliyor...');
                this.connectToVoiceChannel();
            }
        }, 60000); // Her dakika kontrol et
    }

    // Ses bağlantısını kes
    disconnect() {
        if (this.voiceConnection) {
            this.voiceConnection.destroy();
            this.voiceConnection = null;
            console.log('🔇 Ses kanalından bağlantı kesildi');
        }
    }
}

module.exports = StatusManager;