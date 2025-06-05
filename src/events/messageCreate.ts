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
            const prIds = message.content.match(/##(\d{1,7})/g)?.slice(0, 10) || [];

            if (prIds.length > 0) {
                const data = [];

                for (const prId of prIds) {
                    const id = prId.replace(/##/g, "");

                    try {
                        const res = (await axios.get(`https://api.github.com/repos/is-a-dev/register/pulls/${id}`)).data;
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

                for (const res of data) {
                    const state = res.state === "open" ? "open" : res.merged_at ? "merged" : "closed";

                    const prEmbed = new Discord.EmbedBuilder()
                        .setColor(color[state])
                        .setAuthor({ name: res.user.login, iconURL: res.user.avatar_url, url: res.user.html_url })
                        .setTitle(cap(res.title, 100))
                        .setURL(res.html_url)
                        .addFields({
                            name: "Status",
                            value: `${stateEmojis[state]} ${state.charAt(0).toUpperCase() + state.slice(1)}`,
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
