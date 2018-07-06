'use strict';

/** 
 * @typedef {import("eris").Guild} Guild 
 * @typedef {import("eris").Member} Member
*/

/**
 *
 *
 * @class GuildMemberRemoveHandler
 */
class GuildMemberRemoveHandler {
    constructor() {}
    /**
     *
     *
     * @param {*} client Felix's client
     * @param {Guild} guild eris member
     * @param {Member} member Eris member
     * @returns {Promise<any>} hi
     * @memberof GuildMemberRemoveHandler
     */
    async handle(client, guild, member) {
        if (member.user.bot) {
            return;
        }
        const user = client.extendedUser(member.user);
        const guildEntry = await client.database.getGuild(guild.id);
        //Farewells
        if (!guildEntry.farewells.channel || !guildEntry.farewells.enabled || !guildEntry.farewells.message) {
            return;
        }
        let message = guildEntry.farewells.message = this.replaceFarewellTags(guild, user, guildEntry.farewells.message);
        
        let channel = guild.channels.get(guildEntry.farewells.channel);
        if (!channel || channel.type !== 0) {
            return;
        }
        //@ts-ignore
        channel.createMessage(message).catch(() => {});
    }

    replaceFarewellTags(guild, user, message) {
        return message.replace(/\%USERNAME\%/gim, `${user.username}`)
        .replace(/\%USERTAG%/gim, `${user.tag}`)
        .replace(/\%GUILD\%/gim, `${guild.name}`)
        .replace(/\%MEMBERCOUNT%/gim, guild.memberCount);
    }
}

module.exports = new GuildMemberRemoveHandler();