import ExtendedClient from "../classes/ExtendedClient";

import fs from "fs";

export = async (client: ExtendedClient, Discord: typeof import("discord.js")) => {
    const files = fs.readdirSync("./dist/events").filter((file: string) => file.endsWith(".js"));

    for (const file of files) {
        const event = require(`../events/${file}`);
        client.events.set(event.name, event);

        console.log(`Loaded Event: ${event.name}`);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(client, Discord, ...args));
        } else {
            client.on(event.name, (...args) => event.execute(client, Discord, ...args));
        }
    }
};
