import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { getDomains } from "../../util/functions";

const command: Command = {
    name: "available-single-letters",
    description: "Check if there are any available single letter subdomains.",
    options: [],
    botPermissions: [],
    permittedRoles: [],
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
            const subdomains = "abcdefghijklmnopqrstuvwxyz0123456789".split("");

            const res = await getDomains(client);

            const taken = res.map((entry: any) => entry.subdomain);
            const available = subdomains.filter((subdomain) => !taken.includes(subdomain));

            if (!available.length) {
                const noAvailable = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} No single letter subdomains are available.`);

                await interaction.editReply({ embeds: [noAvailable] });
                return;
            }

            const availableList = available.map((subdomain) => `- \`${subdomain}.is-a.dev\``).join("\n");

            const availableEmbed = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle("Available Single Letter Subdomains")
                .setDescription(availableList)
                .setTimestamp();

            await interaction.editReply({ embeds: [availableEmbed] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
