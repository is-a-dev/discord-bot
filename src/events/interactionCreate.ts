import { GuildEvent } from "../classes/Event";
import ExtendedClient from "../classes/ExtendedClient";
import { Interaction, PermissionResolvable } from "discord.js";

import autocompleteHandler from "../util/interaction/autocomplete";
import commandHandler from "../util/interaction/command";

const event: GuildEvent = {
    name: "interactionCreate",
    execute: async (client: ExtendedClient, Discord: typeof import("discord.js"), interaction: Interaction) => {
        try {
            const requiredPerms: PermissionResolvable = ["SendMessages", "EmbedLinks"];

            if (!interaction.guild || interaction.guild.id !== client.config.guild) return;
            if (!interaction.guild.members.me.permissions.has(requiredPerms)) return;

            if (interaction.isAutocomplete()) return await autocompleteHandler(client, interaction);
            if (interaction.isChatInputCommand()) return await commandHandler(client, Discord, interaction);
        } catch (err) {
            client.logError(err);
        }
    }
};

export = event;
