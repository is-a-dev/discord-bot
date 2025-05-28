import ExtendedClient from "../classes/ExtendedClient";
import { ColorResolvable, CommandInteraction, MessageFlags } from "discord.js";

import fs from "fs";
import { getDirs } from "../util/functions";
import * as Sentry from "@sentry/node";

export = async (client: ExtendedClient) => {
    async function loadRoot() {
        const files = fs.readdirSync(`./dist/commands`).filter((file: String) => file.endsWith(".js"));

        for (const file of files) {
            const command = require(`../commands/${file}`);

            client.commands.set(command.name, command);

            console.log(`Loaded Command: ${command.name}`);
        }
    }

    async function loadDir(dir: String) {
        const files = fs.readdirSync(`./dist/commands/${dir}`).filter((file: String) => file.endsWith(".js"));

        for (const file of files) {
            const command = require(`../commands/${dir}/${file}`);

            client.commands.set(command.name, command);

            console.log(`Loaded Command: ${command.name}`);
        }
    }

    await loadRoot();
    (await getDirs("./dist/commands")).forEach((dir: String) => loadDir(dir));

    client.logCommandError = async function (
        err: Error,
        interaction: CommandInteraction,
        Discord: typeof import("discord.js"),
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

    require("dotenv").config();
};
