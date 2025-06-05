import { GuildEvent } from "../classes/Event";
import ExtendedClient from "../classes/ExtendedClient";
import { ColorResolvable, Message, PermissionResolvable } from "discord.js";

import axios from "axios";
import { emojis as emoji } from "../../config.json";
import { cap } from "../util/functions";

const event: GuildEvent = {
    name: "messageCreate",
    async execute(client: ExtendedClient, Discord: typeof import("discord.js"), message: Message) {
        try {
            const requiredPerms: PermissionResolvable = ["SendMessages", "EmbedLinks"];

            if (message.author.bot || !message.content) return;
            if (!message.guild || message.guild.id !== client.config.guild) return;
            if (!message.guild.members.me.permissions.has(requiredPerms)) return;

            // GitHub Pull Requests
            const matches = [...message.content.matchAll(/##(\d{1,7})/g)];
            const prIds = [...new Set(matches.map(m => m[1]))].slice(0, 10);

            if (prIds.length > 0) {
                const data = [];

                for (const prId of prIds) {
                    try {
                        const res = (await axios.get(`https://api.github.com/repos/is-a-dev/register/issues/${prId}`)).data;

                        if (!res.pull_request) continue;

                        data.push(res);
                    } catch {
                        continue;
                    }
                }

                if (data.length === 0) return;

                const color = {
                    open: "#2cbe4e" as ColorResolvable,
                    closed: "#cb2431" as ColorResolvable,
                    merged: "#6f42c1" as ColorResolvable
                };

                const stateEmojis = {
                    open: emoji.pr_open,
                    closed: emoji.pr_closed,
                    merged: emoji.pr_merged
                };

                const embeds = [];

                if (data.length > 1) {
                    for (const res of data) {
                        const state = res.state === "open" ? "open" : res.pull_request.merged_at ? "merged" : "closed";

                        const prEmbed = new Discord.EmbedBuilder()
                            .setColor(color[state])
                            .setAuthor({ name: res.user.login, iconURL: res.user.avatar_url, url: res.user.html_url })
                            .setTitle(`${stateEmojis[state]} ${cap(res.title, 50)} (#${res.number})`)
                            .setURL(res.html_url);

                        embeds.push(prEmbed);
                    }
                } else {
                    const res = data[0];

                    const state = res.state === "open" ? "open" : res.pull_request.merged_at ? "merged" : "closed";
                    const upperState = state.charAt(0).toUpperCase() + state.slice(1);
                    const status = [stateEmojis[state], upperState === "Open" ? "Opened" : upperState];

                    if (state === "open") status.push(`<t:${Math.floor(new Date(res.created_at).getTime() / 1000)}:R>`);
                    if (state === "closed") status.push(`<t:${Math.floor(new Date(res.closed_at).getTime() / 1000)}:R> by [${res.closed_by.login}](${res.closed_by.html_url})`);
                    if (state === "merged") status.push (`<t:${Math.floor(new Date(res.pull_request.merged_at).getTime() / 1000)}:R> by [${res.closed_by.login}](${res.closed_by.html_url})`);

                    const prEmbed = new Discord.EmbedBuilder()
                        .setColor(color[state])
                        .setAuthor({ name: res.user.login, iconURL: res.user.avatar_url, url: res.user.html_url })
                        .setTitle(`${cap(res.title, 50)} (#${res.number})`)
                        .setURL(res.html_url)
                        .addFields({
                            name: "Status",
                            value: status.join(" "),
                            inline: true
                        })
                        .setTimestamp(new Date(res.created_at));

                    if (res.labels.length > 0) {
                        prEmbed.addFields({
                            name: "Labels",
                            value: `\`${res.labels.map((l: { name: string }) => l.name).join("`, `")}\``,
                            inline: true
                        });
                    }

                    embeds.push(prEmbed);
                }

                await message.reply({ embeds });
            }
        } catch (err) {
            client.logError(err);
        }
    }
};

export = event;
