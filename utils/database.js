const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.json');

class Database {
    static load() {
        try {
            const data = fs.readFileSync(dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { guilds: {} };
        }
    }

    static save(data) {
        try {
            fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Veritabanı kaydetme hatası:', error);
            return false;
        }
    }

    static getGuild(guildId) {
        const data = this.load();
        return data.guilds[guildId] || null;
    }

    static setGuild(guildId, guildData) {
        const data = this.load();
        data.guilds[guildId] = guildData;
        return this.save(data);
    }

    static updateGuild(guildId, updates) {
        const data = this.load();
        if (!data.guilds[guildId]) {
            data.guilds[guildId] = {};
        }
        data.guilds[guildId] = { ...data.guilds[guildId], ...updates };
        return this.save(data);
    }

    static addTicket(guildId, userId, ticketData) {
        const guildData = this.getGuild(guildId) || {};
        if (!guildData.tickets) guildData.tickets = {};
        guildData.tickets[userId] = ticketData;
        return this.setGuild(guildId, guildData);
    }

    static removeTicket(guildId, userId) {
        const guildData = this.getGuild(guildId);
        if (guildData && guildData.tickets) {
            delete guildData.tickets[userId];
            return this.setGuild(guildId, guildData);
        }
        return false;
    }

    static getActiveTickets(guildId) {
        const guildData = this.getGuild(guildId);
        return guildData?.tickets || {};
    }
}

module.exports = Database;