import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { getDomains } from "../../util/functions";

const command: Command = {
    name: "reserved-domains",
    description: "Get a list of all the reserved domains.",
    permittedRoles: ["maintainer"],
    cooldown: 5,
    ephemeral: true,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const res = await getDomains(client, { excludeFlags: ["internal"] });
            const data = res
                .filter((entry: any) => entry.reserved)
                .sort((a: any, b: any) => a.subdomain.localeCompare(b.subdomain));

            if (!data) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} There are no reserved domains.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const result = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle("Reserved Subdomains")
                .setDescription(data.map((d: any) => `\`${d.subdomain}\``).join(", "))
                .setTimestamp();

            await interaction.editReply({ embeds: [result] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
