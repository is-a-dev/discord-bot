import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { AutocompleteInteraction, ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import axios from "axios";
import { emojis as emoji } from "../../../config.json";

const command: Command = {
    name: "redirect-config",
    description: "Get a is-a.dev subdomain's redirect configuration.",
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
        {
            type: 3,
            name: "subdomain",
            description: "The subdomain you want to find the redirect configuration for.",
            max_length: 253 - ".is-a.dev".length,
            required: true,
            autocomplete: true,
        },
    ],
    default_member_permissions: null,
    botPermissions: [],
    requiredRoles: [],
    cooldown: 5,
    enabled: true,
    deferReply: true,
    ephemeral: false,
    async execute(
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js"),
    ) {
        try {
            const subdomain = interaction.options.get("subdomain").value;

            const res = (await axios.get("https://raw.is-a.dev/v2.json")).data;
            const subdomainData = res.find((entry: any) => entry.subdomain === subdomain);

            if (!subdomainData) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` does not exist.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            if (!subdomainData.records.URL && !subdomainData?.redirect_config?.custom_paths) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` does not have any URL configurations.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const urlRecord = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle(`${subdomain}.is-a.dev`);

            if (subdomainData.records.URL) {
                urlRecord.setDescription(`${subdomainData.records.URL}`);
                urlRecord.addFields({
                    name: "Redirect Paths",
                    value: subdomainData?.redirect_config?.redirect_paths ? emoji.tick : emoji.cross,
                });
            }

            if (subdomainData?.redirect_config?.custom_paths) {
                urlRecord.addFields({
                    name: "Custom Paths",
                    value: Object.entries(subdomainData.redirect_config.custom_paths)
                        .map(([path, url]) => `\`${path}\`: ${url}`)
                        .join("\n"),
                });
            }

            await interaction.editReply({ embeds: [urlRecord] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction, client: ExtendedClient) => {
        const option = interaction.options.getFocused(true);

        if (option.name === "subdomain") {
            // Fetch all subdomains
            const res = (await axios.get("https://raw.is-a.dev/v2.json")).data;

            // Filter subdomains
            const filteredSubdomains = res.filter(
                (entry: any) =>
                    entry.subdomain.startsWith(option.value) &&
                    (entry.records.URL || entry.redirect_config?.custom_paths) &&
                    !entry.reserved &&
                    !entry.internal,
            );

            // Map subdomains to choices
            const choices = filteredSubdomains
                .map((entry: any) => {
                    return {
                        name: entry.domain,
                        value: entry.subdomain,
                    };
                })
                .slice(0, 25);

            await interaction.respond(choices);
        }
    },
};

export = command;
