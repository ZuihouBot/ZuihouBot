'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class Queue extends MusicCommands {
    constructor(client) {
        super(client);
        this.help = {
            name: 'queue',
            description: 'Queue a song or check the queue, to check the queue, just run `{prefix}queue`. You can input: A `YouTube` URL (including livestreams), a `Soundcloud` URL, a `Twitch` channel URL (the channel must be live);\n\nOr a search term to search through `YouTube` or `Soundcloud`, by default the search is done on `YouTube`, to search through `Soundcloud`, you must specify it like `{prefix}queue soundcloud <search_term>`',
            usage: '{prefix}queue <song_url|search_term>'
        };
        this.conf = this.genericConf();
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        const member = message.channel.guild.members.get(message.author.id);
        const clientMember = message.channel.guild.members.get(this.client.bot.user.id);
        let connection = this.client.musicManager.connections.get(message.channel.guild.id);
        if (!args[0]) {
            let queue = connection ? connection.queue : await this.client.musicManager.getQueueOf(message.channel.guild.id);
            if (!queue[0]) {
                return message.channel.createMessage(`:x: There is nothing in the queue`);
            }
            return message.channel.createMessage(this.formatQueue(queue, connection));
        }
        if (!member.voiceState.channelID) {
            return message.channel.createMessage(':x: You are not connected to any voice channel');
        }
        if (!clientMember.voiceState.channelID) {
            if (Array.isArray(this.this.clientHasPermissions(message, this.client, ['voiceConnect', 'voiceSpeak'], message.channel.guild.channels.get(member.voiceState.channelID)))) {
                return message.channel.createMessage(':x: It seems like I lack the permission to connect or to speak in the voice channel you are in :c');
            }
        }
        if (!connection) {
            connection = await this.client.musicManager.getPlayer(message.channel.guild.channels.get(member.voiceState.channelID));
        }
        let tracks = await this.client.musicManager.resolveTracks(connection.player.node, args.join(' '));
        let queued;
        let track = tracks[0];
        if (!track) {
            return message.channel.createMessage(`:x: I could not find any song :c, please make sure to:\n- Follow the syntax (check \`${this.client.commands.get('help').getPrefix(this.client, guildEntry)}help ${this.help.name}\`)\n- Use HTTPS links, unsecured HTTP links aren't supported\n- If a YouTube video, I can't play it if it is age-restricted\n - If a YouTube video, it might be blocked in the country my servers are`);
        }
        if (tracks.length > 1) {
            track = await this.client.commands.get('play').selectTrack(this.client, message, tracks);
            if (!track) {
                return;
            }
        }
        if (track.info.isStream) {
            return message.channel.createMessage(':x: I am sorry but you cannot add live streams to the queue, you can only play them immediately');
        }
        if (!connection.player.playing && !connection.player.paused) {
            connection.play(track, message.author.id);
        } else {
            queued = connection.addTrack(track, message.author.id);
        }
        return message.channel.createMessage({embed: {
            title: `:musical_note: ${queued ? 'Successfully enqueued' : 'Now playing'}`,
            description: `[${track.info.title}](${track.info.uri})`,
            fields: [{
                name: 'Author',
                value: track.info.author,
                inline: true
            }, {
                name: 'Duration',
                value: this.client.musicManager.parseDuration(track),
                inline: true
            }, {
                name: 'Estimated time until playing',
                value: this.client.musicManager.parseDuration(queued.timeUntilPlaying)
            }],
            color: this.client.config.options.embedColor
        }});
    }

    formatQueue(connectionQueue, connection) {
        let formattedQueue = '';
        if (connection) {
            formattedQueue += `:musical_note: Now playing: **${connection.nowPlaying.info.title}** `;
            formattedQueue += `(${this.client.musicManager.parseDuration(connection.player.state.position)}/${this.client.musicManager.parseDuration(connection.nowPlaying)})\n`;
            formattedQueue += `Repeat: ${this.client.commands.get('repeat').extra[connection.repeat].emote}\n\n`;
        }
        let i = 1;
        let queue = [...connectionQueue];
        for (const track of queue) {
            if (formattedQueue.length >= 1870) {
                return formattedQueue += `\n\nAnd **${queue.length - i}** more... ${connection ? ("**Total queue estimated duration**: `" + this.client.musicManager.parseDuration(connection.queueDuration) + "`") : ''}`;
            }
            formattedQueue += `\`${i++}\` - **${track.info.title}** (\`${this.client.musicManager.parseDuration(track)}\`)\n`;
        }
        if (connection) {
            formattedQueue += `\n**Total queue estimated duration**: \`${this.client.musicManager.parseDuration(connection.queueDuration)}\``;
        }
        return formattedQueue;
    }
}

module.exports = Queue;