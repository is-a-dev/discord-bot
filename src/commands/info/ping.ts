import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable, MessageFlags } from "discord.js";

import { emojis as emoji } from "../../../config.json";

const command: Command = {
    name: "ping",
    description: "Check the bot's latency.",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [],
    default_member_permissions: null,
    botPermissions: [],
    requiredRoles: [],
    cooldown: 10,
    enabled: true,
    deferReply: false,
    ephemeral: true,
    async execute(
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js"),
    ) {
        try {
            // Get ping
            const botLatency = Date.now() - interaction.createdTimestamp;
            const apiLatency = Math.round(client.ws.ping);

            let botLatencyValue;
            let apiLatencyValue;

            // Set which connection emoji to use for botLatency
            if (botLatency >= 0 && botLatency <= 99) {
                botLatencyValue = `${emoji.connection_excellent} ${botLatency}ms`;
            } else if (botLatency >= 100 && botLatency <= 199) {
                botLatencyValue = `${emoji.connection_good} ${botLatency}ms`;
            } else {
                botLatencyValue = `${emoji.connection_bad} ${botLatency}ms`;
            }

            // Set which connection emoji to use for apiLatency
            if (apiLatency >= 0 && apiLatency <= 99) {
                apiLatencyValue = `${emoji.connection_excellent} ${apiLatency}ms`;
            } else if (apiLatency >= 100 && apiLatency <= 199) {
                apiLatencyValue = `${emoji.connection_good} ${apiLatency}ms`;
            } else {
                apiLatencyValue = `${emoji.connection_bad} ${apiLatency}ms`;
            }

            const ping = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .addFields(
                    { name: "Bot Latency", value: botLatencyValue, inline: true },
                    { name: "API Latency", value: apiLatencyValue, inline: true },
                );

            await interaction.reply({ embeds: [ping], flags: MessageFlags.Ephemeral });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    },
};

export = command;
