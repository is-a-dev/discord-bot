import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { AutocompleteInteraction, ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { getDomains, getUsernames } from "../../util/functions";

const command: Command = {
    name: "stats",
    description: "Get a statistics about is-a.dev or a user.",
    options: [
        {
            name: "user",
            description: "Get statistics for a specific user.",
            type: 3,
            autocomplete: true
        }
    ],
    cooldown: 5,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const user = (interaction.options.get("user")?.value as string)?.toLowerCase();

            const data = await getDomains(client, { excludeFlags: ["internal", "reserved"], username: user || null });

            if (user && !data.some((entry: any) => entry.owner.username.toLowerCase() === user)) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} No data found for \`${user}\`.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const statistics = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle(user ? `${user}'s Statistics` : "is-a.dev Statistics")
                .setTimestamp();

            if (user) statistics.setThumbnail(`https://github.com/${user}.png`);

            const mainStats = [];
            const recordStats: any = {};

            const owners = new Set(data.map((entry: any) => entry.owner.username.toLowerCase()));

            mainStats.push(`Subdomains: \`${data.length}\``);
            if (!user) mainStats.push(`Users: \`${owners.size}\``);

            let totalRecords = 0;

            for (const domain of data) {
                for (const [recordType, recordValue] of Object.entries(domain.records)) {
                    if (!recordStats[recordType]) recordStats[recordType] = 0;
                    if (Array.isArray(recordValue)) {
                        recordStats[recordType] += recordValue.length;
                        totalRecords += recordValue.length;
                    } else {
                        recordStats[recordType]++;
                        totalRecords++;
                    }
                }
            }

            mainStats.push(`DNS Records: \`${totalRecords}\``);

            statistics.addFields(
                { name: "General", value: mainStats.join("\n"), inline: true },
                {
                    name: "DNS Records",
                    value: Object.entries(recordStats)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([type, count]) => `${type.toUpperCase()}: \`${count}\``)
                        .join("\n"),
                    inline: true
                }
            );

            const customPaths = data.filter((entry: any) => entry.redirect_config?.custom_paths).length;
            const redirectPaths = data.filter((entry: any) => entry.redirect_config?.redirect_paths).length;

            statistics.addFields({
                name: "Redirect Config",
                value: `Custom Redirect Paths: \`${customPaths}\`\nRedirecting Paths: \`${redirectPaths}\``,
                inline: true
            });

            await interaction.editReply({ embeds: [statistics] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction, client: ExtendedClient) => {
        try {
            const option = interaction.options.getFocused(true);

            if (option.name === "user") {
                const choices = (await getUsernames(client, { usernameIncludes: option.value, resultLimit: 25 })).map(
                    (username) => ({
                        name: username,
                        value: username
                    })
                );

                await interaction.respond(choices);
            }
        } catch (err) {
            client.logError(err);
        }
    }
};

export = command;
