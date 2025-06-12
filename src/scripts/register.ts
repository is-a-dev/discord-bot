import ExtendedClient from "../classes/ExtendedClient";
import { REST, Routes } from "discord.js";

import fs from "fs";
import { getDirs } from "../util/functions";

export default async function (client: ExtendedClient, guildId: string) {
    const commands: any[] = [];

    const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

    loadCommands("./dist/commands");
    (await getDirs("./dist/commands")).forEach((dir) => loadCommands(`./dist/commands/${dir}`));

    (async () => {
        try {
            console.log("Registering guild commands...");

            const applicationCommands: any = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                {
                    body: commands
                }
            );

            for (const command of applicationCommands) {
                client.commandIds.set(command.name, command.id);
            }

            console.log("Registered guild commands!");
        } catch (err) {
            client.logError(err);
        }
    })();

    function loadCommands(path: string) {
        const files = fs.readdirSync(path).filter((file) => file.endsWith(".js"));

        for (const file of files) {
            const command = require(`${path.replace("./dist", "..")}/${file}`);

            if (command.enabled) {
                if (!command.type) command.type = 1; // Default to CHAT_INPUT
                if (!command.integration_types) command.integration_types = [0]; // Default to GUILD_INSTALL
                if (!command.contexts) command.contexts = [0]; // Default to GUILD

                commands.push(command);
            }
        }
    }
}
