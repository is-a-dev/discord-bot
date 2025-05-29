import ExtendedClient from "../classes/ExtendedClient";

import Discord from "discord.js";
import fs from "fs";

import axios from "axios";

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

function isPlainObject(obj: any): obj is Record<string, any> {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  if (Array.isArray(obj)) {
    return false;
  }
  
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
}

export async function fetchDomains() {
    return (await axios.get("https://raw.is-a.dev/v2.json")).data;
}

export function filterObject(obj: any, func: (k: string, v: any, obj: any) => boolean, deep: boolean = false) {
    const newObj: Record<any, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (isPlainObject(value) && deep) {
            newObj[key] = filterObject(value, func, deep);
        } else {
            if (func(key, value, obj)) {
                newObj[key] = value;
            }
        }
    }

    return newObj;
}
