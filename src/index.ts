require("dotenv").config();

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    integrations: [nodeProfilingIntegration()],
});

import Discord from "discord.js";
import ExtendedClient from "./classes/ExtendedClient";
import config from "../config.json";

const bot = require("../package.json");

const client = new ExtendedClient({
    intents: [],
    presence: {
        activities: [
            {
                name: `🔧 v${bot.version}`,
                type: Discord.ActivityType.Custom,
            },
        ],
        status: "online",
    },
});

// Error Handling
process.on("unhandledRejection", (err: Error) => Sentry.captureException(err));

// Global variable for config
client.config = config;

// Handlers
client.commands = new Discord.Collection();
client.events = new Discord.Collection();

import { loadHandlers } from "./util/functions";
loadHandlers(client);

// Login
client.login(process.env.TOKEN);

// Constants
client.commandIds = new Discord.Collection();

client.validPermissions = [
    "CreateInstantInvite",
    "KickMembers",
    "BanMembers",
    "Administrator",
    "ManageChannels",
    "ManageGuild",
    "AddReactions",
    "ViewAuditLog",
    "PrioritySpeaker",
    "Stream",
    "ViewChannel",
    "SendMessages",
    "SendTTSMessages",
    "ManageMessages",
    "EmbedLinks",
    "AttachFiles",
    "ReadMessageHistory",
    "MentionEveryone",
    "UseExternalEmojis",
    "ViewGuildInsights",
    "Connect",
    "Speak",
    "MuteMembers",
    "DeafenMembers",
    "MoveMembers",
    "UseVAD",
    "ChangeNickname",
    "ManageNicknames",
    "ManageRoles",
    "ManageWebhooks",
    "ManageEmojisAndStickers",
    "UseApplicationCommands",
    "RequestToSpeak",
    "ManageEvents",
    "ManageThreads",
    "CreatePublicThreads",
    "CreatePrivateThreads",
    "UseExternalStickers",
    "SendMessagesInThreads",
    "UseEmbeddedActivities",
    "ModerateMembers",
    "ViewCreatorMonetizationAnalytics",
    "UseSoundboard",
    "SendVoiceMessages",
    "SendPolls",
    "UseExternalApps",
];
