import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { AutocompleteInteraction, ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import axios from "axios";
import { emojis as emoji } from "../../../config.json";
import { getDomains } from "../../util/functions";

const command: Command = {
    name: "get-domain-json",
    description: "Get a subdomain's JSON file.",
    options: [
        {
            type: 3,
            name: "subdomain",
            description: "The subdomain you want to get the JSON file for.",
            max_length: 253 - ".is-a.dev".length,
            required: true,
            autocomplete: true
        }
    ],
    cooldown: 5,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const subdomain = (interaction.options.get("subdomain").value as string).toLowerCase();

            const hostnameRegex =
                /^(?=.{1,253}$)(?:(?:[_a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.)+[a-zA-Z]{2,63}$/;

            if (!hostnameRegex.test(`${subdomain}.is-a.dev`)) {
                const invalidSubdomain = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}\` is not a valid subdomain.`);

                await interaction.editReply({ embeds: [invalidSubdomain] });
                return;
            }

            const data = (
                await axios.get(`https://raw.githubusercontent.com/is-a-dev/register/main/domains/${subdomain}.json`)
            ).data;

            if (data.internal || data.reserved) {
                const internalError = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(
                        `${emoji.cross} \`${subdomain}.is-a.dev\` is an internal or reserved subdomain and cannot be accessed.`
                    );

                await interaction.editReply({ embeds: [internalError] });
                return;
            }

            if (!data) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` does not exist.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const result = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle(`${subdomain}.is-a.dev`)
                .setDescription(`\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``)
                .setTimestamp();

            await interaction.editReply({ embeds: [result] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction, client: ExtendedClient) => {
        try {
            const option = interaction.options.getFocused(true);

            if (option.name === "subdomain") {
                const choices = (
                    await getDomains(client, {
                        excludeFlags: ["internal", "reserved"],
                        resultLimit: 25,
                        subdomainIncludes: option.value
                    })
                ).map((entry: any) => {
                    return {
                        name: entry.subdomain,
                        value: entry.subdomain
                    };
                });

                await interaction.respond(choices);
            }
        } catch (err) {
            client.logError(err);
        }
    }
};

export = command;
