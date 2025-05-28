import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import axios from "axios";
import { emojis as emoji } from "../../../config.json";

const command: Command = {
    name: "check",
    description: "Check if a subdomain is available.",
    options: [
        {
            type: 3,
            name: "subdomain",
            description: "The subdomain you want to check.",
            max_length: 244,
            required: true
        }
    ],
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
            const subdomain = interaction.options.get("subdomain").value as string;

            const hostnameRegex =
                /^(?=.{1,253}$)(?:(?:[_a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.)+[a-zA-Z]{2,63}$/;

            if (!hostnameRegex.test(`${subdomain}.is-a.dev`)) {
                const invalidSubdomain = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}\` is not a valid subdomain.`);

                await interaction.editReply({ embeds: [invalidSubdomain] });
                return;
            }

            const res = (await axios.get("https://raw.is-a.dev/v2.json")).data;
            const subdomainData = res.find((entry: any) => entry.subdomain === subdomain);

            if (!subdomainData) {
                const available = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setDescription(`${emoji.tick} \`${subdomain}.is-a.dev\` is available!`);

                const registerButton: any = new Discord.ActionRowBuilder().addComponents(
                    new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Link)
                        .setLabel("Register")
                        .setURL(`https://wdh.gg/XEMAmxc`)
                );

                await interaction.editReply({ embeds: [available], components: [registerButton] });
                return;
            } else if (subdomainData.internal) {
                const internal = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` is being used internally.`);

                await interaction.editReply({ embeds: [internal] });
                return;
            } else if (subdomainData.reserved) {
                const reserved = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` is reserved.`);

                await interaction.editReply({ embeds: [reserved] });
                return;
            } else {
                const notAvailable = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` is not available.`);

                await interaction.editReply({ embeds: [notAvailable] });
                return;
            }
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
