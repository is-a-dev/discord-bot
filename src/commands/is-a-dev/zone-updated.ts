import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { lookupTxt } from "dns-query";
import { emojis as emoji } from "../../../config.json";

const command: Command = {
    name: "zone-updated",
    description: "Get the last time the is-a.dev zone was updated.",
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
        Discord: typeof import("discord.js"),
    ) {
        try {
            const res = await lookupTxt(`_zone-updated.is-a.dev`, {
                endpoints: ["one.one.one.one", "dns.google"],
            });

            if (!res.entries[0]) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} No \`_zone-updated\` TXT record was found for \`is-a.dev\`.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const zoneUpdated = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setDescription(
                    `The **is-a.dev** zone was last updated <t:${Math.floor(Number(res.entries[0].data) / 1000)}:F>.`,
                );

            await interaction.editReply({ embeds: [zoneUpdated] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    },
};

export = command;
