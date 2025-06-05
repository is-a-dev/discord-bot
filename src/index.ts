import "dotenv/config";

import Discord from "discord.js";
import fs from "fs";
import { QuickDB } from "quick.db";

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    integrations: [nodeProfilingIntegration()]
});

import ExtendedClient from "./classes/ExtendedClient";

const client = new ExtendedClient({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent
    ],
    presence: {
        activities: [
            {
                name: "over is-a.dev",
                type: Discord.ActivityType.Watching
            }
        ],
        status: "online"
    }
});

// Error handling
client.logError = function (err: Error) {
    Sentry.captureException(err);
    console.error(err);
};

process.on("unhandledRejection", (err: Error) => client.logError(err));

// Quick.db Database
if (!fs.existsSync("data")) fs.mkdirSync("data");
client.db = new QuickDB({ filePath: "data/db.sqlite" });

client.config = require("../config.json");
client.commands = new Discord.Collection();
client.events = new Discord.Collection();

import { loadHandlers } from "./util/functions";
loadHandlers(client);

client.login(process.env.TOKEN);
