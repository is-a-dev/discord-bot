import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { AutocompleteInteraction, ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import axios from "axios";
import { emojis as emoji } from "../../../config.json";

const command: Command = {
    name: "whois",
    description: "Run a WHOIS lookup on an is-a.dev subdomain.",
    options: [
        {
            type: 3,
            name: "subdomain",
            description: "The subdomain you want to find information about.",
            max_length: 253 - ".is-a.dev".length,
            required: true,
            autocomplete: true
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

            const res = (await axios.get("https://raw.is-a.dev/v2.json")).data;
            const data = res.find((entry: any) => entry.subdomain === subdomain);

            if (!data) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` does not exist.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const whoisResult = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setAuthor({
                    name: data.owner.username,
                    iconURL: `https://github.com/${data.owner.username}.png`,
                    url: `https://github.com/${data.owner.username}`
                })
                .setTitle(`${subdomain}.is-a.dev`)
                .setTimestamp();

            if (!data.internal && !data.reserved) {
                if (!subdomain.includes("_")) {
                    whoisResult.setURL(`https://${subdomain}.is-a.dev`);
                }

                const owner = [];
                const records = [];
                const redirectConfig = [];

                if (data.owner) {
                    for (const [key, value] of Object.entries(data.owner)) {
                        if (key !== "username") {
                            owner.push(`${key}: \`${value}\``);
                        }
                    }
                }

                if (owner.length > 0) {
                    whoisResult.addFields({ name: "Owner Information", value: owner.join("\n") });
                }

                for (const key of Object.keys(data.records).sort()) {
                    switch (key) {
                        case "A":
                        case "AAAA":
                        case "MX":
                        case "NS":
                            records.push(`**${key}**: \`${data.records[key].join("`, `")}\``);
                            break;
                        case "CAA":
                            records.push(
                                `**${key}**: \`${data.records.CAA.map(
                                    (entry: any) => `${entry.flag} ${entry.tag} "${entry.value}"`
                                ).join("`, `")}\``
                            );
                            break;
                        case "DS":
                            records.push(
                                `**${key}**: \`${data.records.DS.map(
                                    (entry: any) =>
                                        `${entry.key_tag} ${entry.algorithm} ${entry.digest_type} ${entry.digest}`
                                ).join("`, `")}\``
                            );
                            break;
                        case "SRV":
                            records.push(
                                `**${key}**: \`${data.records.SRV.map(
                                    (entry: any) => `${entry.priority} ${entry.weight} ${entry.port} ${entry.target}`
                                ).join("`, `")}\``
                            );
                            break;
                        case "TXT":
                            const txtRecords = Array.isArray(data.records.TXT)
                                ? (data.records.TXT as string[])
                                : [data.records.TXT as string];
                            records.push(`**${key}**: \`${txtRecords.join("`, `")}\``);
                            break;
                        case "URL":
                            records.push(`**${key}**: ${data.records.URL}`);
                            redirectConfig.push(
                                `Redirect Paths: ${data?.redirect_config?.redirect_paths ? emoji.tick : emoji.cross}`
                            );
                            break;
                        default:
                            if (Array.isArray(data.records[key])) {
                                const recordsToPush = [];

                                for (const record of data.records[key]) {
                                    if (typeof record === "string") {
                                        records.push(`**${key}**: \`${record}\``);
                                    } else {
                                        recordsToPush.push(
                                            `\`${Object.entries(record)
                                                .map(([k, v]) => `${k}: ${v}`)
                                                .join(", ")}\``
                                        ); // `key1: value1, key2: value2`
                                    }
                                }

                                if (recordsToPush.length > 0) {
                                    records.push(`**${key}**: ${recordsToPush.join(", ")}`);
                                }
                            } else {
                                records.push(`**${key}**: \`${data.records[key]}\``);
                            }
                            break;
                    }
                }

                if (records.length > 0 && !data.reserved && !data.internal) {
                    whoisResult.setDescription(`**DNS Records**\n\n${records.join("\n")}`);
                }

                if (data?.redirect_config?.custom_paths) {
                    redirectConfig.push(
                        `Custom Paths: \n${Object.entries(data.redirect_config.custom_paths)
                            .map(([path, url]) => `- **\`${path}\`**: ${url}`)
                            .join("\n")}`
                    );
                }

                if (data.records.A || data.records.AAAA || data.records.CNAME) {
                    whoisResult.addFields({
                        name: "Proxied",
                        value: data.proxied ? emoji.tick : emoji.cross,
                        inline: true
                    });
                }

                if (redirectConfig.length > 0) {
                    whoisResult.addFields({
                        name: "Redirect Config",
                        value: redirectConfig.join("\n"),
                        inline: true
                    });
                }
            } else {
                if (data.internal) {
                    whoisResult.addFields({
                        name: "Status",
                        value: "Internal Use",
                        inline: true
                    });
                } else if (data.reserved) {
                    whoisResult.addFields({
                        name: "Status",
                        value: "Reserved",
                        inline: true
                    });
                }
            }

            await interaction.editReply({ embeds: [whoisResult] });
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
            const filteredSubdomains = res.filter((entry: any) => entry.subdomain.startsWith(option.value));

            // Map subdomains to choices
            const choices = filteredSubdomains
                .map((entry: any) => {
                    return {
                        name: entry.subdomain,
                        value: entry.subdomain
                    };
                })
                .slice(0, 25);

            await interaction.respond(choices);
        }
    }
};

export = command;
