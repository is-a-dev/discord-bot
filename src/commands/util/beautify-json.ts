import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";

const command: Command = {
    name: "beautify-json",
    description: "Beautify a JSON file.",
    options: [
        {
            type: 3,
            name: "content",
            description: "The JSON you want to beautify.",
            min_length: 3,
            max_length: 2000,
            required: true
        },
        {
            type: 10,
            name: "tab-width",
            description: "The number of spaces to use for indentation (default is 2).",
            choices: [
                { name: "2 spaces", value: 2 },
                { name: "4 spaces", value: 4 },
                { name: "8 spaces", value: 8 }
            ]
        }
    ],
    cooldown: 5,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const content = interaction.options.get("content").value as string;
            const tabWidth = (interaction.options.get("tab-width")?.value as number) || 2;

            let data;

            try {
                data = JSON.parse(content);
            } catch (err) {
                const invalidJson = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.error as ColorResolvable)
                    .setDescription(`${emoji.cross} The provided content is not valid JSON.`);

                await interaction.editReply({ embeds: [invalidJson] });
                return;
            }

            const result = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setTitle("Beautified JSON")
                .setDescription(`\`\`\`json\n${JSON.stringify(data, null, tabWidth)}\n\`\`\``)
                .setTimestamp();

            await interaction.editReply({ embeds: [result] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
