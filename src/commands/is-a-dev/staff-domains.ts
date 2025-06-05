import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { getDomains } from "../../util/functions";

const command: Command = {
    name: "staff-domains",
    description: "Get a list of all the staff domains.",
    permittedRoles: ["maintainer"],
    cooldown: 5,
    ephemeral: true,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const data = await getDomains(client, { excludeFlags: ["reserved"], username: "is-a-dev" });

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
                    data.map((d: any) => (d.internal ? `- \`${d.domain}\` :gear:` : `- \`${d.domain}\``)).join("\n")
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
