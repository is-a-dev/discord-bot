import { GuildEvent } from "../../classes/Event";
import ExtendedClient from "../../classes/ExtendedClient";
import { ColorResolvable, Message, PermissionResolvable } from "discord.js";

import axios from "axios";
import { emojis as emoji } from "../../../config.json";
import { cap } from "../../util/functions";

const event: GuildEvent = {
    name: "MessageCreate",
    once: false,
    async execute(client: ExtendedClient, Discord: typeof import("discord.js"), message: Message) {
        try {
            const requiredPerms: PermissionResolvable = ["SendMessages", "EmbedLinks"];

            if (!message.guild || message.guild.id !== client.config.guild) return;
            if (!message.guild.members.me.permissions.has(requiredPerms)) return;

            // Counting
            if (message.channel.id === client.config.channels.counting) {
                if (!message.content || !/^\d+$/.test(message.content) || message.author.bot) {
                    await message.delete();
                    return;
                }

                const countingChannel = message.guild.channels.cache.get(client.config.channels.counting);

                if (!countingChannel || countingChannel.type !== Discord.ChannelType.GuildText) return;

                const lastMessage = (await countingChannel.messages.fetch({ limit: 1 })).first();
                const lastCount = parseInt(lastMessage?.content || "0", 10);

                const currentCount = parseInt(message.content, 10);

                if (
                    isNaN(currentCount) ||
                    currentCount !== lastCount + 1 ||
                    lastMessage.author.id === message.author.id
                ) {
                    await message.delete();
                    return;
                }
            }

            if (message.author.bot || !message.content) return;

            // GitHub Pull Requests
            const prRegex = /##(\d{1,7})/;

            if (prRegex.test(message.content)) {
                const prId = message.content.match(prRegex)?.[1];

                try {
                    const res = (await axios.get(`https://api.github.com/repos/is-a-dev/register/pulls/${prId}`)).data;

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

                    const state = res.state === "open" ? "open" : res.merged_at ? "merged" : "closed";

                    const prEmbed = new Discord.EmbedBuilder()
                        .setColor(color[state])
                        .setAuthor({ name: res.user.login, iconURL: res.user.avatar_url, url: res.user.html_url })
                        .setTitle(cap(res.title, 100))
                        .setURL(res.html_url)
                        .addFields(
                            {
                                name: "Status",
                                value: `${stateEmojis[state]} ${state.charAt(0).toUpperCase() + state.slice(1)}`,
                                inline: true
                            },
                            {
                                name: "Labels",
                                value: res.labels.length
                                    ? `\`${res.labels.map((l: { name: string }) => l.name).join("`, `")}\``
                                    : "*N/A*",
                                inline: true
                            }
                        )
                        .setTimestamp(new Date(res.created_at));

                    await message.reply({ embeds: [prEmbed] });
                } catch (err) {
                    if (axios.isAxiosError(err) && err.response?.status === 404) {
                        const notFound = new Discord.EmbedBuilder()
                            .setColor(client.config.embeds.error as ColorResolvable)
                            .setDescription(`${emoji.cross} Pull request not found.`);

                        await message.reply({ embeds: [notFound] });
                        return;
                    }

                    client.logError(err);

                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} An error occurred while fetching the pull request.`);

                    await message.reply({ embeds: [error] });
                }
            }
        } catch (err) {
            client.logError(err);
        }
    }
};

export = event;
