import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { fetchDomains } from "../../util/functions";

const command: Command = {
    name: "staff-domains",
    description: "Get a list of all the staff domains.",
    options: [],
    botPermissions: [],
    requiredRoles: ["maintainer"],
    cooldown: 5,
    enabled: true,
    deferReply: true,
    ephemeral: true,
    async execute(
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) {
        try {
            const res = await fetchDomains();
            const data = res
                .filter((entry: any) => entry.owner.username === "is-a-dev" && !entry.reserved)
                .sort((a: any, b: any) => a.subdomain.localeCompare(b.subdomain));

            if (!data) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} There are no staff domains.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const result = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle("Staff Domains")
                .setDescription(
                    data
                        .map((d: any) => (d.internal ? `- \`${d.domain}\` :gear:` : `- \`${d.domain}\``))
                        .join("\n")
                )
                .setFooter({ text: "⚙️ Internal" })
                .setTimestamp();

            await interaction.editReply({ embeds: [result] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
