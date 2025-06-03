import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { emojis as emoji } from "../../../config.json";
import { Octokit } from "@octokit/core";

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
            name: "login",
            description: "Connect your GitHub account."
        },
        {
            type: 1,
            name: "logout",
            description: "Disconnect your GitHub account."
        }
    ],
    botPermissions: [],
    permittedRoles: [],
    cooldown: 5,
    enabled: true,
    deferReply: true,
    ephemeral: true,
    async execute(
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) {
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

                const octokit = new Octokit({ auth: data.token });

                const user = await octokit.request("GET /user");
                const emails = await octokit.request("GET /user/emails");

                let emailToUse = data.email;

                if (!emails.data.some((e) => e.email === data.email)) {
                    emailToUse = emails.data.find((e) => e.primary).email;
                }

                const newData = {
                    id: user.data.id,
                    username: user.data.login,
                    email: emailToUse,
                    avatar: user.data.avatar_url,
                    token: data.token,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                };

                if (
                    !data ||
                    user.data.id !== data.id ||
                    user.data.login !== data.username ||
                    emailToUse !== data.email ||
                    user.data.avatar_url !== data.avatar
                ) {
                    data.updatedAt = new Date();
                    data = await client.db.set(`github_connections.${interaction.user.id}`, newData);
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
                            name: "Connected",
                            value: `<t:${Math.floor(new Date(data.createdAt as Date).getTime() / 1000)}:R>`
                        }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [accountInfo] });
                return;
            }

            if (subcommand === "login") {
                const data = await client.db.get(`github_connections.${interaction.user.id}`);

                if (data) {
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

                const octokit = new Octokit({ auth: tokenAuth.token });

                const user = await octokit.request("GET /user");
                const emails = await octokit.request("GET /user/emails");

                const email = emails.data.find((e) => e.primary).email;

                await client.db.set(`github_connections.${interaction.user.id}`, {
                    id: user.data.id,
                    username: user.data.login,
                    email,
                    avatar: user.data.avatar_url,
                    token: tokenAuth.token,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                const loggedIn = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setThumbnail(user.data.avatar_url)
                    .setTitle("Connected to GitHub")
                    .addFields({ name: "Username", value: user.data.login }, { name: "Selected Email", value: email })
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
    }
};

export = command;
