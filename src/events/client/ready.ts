import Event from "../../classes/Event";
import ExtendedClient from "../../classes/ExtendedClient";

import registerCommands from "../../scripts/register";

const event: Event = {
    name: "ready",
    once: true,
    async execute(client: ExtendedClient) {
        try {
            // Login Message
            console.log(`Logged in as: ${client.user.tag}`);

            // Register Commands
            await registerCommands(client, client.config.guild);
        } catch (err) {
            client.logError(err);
        }
    }
};

export = event;
