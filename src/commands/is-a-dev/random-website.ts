import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { getDomains } from "../../util/functions";

const command: Command = {
    name: "random-website",
    description: "Visit a random is-a.dev website.",
    cooldown: 5,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const data = (
                await getDomains(client, {
                    excludeFlags: ["internal", "reserved"],
                    excludeIAD: true,
                    excludeUnderscores: true,
                    hasRecords: ["A", "AAAA", "CNAME"]
                })
            ).sort(() => Math.random() - 0.5);

            const randomIndex = Math.floor(Math.random() * data.length);
            const randomWebsite = data[randomIndex];

            if (!randomWebsite) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} There are no available websites to visit.`);
                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const random = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setThumbnail(`https://github.com/${randomWebsite.owner.username}.png`)
                .setTitle(randomWebsite.domain);

            const visitButton: any = new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder()
                    .setLabel("Visit")
                    .setStyle(Discord.ButtonStyle.Link)
                    .setURL(`https://${randomWebsite.domain}`)
            );

            await interaction.editReply({ embeds: [random], components: [visitButton] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
