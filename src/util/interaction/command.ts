import ExtendedClient from "../../classes/ExtendedClient";
import { ColorResolvable, CommandInteraction, MessageFlags } from "discord.js";

import Command from "../../classes/Command";

import { emojis as emoji } from "../../../config.json";

const cooldowns = new Map();

export = async (client: ExtendedClient, Discord: typeof import("discord.js"), interaction: CommandInteraction) => {
    try {
        const command: Command = client.commands.get(interaction.commandName);

        if (!command) return;

        if (!command.enabled) {
            const disabled = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.error as ColorResolvable)
                .setDescription(`${emoji.cross} This command has been disabled!`);

            await interaction.reply({ embeds: [disabled], flags: MessageFlags.Ephemeral });
            return;
        }

        const member = interaction.guild?.members.cache.get(interaction.user.id);

        if (command.requiredRoles.length && !member?.roles.cache.has(client.config.roles.owner)) {
            let permitted = false;

            for (const role of command.requiredRoles) {
                const roleId = client.config.roles[role];
                if (!roleId) continue;

                if (member?.roles.cache.has(roleId)) {
                    permitted = true;
                    break;
                }
            }

            if (!permitted) {
                const noPerms = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(
                        `${emoji.cross} You must have one of the following roles to use this command: <@&${command.requiredRoles.map((role) => client.config.roles[role]).join(">, <@&")}>`,
                    );

                await interaction.reply({ embeds: [noPerms], flags: MessageFlags.Ephemeral });
                return;
            }
        }

        const validPermissions = client.validPermissions;

        if (command.botPermissions.length) {
            const invalidPerms = [];

            for (const perm of command.botPermissions as any) {
                if (!validPermissions.includes(perm)) return;

                if (!interaction.guild?.members.me?.permissions.has(perm)) invalidPerms.push(perm);
            }

            if (invalidPerms.length) {
                const permError = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`I am missing these permissions: \`${invalidPerms.join("`, `")}\``);

                await interaction.reply({ embeds: [permError], flags: MessageFlags.Ephemeral });
                return;
            }
        }

        command.deferReply
            ? command.ephemeral
                ? await interaction.deferReply({ flags: MessageFlags.Ephemeral })
                : await interaction.deferReply()
            : null;

        if (
            member?.roles.cache.has(client.config.roles.owner) ||
            member?.roles.cache.has(client.config.roles.maintainer)
        ) {
            // Log interaction to console
            console.log(
                `[interactionCreate] [command] ${interaction.user.tag} (${interaction.user.id}): /${interaction.commandName} ${interaction.options.data.map((option: any) => (option.value ? `${option.name}:${option.value}` : option.name)).join(" ")}`,
            );

            try {
                await command.execute(interaction, client, Discord);
                return;
            } catch (err) {
                client.logError(err);

                const error = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} There was an error while executing that command!`);

                command.deferReply
                    ? await interaction.editReply({ embeds: [error] })
                    : await interaction.reply({ embeds: [error], flags: MessageFlags.Ephemeral });
                return;
            }
        }

        if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Discord.Collection());

        const currentTime = Date.now();
        const timeStamps = cooldowns.get(command.name);
        const cooldownAmount = command.cooldown * 1000;

        if (timeStamps.has(interaction.user.id)) {
            const expirationTime = timeStamps.get(interaction.user.id) + cooldownAmount;

            if (currentTime < expirationTime) {
                const timeLeft: string = ((expirationTime - currentTime) / 1000).toFixed(0).toString();

                const cooldown = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(
                        `⏰ Please wait ${timeLeft} second${timeLeft === "1" ? "" : "s"} before running that command again!`,
                    );

                command.deferReply
                    ? await interaction.editReply({ embeds: [cooldown] })
                    : await interaction.reply({ embeds: [cooldown], flags: MessageFlags.Ephemeral });
                return;
            }
        }

        timeStamps.set(interaction.user.id, currentTime);

        setTimeout(() => {
            timeStamps.delete(interaction.user.id);
        }, cooldownAmount);

        try {
            // Log interaction to console
            console.log(
                `[interactionCreate] [command] ${interaction.user.tag} (${interaction.user.id}): /${interaction.commandName} ${interaction.options.data.map((option: any) => (option.value ? `${option.name}:${option.value}` : option.name)).join(" ")}`,
            );

            await command.execute(interaction, client, Discord);
        } catch (err) {
            client.logError(err);

            const error = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.error as ColorResolvable)
                .setDescription(`${emoji.cross} There was an error while executing that command!`);

            command.deferReply
                ? await interaction.editReply({ embeds: [error] })
                : await interaction.reply({ embeds: [error], flags: MessageFlags.Ephemeral });
        }
    } catch (err) {
        client.logError(err);
    }
};
