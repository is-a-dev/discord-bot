import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import axios from "axios";
import { emojis as emoji } from "../../../config.json";

const command: Command = {
    name: "random-website",
    description: "Visit a random is-a.dev website.",
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
            const res = (await axios.get("https://raw.is-a.dev/v2.json")).data;
            const data = res
                .filter((entry: any) => entry.owner.username !== "is-a-dev" && !entry.reserved && !entry.internal)
                .filter((entry: any) => entry.records.A || entry.records.AAAA || entry.records.CNAME)
                .filter((entry: any) => !entry.subdomain.startsWith("_"))
                .sort(() => Math.random() - 0.5);

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
