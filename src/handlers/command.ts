import ExtendedClient from "../classes/ExtendedClient";
import { ColorResolvable, CommandInteraction, MessageFlags } from "discord.js";

import fs from "fs";
import { getDirs } from "../util/functions";
import * as Sentry from "@sentry/node";

export = async (client: ExtendedClient) => {
    function loadCommands(path: string) {
        const files = fs.readdirSync(path).filter((file) => file.endsWith(".js"));

        for (const file of files) {
            const command = require(`${path.replace("./dist", "..")}/${file}`);

            if (!command.botPermissions) command.botPermissions = [];
            if (!command.cooldown) command.cooldown = 0;
            if (command.deferReply == null) command.deferReply = true;
            if (command.enabled == null) command.enabled = true;
            if (command.ephemeral == null) command.ephemeral = false;
            if (!command.options) command.options = [];
            if (!command.permittedRoles) command.permittedRoles = [];

            if (command.enabled) {
                client.commands.set(command.name, command);
                console.log(`Loaded Command: ${command.name}`);
            }
        }
    }

    loadCommands("./dist/commands");
    (await getDirs("./dist/commands")).forEach((dir) => loadCommands(`./dist/commands/${dir}`));

    client.logCommandError = async function (
        err: Error,
        interaction: CommandInteraction,
        Discord: typeof import("discord.js")
    ) {
        const id = Sentry.captureException(err);
        console.error(err);

        const error = new Discord.EmbedBuilder()
            .setColor(client.config.embeds.error as ColorResolvable)
            .setTitle("💥 An error occurred")
            .setDescription(`\`\`\`${err.message}\`\`\``)
            .addFields({ name: "Error ID", value: id })
            .setTimestamp();

        interaction.deferred || interaction.replied
            ? await interaction.editReply({ embeds: [error] })
            : await interaction.reply({ embeds: [error], flags: MessageFlags.Ephemeral });
    };
};
