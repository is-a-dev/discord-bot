import Event from "../../classes/Event";
import ExtendedClient from "../../classes/ExtendedClient";
import { Interaction } from "discord.js";

// import autocompleteHandler from "../../util/interaction/autocomplete";
// import commandHandler from "../../util/interaction/command";

const event: Event = {
    name: "interactionCreate",
    once: false,
    async execute(client: ExtendedClient, Discord: typeof import("discord.js"), interaction: Interaction) {
        try {
            // if (!interaction.guild || interaction.guild.id !== client.config.guild) return;
            // if (interaction.isAutocomplete()) return await autocompleteHandler(client, interaction);
            // if (interaction.isChatInputCommand()) return await commandHandler(client, Discord, interaction);
        } catch (err) {
            client.logError(err);
        }
    }
};

export = event;
