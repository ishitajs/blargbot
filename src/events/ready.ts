import moment from 'moment-timezone';
import { BaseEventHandler } from '../structures/BaseEventHandler';
import { humanize, snowflake } from '../newbu';
import { Cluster } from '../cluster';
import { StoredGuild } from '../core/RethinkDb';

class ReadyEventHandler extends BaseEventHandler {
    #obtainEventTimer?: NodeJS.Timeout;
    #processEventTimer?: NodeJS.Timeout;

    constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'ready', cluster.logger);
    }

    async handle() {
        this.cluster.worker.send('ready', this.cluster.id, this.cluster.discord.guilds.map(g => g.id));
        this.logger.init(`Ready! Logged in as ${this.cluster.discord.user.username}#${this.cluster.discord.user.discriminator}`);

        let home;
        if (home = this.cluster.discord.guilds.get(this.cluster.config.discord.guilds.home)) {
            let police = home.members.filter(m => m.roles.includes(this.cluster.config.discord.roles.police)).map(m => m.id);
            await this.cluster.rethinkdb.setVar({ varname: 'police', value: police });

            let support = home.members.filter(m => m.roles.includes(this.cluster.config.discord.roles.support)).map(m => m.id);
            await this.cluster.rethinkdb.setVar({ varname: 'support', value: support });
        }

        if (this.cluster.id === '0') {
            let restart = await this.cluster.rethinkdb.getVar('restart');

            if (restart?.varvalue) {
                this.cluster.util.send(restart.varvalue.channel, 'Ok I\'m back. It took me ' + humanize.duration(moment(), moment(restart.varvalue.time)) + '.');
                await this.cluster.rethinkdb.deleteVar('restart');
            }
        }

        this.cluster.metrics.guildGauge.set(this.cluster.discord.guilds.size);

        let guildIds = new Set((await this.cluster.rethinkdb.queryAll<StoredGuild>(r => r.table('guild').withFields('guildid'))).map(g => g.guildid));
        //console.dir(guilds);
        this.cluster.discord.guilds.forEach(async (guild) => {
            if (guildIds.has(guild.id))
                return;

            let members = guild.memberCount;
            let users = guild.members.filter(m => !m.user.bot).length;
            let bots = guild.members.filter(m => m.user.bot).length;
            let percent = Math.floor(bots / members * 10000) / 100;
            var message = `:ballot_box_with_check: Guild: \`${guild.name}\`` +
                ` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n   Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
            this.cluster.util.send(this.cluster.config.discord.channels.joinlog, message);

            this.logger.log('Inserting a missing guild ' + guild.id);
            await this.cluster.rethinkdb.setGuild({
                guildid: guild.id,
                active: true,
                name: guild.name,
                settings: {},
                channels: {},
                commandperms: {},
                ccommands: {},
                modlog: []
            });
        });


        this.cluster.util.postStats();
        this.initEvents();

        let blacklist = await this.cluster.rethinkdb.getVar('guildBlacklist');
        if (blacklist) {
            for (const g of Object.keys(blacklist.values)) {
                if (blacklist.values[g] && this.cluster.discord.guilds.get(g)) {
                    let guild = this.cluster.discord.guilds.get(g);
                    if (guild) {
                        this.cluster.util.sendDM(guild.ownerID, `Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);
                        guild.leave();
                    }
                }
            }
        }
    }

    async initEvents() {
        this.logger.init('Starting event interval!');
        if (this.#obtainEventTimer)
            clearInterval(this.#obtainEventTimer);
        this.#obtainEventTimer = setInterval(() => {
            this.cluster.triggers.obtain();
        }, 5 * 60 * 1000);

        if (this.#processEventTimer)
            clearInterval(this.#processEventTimer);
        this.#processEventTimer = setInterval(() => {
            this.cluster.triggers.process();
        }, 10 * 1000);

        await this.cluster.triggers.obtain();
        await this.cluster.triggers.process();
    }
}

module.exports = { ReadyEventHandler };