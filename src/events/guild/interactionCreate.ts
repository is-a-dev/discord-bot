import Event from "../../classes/Event";
import ExtendedClient from "../../classes/ExtendedClient";
import { ColorResolvable, CommandInteraction, Interaction } from "discord.js";

import autocompleteHandler from "../../util/interaction/autocomplete";
import commandHandler from "../../util/interaction/command";

const event: Event = {
    name: "interactionCreate",
    once: false,
    async execute(client: ExtendedClient, Discord: typeof import("discord.js"), interaction: Interaction) {
        try {
            if (!interaction.guild || interaction.guild.id !== client.config.guild) {
                const embed = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(
                        `${client.config.emojis.cross} Commands may only be used in the **is-a.dev** server.`,
                    );

                await (interaction as CommandInteraction).reply({
                    embeds: [embed],
                    flags: Discord.MessageFlags.Ephemeral,
                });
                return;
            }

            if (interaction.isAutocomplete()) return await autocompleteHandler(client, interaction);
            if (interaction.isChatInputCommand()) return await commandHandler(client, Discord, interaction);
        } catch (err) {
            client.logError(err);
        }
    },
};

export = event;
