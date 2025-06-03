require("dotenv").config();

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    integrations: [nodeProfilingIntegration()]
});

import Discord from "discord.js";
import ExtendedClient from "./classes/ExtendedClient";
import config from "../config.json";

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

import fs from "fs";

// Error Handling
process.on("unhandledRejection", (err: Error) => Sentry.captureException(err));

// Quick.db Database
import { QuickDB } from "quick.db";

if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
}

client.db = new QuickDB({
    filePath: "data/db.sqlite"
});

// Global variable for config
client.config = config;

// Handlers
client.commands = new Discord.Collection();
client.events = new Discord.Collection();

import { loadHandlers } from "./util/functions";
loadHandlers(client);

// Login
client.login(process.env.TOKEN);
