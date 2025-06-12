import { GuildEvent } from "../classes/Event";
import ExtendedClient from "../classes/ExtendedClient";
import { ColorResolvable, Message, PermissionResolvable } from "discord.js";

import axios from "axios";
import { emojis as emoji } from "../../config.json";
import { cap } from "../util/functions";

type State = "issue_open" | "issue_completed" | "issue_closed" | "pr_open" | "pr_closed" | "pr_merged";

const event: GuildEvent = {
    name: "messageCreate",
    execute: async (client: ExtendedClient, Discord: typeof import("discord.js"), message: Message) => {
        try {
            const requiredPerms: PermissionResolvable = ["SendMessages", "EmbedLinks"];

            if (message.author.bot || !message.content) return;
            if (!message.guild || message.guild.id !== client.config.guild) return;
            if (!message.guild.members.me.permissions.has(requiredPerms)) return;

            // GitHub Pull Requests
            const matches = [...message.content.matchAll(/##(\d{1,7})/g)];
            const prIds = [...new Set(matches.map((m) => m[1]))].slice(0, 10);

            if (prIds.length > 0) {
                const data = [];

                for (const prId of prIds) {
                    try {
                        const res = (await axios.get(`https://api.github.com/repos/is-a-dev/register/issues/${prId}`))
                            .data;

                        if (!res.pull_request) continue;

                        data.push(res);
                    } catch {
                        continue;
                    }
                }

                if (data.length === 0) return;

                const color: Record<State, ColorResolvable> = {
                    issue_open: "#238636" as ColorResolvable,
                    issue_completed: "#8957e5" as ColorResolvable,
                    issue_closed: "#da3633" as ColorResolvable,
                    pr_open: "#238636" as ColorResolvable,
                    pr_closed: "#da3633" as ColorResolvable,
                    pr_merged: "#8957e5" as ColorResolvable
                };

                const stateEmojis: Record<State, string> = {
                    issue_open: emoji.issue_open,
                    issue_completed: emoji.issue_completed,
                    issue_closed: emoji.issue_closed,
                    pr_open: emoji.pr_open,
                    pr_closed: emoji.pr_closed,
                    pr_merged: emoji.pr_merged
                };

                const embeds = [];

                if (data.length > 1) {
                    for (const res of data) {
                        let state: State = null;

                        if (res.pull_request)
                            state =
                                res.state === "open"
                                    ? "pr_open"
                                    : res.pull_request.merged_at
                                    ? "pr_merged"
                                    : "pr_closed";
                        else {
                            state =
                                res.state === "open"
                                    ? "issue_open"
                                    : res.state_reason === "completed"
                                    ? "issue_completed"
                                    : "issue_closed";
                        }

                        const embed = new Discord.EmbedBuilder()
                            .setColor(color[state])
                            .setAuthor({ name: res.user.login, iconURL: res.user.avatar_url, url: res.user.html_url })
                            .setTitle(`${stateEmojis[state]} ${cap(res.title, 50)} (#${res.number})`)
                            .setURL(res.html_url);

                        embeds.push(embed);
                    }
                } else {
                    const res = data[0];

                    let state: State = res.state === "open" ? "issue_open" : "issue_closed";
                    if (res.pull_request)
                        state =
                            res.state === "open" ? "pr_open" : res.pull_request.merged_at ? "pr_merged" : "pr_closed";
                    const upperState = state.replace(/(issue|pr)_/, "").replace(/^\w/, (c) => c.toUpperCase());
                    const status = [`${emoji[state]} ${upperState}`];

                    if (upperState === "Open")
                        status.push(`<t:${Math.floor(new Date(res.created_at).getTime() / 1000)}:R>`);
                    if (upperState === "Closed" && res.user.login === res.closed_by.login)
                        status.push(`<t:${Math.floor(new Date(res.closed_at).getTime() / 1000)}:R>`);
                    if (upperState === "Closed" && res.user.login !== res.closed_by.login)
                        status.push(
                            `<t:${Math.floor(new Date(res.closed_at).getTime() / 1000)}:R> by [${
                                res.closed_by.login
                            }](${res.closed_by.html_url})`
                        );
                    if (upperState === "Merged")
                        status.push(
                            `<t:${Math.floor(new Date(res.pull_request.merged_at).getTime() / 1000)}:R> by [${
                                res.closed_by.login
                            }](${res.closed_by.html_url})`
                        );

                    const embed = new Discord.EmbedBuilder()
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
                        embed.addFields({
                            name: "Labels",
                            value: `\`${res.labels.map((l: { name: string }) => l.name).join("`, `")}\``,
                            inline: true
                        });
                    }

                    embeds.push(embed);
                }

                await message.reply({ embeds });
            }
        } catch (err) {
            client.logError(err);
        }
    }
};

export = event;
