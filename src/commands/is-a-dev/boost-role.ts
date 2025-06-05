import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";

const command: Command = {
    name: "boost-role",
    description: "Create/update/delete boost roles.",
    options: [
        {
            type: 1,
            name: "create",
            description: "Create a new boost role.",
            options: [
                {
                    type: 3,
                    name: "color",
                    description: "The color of the boost role. Use hex format (e.g. #0096FF)",
                    min_length: 4,
                    max_length: 7,
                    required: true
                },
                {
                    type: 3,
                    name: "name",
                    description: "The name of the boost role.",
                    min_length: 3,
                    max_length: 32
                },
                {
                    type: 11,
                    name: "icon",
                    description: "The role icon to use for the boost role."
                }
            ]
        },
        {
            type: 1,
            name: "update",
            description: "Update your existing boost role.",
            options: [
                {
                    type: 3,
                    name: "name",
                    description: "The new name of the boost role.",
                    min_length: 3,
                    max_length: 32
                },
                {
                    type: 3,
                    name: "color",
                    description: "The new color of the boost role. Use hex format (e.g. #0096FF)",
                    min_length: 7,
                    max_length: 7
                },
                {
                    type: 11,
                    name: "icon",
                    description: "The new role icon to use for the boost role."
                }
            ]
        },
        {
            type: 1,
            name: "delete",
            description: "Delete your existing boost role."
        }
    ],
    botPermissions: ["ManageRoles"],
    permittedRoles: ["boost_role_bypass", "booster", "donator"],
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
            const subcommand = interaction.options.getSubcommand();

            const brBelow = interaction.guild.roles.cache.get(client.config.roles.boost_role_below);
            const brAbove = interaction.guild.roles.cache.get(client.config.roles.boost_role_above);

            if (!brBelow || !brAbove || brBelow?.position <= brAbove?.position) {
                const error = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} Boost roles are not set up correctly.`);

                await interaction.editReply({ embeds: [error] });
                return;
            }

            if (interaction.guild.members.me.roles.highest.position <= brBelow.position) {
                const error = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} I do not have permission to manage boost roles.`);

                await interaction.editReply({ embeds: [error] });
                return;
            }

            const member = interaction.guild.members.cache.get(interaction.user.id);
            const currentBoostRole = await client.db.get(`boost_roles.${interaction.user.id}`);

            const colorRegex = /^#([0-9A-F]{6}|[0-9A-F]{3})$/i;

            if (subcommand === "create") {
                const name = interaction.options.get("name")?.value as string || interaction.user.username;
                const color = interaction.options.get("color").value as ColorResolvable;
                const icon = interaction.options.getAttachment("icon");

                if (currentBoostRole) {
                    const existingRole = interaction.guild.roles.cache.get(currentBoostRole.role);

                    if (existingRole) {
                        const roleExists = new Discord.EmbedBuilder()
                            .setColor(client.config.embeds.error as ColorResolvable)
                            .setDescription(`${emoji.cross} You already have a boost role: ${existingRole}`);

                        await interaction.editReply({ embeds: [roleExists] });
                        return;
                    } else {
                        await client.db.delete(`boost_roles.${interaction.user.id}`);
                    }
                }

                if (!colorRegex.test(color as string)) {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} \`${color}\` is not a valid color.`);

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                // Random position between brBelow and brAbove
                // All boost roles should be above brAbove and below brBelow
                const position = Math.floor(Math.random() * (brBelow.position - brAbove.position - 1)) + brAbove.position + 1;

                const role = await interaction.guild.roles.create({
                    name,
                    color,
                    icon: icon ? icon.url : null,
                    position,
                    permissions: []
                });

                await member.roles.add(role);

                await client.db.set(`boost_roles.${interaction.user.id}`, { role: role.id });

                const created = new Discord.EmbedBuilder()
                    .setColor(color)
                    .setAuthor({ name, iconURL: role.iconURL() || undefined })
                    .setDescription(`${emoji.tick} Your boost role has been created!`);

                await interaction.editReply({ embeds: [created] });
                return;
            }

            if (subcommand === "update") {
                if (!currentBoostRole) {
                    const noRole = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You do not have a boost role to update.`);

                    await interaction.editReply({ embeds: [noRole] });
                    return;
                }

                const name = interaction.options.get("name")?.value as string | null;
                const color = interaction.options.get("color")?.value as ColorResolvable | null;
                const icon = interaction.options.getAttachment("icon");

                const role = interaction.guild.roles.cache.get(currentBoostRole.role);

                if (!role) {
                    await client.db.delete(`boost_roles.${interaction.user.id}`);

                    const noRole = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You do not have a boost role to update.`);

                    await interaction.editReply({ embeds: [noRole] });
                    return;
                }

                if (name) {
                    await role.setName(name);
                }

                if (color) {
                    if (!colorRegex.test(color as string)) {
                        const error = new Discord.EmbedBuilder()
                            .setColor(client.config.embeds.error as ColorResolvable)
                            .setDescription(`${emoji.cross} \`${color}\` is not a valid color.`);

                        await interaction.editReply({ embeds: [error] });
                        return;
                    }
                    await role.setColor(color);
                }

                if (icon) {
                    await role.setIcon(icon.url);
                }

                const updatedEmbed = new Discord.EmbedBuilder()
                    .setColor(role.color)
                    .setAuthor({ name: role.name, iconURL: role.iconURL() || undefined })
                    .setDescription(`${emoji.tick} Your boost role has been updated!`);

                await interaction.editReply({ embeds: [updatedEmbed] });
                return;
            }

            if (subcommand === "delete") {
                if (!currentBoostRole) {
                    const noRole = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You do not have a boost role to delete.`);

                    await interaction.editReply({ embeds: [noRole] });
                    return;
                }

                const role = interaction.guild.roles.cache.get(currentBoostRole.role);

                if (!role) {
                    await client.db.delete(`boost_roles.${interaction.user.id}`);

                    const noRole = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You do not have a boost role to delete.`);

                    await interaction.editReply({ embeds: [noRole] });
                    return;
                }

                await role.delete();
                await client.db.delete(`boost_roles.${interaction.user.id}`);

                const deletedEmbed = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setDescription(`${emoji.tick} Your boost role has been deleted!`);

                await interaction.editReply({ embeds: [deletedEmbed] });
                return;
            }
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
