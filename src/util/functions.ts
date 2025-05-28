import ExtendedClient from "../classes/ExtendedClient";

import Discord from "discord.js";
import fs from "fs";

export async function getDirs(path: string): Promise<string[]> {
    return (await fs.promises.readdir(path, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
}

export function loadHandlers(client: ExtendedClient): void {
    const handlers = fs.readdirSync("./dist/handlers").filter((file: String) => file.endsWith(".js"));

    for (const file of handlers) {
        require(`../handlers/${file}`)(client, Discord);
    }
}
