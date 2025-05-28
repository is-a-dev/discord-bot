import { Snowflake } from "discord.js";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            CLIENT_ID: Snowflake;
            SENTRY_DSN: string;
            TOKEN: string;
        }
    }
}

export {};
