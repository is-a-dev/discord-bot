import ExtendedClient from "../classes/ExtendedClient";
import { REST, Routes } from "discord.js";

import fs from "fs";
import { getDirs } from "../util/functions";
import * as Sentry from "@sentry/node";

require("dotenv").config();

export default async function (client: ExtendedClient, guildId: string) {
    const commands: any[] = [];

    const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

    // Push Slash Commands
    await pushRoot();
    (await getDirs("./dist/commands")).forEach((dir) => pushDir(dir));

    (async () => {
        try {
            console.log("Registering guild commands...");

            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });

            const applicationCommands: any = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                {
                    body: commands,
                },
            );

            for (const command of applicationCommands) {
                client.commandIds.set(command.name, command.id);
            }

            console.log("Registered guild commands!");
        } catch (err) {
            Sentry.captureException(err);
            console.error(err);

            console.error("Failed to register guild commands!");
        }
    })();

    // Slash Commands
    async function pushRoot() {
        const files = fs.readdirSync(`./dist/commands`).filter((file) => file.endsWith(".js"));

        for (const file of files) {
            const command = require(`../commands/${file}`);
            if (command.enabled) commands.push(command);
        }
    }

    async function pushDir(dir: String) {
        const files = fs.readdirSync(`./dist/commands/${dir}`).filter((file) => file.endsWith(".js"));

        for (const file of files) {
            const command = require(`../commands/${dir}/${file}`);
            if (command.enabled) commands.push(command);
        }
    }
}
