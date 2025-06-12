import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { AutocompleteInteraction, ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { getDomains } from "../../util/functions";

const command: Command = {
    name: "redirect-config",
    description: "Get a is-a.dev subdomain's redirect configuration.",
    options: [
        {
            type: 3,
            name: "subdomain",
            description: "The subdomain you want to find the redirect configuration for.",
            maxLength: 253 - ".is-a.dev".length,
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

            const data = (await getDomains(client, { subdomain }))[0];

            if (!data) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` does not exist.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            if (!data.records.URL && !data?.redirect_config?.custom_paths) {
                const noResult = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} \`${subdomain}.is-a.dev\` does not have any URL configurations.`);

                await interaction.editReply({ embeds: [noResult] });
                return;
            }

            const urlRecord = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle(`${subdomain}.is-a.dev`);

            if (data.records.URL) {
                urlRecord.setDescription(`${data.records.URL}`);
                urlRecord.addFields({
                    name: "Redirect Paths",
                    value: data?.redirect_config?.redirect_paths ? emoji.tick : emoji.cross
                });
            }

            if (data?.redirect_config?.custom_paths) {
                urlRecord.addFields({
                    name: "Custom Paths",
                    value: Object.entries(data.redirect_config.custom_paths)
                        .map(([path, url]) => `\`${path}\`: ${url}`)
                        .join("\n")
                });
            }

            await interaction.editReply({ embeds: [urlRecord] });
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
                        subdomainIncludes: option.value
                    })
                )
                    .filter((entry: any) => entry.records.URL || entry.redirect_config?.custom_paths)
                    .slice(0, 25)
                    .map((entry: any) => {
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
