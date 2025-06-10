import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { AutocompleteInteraction, ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { emojis as emoji } from "../../../config.json";
import { getUser, getUserEmails } from "../../lib/github";

const command: Command = {
    name: "github",
    description: "Connect & manage your GitHub account.",
    options: [
        {
            type: 1,
            name: "account",
            description: "Get information about your GitHub account connection."
        },
        {
            type: 1,
            name: "change-email",
            description: "Change the email used for your GitHub account connection.",
            options: [
                {
                    type: 3,
                    name: "email",
                    description: "The email you want to use for your GitHub account connection.",
                    required: true,
                    autocomplete: true
                }
            ]
        },
        {
            type: 1,
            name: "login",
            description: "Connect your GitHub account."
        },
        {
            type: 1,
            name: "logout",
            description: "Disconnect your GitHub account."
        }
    ],
    cooldown: 5,
    ephemeral: true,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === "account") {
                let data = await client.db.get(`github_connections.${interaction.user.id}`);

                if (!data) {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You do not have a connected GitHub account.`);

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                const user = await getUser(data.token);

                if (!user) {
                    await client.db.delete(`github_connections.${interaction.user.id}`);

                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You have been logged out. Please reconnect your account.`);

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                const emails = await getUserEmails(data.token);

                let emailToUse = data.email.toLowerCase();

                if (!emails.some((e) => e.email.toLowerCase() === data.email.toLowerCase())) {
                    emailToUse = emails.find((e) => e.primary).email.toLowerCase();
                }

                const updatedData = {
                    id: user.id,
                    username: user.username,
                    email: emailToUse,
                    avatar: user.avatar,
                    token: data.token,
                    createdAt: data.createdAt,
                    updatedAt: new Date()
                };

                if (
                    user.id !== data.id ||
                    user.username !== data.username ||
                    emailToUse !== data.email.toLowerCase() ||
                    user.avatar !== data.avatar
                ) {
                    await client.db.set(`github_connections.${interaction.user.id}`, updatedData);
                    data = updatedData;
                }

                const accountInfo = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setThumbnail(data.avatar)
                    .setTitle("GitHub Account")
                    .addFields(
                        { name: "ID", value: `\`${data.id}\``, inline: true },
                        { name: "Username", value: data.username, inline: true },
                        { name: "Selected Email", value: data.email },
                        {
                            name: "Connected / Updated",
                            value: `<t:${Math.floor(
                                new Date(data.createdAt as Date).getTime() / 1000
                            )}:R> **/** <t:${Math.floor(new Date(data.updatedAt as Date).getTime() / 1000)}:R>`
                        }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [accountInfo] });
                return;
            }

            if (subcommand === "change-email") {
                const email = (interaction.options.get("email").value as string).toLowerCase();

                let data = await client.db.get(`github_connections.${interaction.user.id}`);

                if (!data) {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You do not have a connected GitHub account.`);

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                const user = await getUser(data.token);

                if (!user) {
                    await client.db.delete(`github_connections.${interaction.user.id}`);

                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You have been logged out. Please reconnect your account.`);

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                const emails = await getUserEmails(data.token);
                const emailExists = emails.some((e) => e.email.toLowerCase() === email);

                if (email.toLowerCase() === data.email.toLowerCase()) {
                    if (emailExists) {
                        const error = new Discord.EmbedBuilder()
                            .setColor(client.config.embeds.error as ColorResolvable)
                            .setDescription(`${emoji.cross} \`${email}\` is already your selected email.`);

                        await interaction.editReply({ embeds: [error] });
                        return;
                    } else {
                        const primaryEmail = emails.find((e) => e.primary).email.toLowerCase();

                        const updatedData = {
                            id: user.id,
                            username: user.username,
                            email: primaryEmail,
                            avatar: user.avatar,
                            token: data.token,
                            createdAt: data.createdAt,
                            updatedAt: new Date()
                        };

                        await client.db.set(`github_connections.${interaction.user.id}`, updatedData);

                        const error = new Discord.EmbedBuilder()
                            .setColor(client.config.embeds.error as ColorResolvable)
                            .setDescription(
                                `${emoji.cross} \`${email}\` is no longer a verified email on your GitHub account. Your selected email has been updated to your primary email (\`${primaryEmail}\`).`
                            );

                        await interaction.editReply({ embeds: [error] });
                        return;
                    }
                }

                if (!emailExists) {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} \`${email}\` is not a verified email on your GitHub account.`);

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                const updatedData = {
                    id: user.id,
                    username: user.username,
                    email,
                    avatar: user.avatar,
                    token: data.token,
                    createdAt: data.createdAt,
                    updatedAt: new Date()
                };

                await client.db.set(`github_connections.${interaction.user.id}`, updatedData);
                data = updatedData;

                const success = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setDescription(`${emoji.tick} Changed your selected email to \`${email}\`.`);

                await interaction.editReply({ embeds: [success] });
                return;
            }

            if (subcommand === "login") {
                const data = await client.db.get(`github_connections.${interaction.user.id}`);

                userExists: if (data) {
                    const user = await getUser(data.token);

                    if (!user) {
                        await client.db.delete(`github_connections.${interaction.user.id}`);
                        break userExists;
                    }

                    const emails = await getUserEmails(data.token);
                    let emailToUse = data.email.toLowerCase();

                    if (!emails.some((e) => e.email.toLowerCase() === data.email.toLowerCase())) {
                        emailToUse = emails.find((e) => e.primary).email.toLowerCase();
                    }

                    const newData = {
                        id: user.id,
                        username: user.username,
                        email: emailToUse,
                        avatar: user.avatar,
                        token: data.token,
                        createdAt: data.createdAt,
                        updatedAt: new Date()
                    };

                    if (
                        user.id !== data.id ||
                        user.username !== data.username ||
                        emailToUse !== data.email.toLowerCase() ||
                        user.avatar !== data.avatar
                    ) {
                        await client.db.set(`github_connections.${interaction.user.id}`, newData);
                    }

                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You are already connected to GitHub.`);

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                const auth = createOAuthDeviceAuth({
                    clientType: "oauth-app",
                    clientId: process.env.GITHUB_CLIENT_ID,
                    scopes: ["read:user", "user:email"],
                    async onVerification(v) {
                        const login = new Discord.EmbedBuilder()
                            .setColor(client.config.embeds.default as ColorResolvable)
                            .setThumbnail("https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png")
                            .setTitle("Login to GitHub")
                            .setDescription(`Open URL: ${v.verification_uri}\nEnter code: \`${v.user_code}\``);

                        await interaction.editReply({ embeds: [login] });
                    }
                });

                const tokenAuth = await auth({ type: "oauth" });

                const loadingData = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setDescription(`${emoji.ping} Authorization successful, loading your GitHub account...`);

                await interaction.editReply({ embeds: [loadingData] });

                const user = await getUser(tokenAuth.token);
                const emails = await getUserEmails(tokenAuth.token);

                const email = emails.find((e) => e.primary).email.toLowerCase();

                await client.db.set(`github_connections.${interaction.user.id}`, {
                    id: user.id,
                    username: user.username,
                    email,
                    avatar: user.avatar,
                    token: tokenAuth.token,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                const loggedIn = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setThumbnail(user.avatar)
                    .setTitle("Connected to GitHub")
                    .addFields({ name: "Username", value: user.username }, { name: "Selected Email", value: email })
                    .setTimestamp();

                await interaction.editReply({ embeds: [loggedIn] });
                return;
            }

            if (subcommand === "logout") {
                const data = await client.db.get(`github_connections.${interaction.user.id}`);

                if (!data) {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} You do not have a connected GitHub account.`);

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                await client.db.delete(`github_connections.${interaction.user.id}`);

                const loggedOut = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setDescription(`${emoji.tick} Successfully disconnected your GitHub account.`);

                await interaction.editReply({ embeds: [loggedOut] });
                return;
            }
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction, client: ExtendedClient) => {
        try {
            if (interaction.options.getSubcommand() === "change-email") {
                const option = interaction.options.getFocused(true);

                if (option.name === "email") {
                    const data = await client.db.get(`github_connections.${interaction.user.id}`);

                    if (!data) return await interaction.respond([]);

                    const user = await getUser(data.token);

                    if (!user) {
                        await client.db.delete(`github_connections.${interaction.user.id}`);
                        return await interaction.respond([]);
                    }

                    const emails = await getUserEmails(data.token);

                    const filteredEmails = emails
                        .filter((e) => e.email.toLowerCase() !== data.email.toLowerCase())
                        .filter((e) => e.email.toLowerCase().includes(option.value.toLowerCase()))
                        .sort((a, b) => a.email.localeCompare(b.email))
                        .slice(0, 25)
                        .map((e) => ({ name: e.email.toLowerCase(), value: e.email.toLowerCase() }));

                    await interaction.respond(filteredEmails);
                }
            }
        } catch (err) {
            client.logError(err);
        }
    }
};

export = command;
