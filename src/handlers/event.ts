import ExtendedClient from "../classes/ExtendedClient";

import fs from "fs";
import { getDirs } from "../util/functions";
import * as Sentry from "@sentry/node";

export = async (client: ExtendedClient, Discord: typeof import("discord.js")) => {
    async function loadDir(dir: String) {
        const files = fs.readdirSync(`./dist/events/${dir}`).filter((file: String) => file.endsWith(".js"));

        for (const file of files) {
            const event = require(`../events/${dir}/${file}`);

            client.events.set(event.name, event);

            console.log(`Loaded Event: ${event.name}`);

            if (event.once) {
                client.once(event.name, (message, interaction) => event.execute(client, Discord, message, interaction));
            } else {
                client.on(event.name, (message, interaction) => event.execute(client, Discord, message, interaction));
            }
        }
    }

    (await getDirs("./dist/events")).forEach((dir: String) => loadDir(dir));

    client.logError = async function (err: Error) {
        Sentry.captureException(err);
        console.error(err);
    };

    require("dotenv").config();
};
