import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { getDomains } from "../../util/functions";

const command: Command = {
    name: "statistics",
    description: "Get a bunch of statistics about is-a.dev.",
    options: [],
    botPermissions: [],
    requiredRoles: [],
    cooldown: 5,
    enabled: true,
    deferReply: true,
    ephemeral: false,
    async execute(
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) {
        try {
            const data = await getDomains(true, true, true);

            const statistics = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle("is-a.dev Statistics")
                .setTimestamp();

            const mainStats = [];
            const recordStats: any = {};

            const owners = new Set(data.map((entry: any) => entry.owner.username.toLowerCase()));

            mainStats.push(`Subdomains: \`${data.length}\``);
            mainStats.push(`Users: \`${owners.size}\``);

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
    }
};

export = command;
