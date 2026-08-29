import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { getOpenPRCount } from "../../util/functions";

const command: Command = {
    name: "pr-count",
    description: "See how many PRs are open on the is-a-dev/register repository.",
    cooldown: 30,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const data = await getOpenPRCount();

            if (!data) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} There are no open PRs.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            if (data instanceof Error) {
                const errorEmbed = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} Failed to fetch open PR count: ${data.message}`);
    
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            const result = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setAuthor({ name: "is-a-dev/register" })
                .setURL("https://github.com/is-a-dev/register/pulls")
                .setTitle("Open PR Count")
                .setDescription(`${emoji.pr_open} **${data}**`)
                .setTimestamp();

            await interaction.editReply({ embeds: [result] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
