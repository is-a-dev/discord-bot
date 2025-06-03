import { Snowflake } from "discord.js";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            CLIENT_ID: Snowflake;
            GITHUB_CLIENT_ID: string;
            SENTRY_DSN: string;
            TOKEN: string;
        }
    }
}

export {};
