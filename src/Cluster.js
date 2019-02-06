// @ts-nocheck
const config = require('../config');
const { Client, Collection } = require('eris');
const { MongoClient: mongodb }  = require('mongodb');
const DatabaseHandler = require('./handlers/DatabaseHandler');
const Logger = require('@eris-sharder/core/src/modules/Logger');
const { promises: fs } = require('fs');
const { join } = require('path');
const Utils = require('./structures/Utils');

class Felix extends Client {
    constructor() {
        super(process.env.TOKEN, {
            firstShardID: Number(process.env.FIRST_SHARD_ID),
            lastShardID: Number(process.env.LAST_SHARD_ID)
        });
        this.config = config;        
        this.mongo = mongodb;
        /** @type {import('mongodb').Db} */
        this.mongodb;
        this.db = new DatabaseHandler(this);
        this.logger = new Logger();
        this.commands = new Collection();
        this.aliases = new Collection();
        this.prefixes = this.config.prefix ? [this.config.prefix] : [];
        this.launch();
        this.events = {};
        this.utils = new Utils(this);
    }

    async launch () {
        await this.logger.registerTransport('console', new (require('@eris-sharder/core/src/transports/Console'))());
        await this.loadEventsListeners();
        this.connect();
        await this.logger.init();
        await this.db.connect();
    }

    async loadEventsListeners() {
        //Load events
        const events = await fs.readdir(join(__dirname, 'events'));
        let loadedEvents = 0;
        events.forEach(e => {
            try {
                const eventName = e.split(".")[0];
                const event = require(join(__dirname, 'events', e));
                loadedEvents++;
                this.events[eventName] = event.handle.bind(event, this);
                this.on(eventName, this.events[eventName]);
                delete require.cache[require.resolve(join(__dirname, 'events', e))];
            } catch (err) {
                this.logger.error({ src: 'Felix', msg: `Failed to load event ${e}: ${err.stack || err}` });
            }
        });
        this.logger.info({ src: 'Felix', msg: `Loaded ${loadedEvents}/${events.length} events` });
        process.on('unhandledRejection', (err) => this.emit('error', err));
        process.on('uncaughtException', (err) => this.emit('error', err));
    }

    loadCommands() {
        const categories = fs.readdirSync(join(__dirname, 'commands'));
        let totalCommands = 0;
        for (let i = 0; i < categories.length; i++) {
            let thisCommands = fs.readdirSync(join(__dirname, 'commands', categories[i]));
            totalCommands = totalCommands + thisCommands.length;
            thisCommands.forEach(c => {
                try {
                    let command = new (require(join(__dirname, 'commands', categories[i], c)))(this);
                    //Add the command and its aliases to the collection
                    this.commands.set(command.name, command);
                    command.aliases.forEach(alias => {
                        this.aliases.set(alias, command.name);
                    });
                } catch (err) {
                    this.utils.log.error(`Failed to load command ${c}: ${err.stack || err}`);
                }
            });
        }
        this.utils.log.info(`Loaded ${this.commands.size}/${totalCommands} commands`);
    }
}

module.exports = Felix;