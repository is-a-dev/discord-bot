import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

const bot = require("../../../package.json");

const command: Command = {
    name: "bot",
    description: "Different information about the bot.",
    options: [],
    botPermissions: [],
    requiredRoles: [],
    cooldown: 5,
    enabled: true,
    deferReply: true,
    ephemeral: true,
    async execute(
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js"),
    ) {
        try {
            const info = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setAuthor({
                    name: client.user.tag,
                    iconURL: client.user.displayAvatarURL({ extension: "png", forceStatic: false }),
                    url: `https://discord.com/users/${client.user.id}`,
                })
                .setDescription(bot.description)
                .addFields({
                    name: "🟢 Online Since",
                    value: `<t:${(Date.now() - client.uptime).toString().slice(0, -3)}:f> (<t:${(Date.now() - client.uptime).toString().slice(0, -3)}:R>)`,
                    inline: true,
                });

            await interaction.editReply({ embeds: [info] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    },
};

export = command;
