/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
*/

const ModerationContext = require('../Contexts/ModerationContext');

const Command = require('../Command');

class ModerationCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string}} [options]  - `noArgs` specify a message to return if no arguments are provided.
     *  These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Moderation',
            conf: {
                guildOnly: true
            },
            emote: 'hammerPick'
        }});
        this.options = options;
    }

    //eslint-disable-next-line no-unused-vars
    async initialCheck(client, message, args, guildEntry, userEntry) {
        if (this.options.noArgs && !args[0]) {
            return message.channel.createMessage(this.options.noArgs);
        }
        return { 
            passed: true,
            context: new ModerationContext(client, message, args, guildEntry, userEntry)
        };
    }

}

module.exports = ModerationCommands;