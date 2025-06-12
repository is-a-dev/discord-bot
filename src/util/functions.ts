import ExtendedClient from "../classes/ExtendedClient";

import Discord from "discord.js";
import axios from "axios";
import fs from "fs";

export async function cacheRawAPI(client: ExtendedClient): Promise<void> {
    try {
        const res = (await axios.get("https://raw.is-a.dev/v2.json")).data;

        client.rawAPICache = res;
        client.rawAPICacheLastUpdated = new Date();

        console.log("Raw API cache updated successfully.");
    } catch (err) {
        console.error(`Failed to update raw API cache: ${err}`);
        throw new Error(`Failed to update raw API cache: ${err}`);
    }
}

export function cap(str: string, length: number): string {
    if (str == null || str.length <= length) return str;

    return str.slice(0, length - 1) + "**\u2026**";
}

export async function getDirs(path: string): Promise<string[]> {
    return (await fs.promises.readdir(path, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
}

export async function getDomains(
    client: ExtendedClient,
    options: {
        excludeIAD?: boolean;
        excludeUnderscores?: boolean;
        excludeFlags?: ("internal" | "reserved")[];
        hasFlags?: ("internal" | "reserved")[];
        hasRecords?: ("A" | "AAAA" | "CAA" | "CNAME" | "DS" | "MX" | "NS" | "SRV" | "TLSA" | "TXT" | "URL")[];
        resultLimit?: number;
        subdomain?: string | null;
        subdomainIncludes?: string;
        username?: string | null;
    } = {
        excludeIAD: false,
        excludeUnderscores: false,
        excludeFlags: [],
        hasFlags: [],
        hasRecords: [],
        resultLimit: 0,
        subdomain: null,
        subdomainIncludes: "",
        username: null
    }
): Promise<Domain[]> {
    const {
        excludeIAD,
        excludeUnderscores,
        excludeFlags,
        hasFlags,
        hasRecords,
        resultLimit,
        subdomain,
        subdomainIncludes,
        username
    } = options;

    if (
        !client.rawAPICache ||
        !client.rawAPICacheLastUpdated ||
        Date.now() - client.rawAPICacheLastUpdated.getTime() > 5 * 60 * 1000
    ) {
        try {
            await cacheRawAPI(client);
        } catch (err) {
            throw new Error(`Failed to cache raw API: ${err}`);
        }
    }

    if (excludeFlags?.length > 0 && hasFlags?.length > 0) {
        const commonFlags = excludeFlags.filter((flag) => hasFlags.includes(flag));
        if (commonFlags.length > 0) {
            throw new Error(`Cannot use both excludeFlags and hasFlags with the same flags: ${commonFlags.join(", ")}`);
        }
    }

    const results = client.rawAPICache.filter((entry: Domain) => {
        if (excludeIAD && entry.owner.username === "is-a-dev") return false;
        if (excludeUnderscores && entry.subdomain.includes("_")) return false;
        if (excludeFlags?.length > 0 && excludeFlags?.some((flag) => entry[flag])) return false;
        if (hasFlags?.length > 0 && !hasFlags?.every((flag) => entry[flag])) return false;
        if (hasRecords?.length > 0 && !hasRecords?.some((record) => entry.records[record])) return false;
        if (subdomain && entry.subdomain.toLowerCase() !== subdomain.toLowerCase()) return false;
        if (subdomainIncludes && !entry.subdomain.toLowerCase().includes(subdomainIncludes.toLowerCase())) return false;
        if (username && entry.owner.username.toLowerCase() !== username.toLowerCase()) return false;
        return true;
    });

    return resultLimit <= 0 ? results : results.slice(0, resultLimit);
}

export async function getUsernames(
    client: ExtendedClient,
    options: { usernameIncludes: string; resultLimit: number } = { usernameIncludes: "", resultLimit: 0 }
): Promise<string[]> {
    const { usernameIncludes, resultLimit } = options;

    if (
        !client.rawAPICache ||
        !client.rawAPICacheLastUpdated ||
        Date.now() - client.rawAPICacheLastUpdated.getTime() > 5 * 60 * 1000
    ) {
        try {
            await cacheRawAPI(client);
        } catch (err) {
            throw new Error(`Failed to cache raw API: ${err}`);
        }
    }

    const results = Array.from(new Set(client.rawAPICache.map((entry: Domain) => entry.owner.username.toLowerCase())))
        .sort()
        .filter((username) => {
            if (usernameIncludes && !username.includes(usernameIncludes.toLowerCase())) return false;
            return true;
        });

    return resultLimit <= 0 ? results : results.slice(0, resultLimit);
}

export function loadHandlers(client: ExtendedClient): void {
    const handlers = fs.readdirSync("./dist/handlers").filter((file: String) => file.endsWith(".js"));

    for (const file of handlers) {
        require(`../handlers/${file}`)(client, Discord);
    }
}

export function processGitHubMarkdown(content: string): string {
    content = content.trim();
    content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, text, url) => `[${text}](${url})`);
    content = content.replace(/<!--[\s\S]*?-->/g, "");
    content = content.replace(/<[^>]+>/g, "");
    content = content.replace(/```[\s\S]*?```/g, (match) => {
        const codeContent = match.replace(/```/g, "").trim();
        return `\`${codeContent}\``;
    });
    content = content.replace(/`([^`]+)`/g, (match, code) => `\`${code}\``);
    content = content.replace(/\[x\]/g, "✅").replace(/\[ \]/g, "❌");

    return content;
}

export type Domain = {
    domain: string;
    subdomain: string;
    owner: {
        username: string;
    };
    records: RecordsObject;
    redirect_config: {
        custom_paths?: object;
        redirect_paths?: boolean;
    };
    proxied?: boolean;
    internal?: boolean;
    reserved?: boolean;
};

export type RecordsObject = {
    A?: string[];
    AAAA?: string[];
    CAA?: {
        flags: number;
        tag: "issue" | "issuewild" | "iodef";
        value: string;
    }[];
    CNAME?: string;
    DS?: {
        key_tag: number;
        algorithm: number;
        digest_type: number;
        digest: string;
    }[];
    MX?: string[] | { priority: number; value: string }[];
    NS?: string[];
    SRV?: {
        priority: number;
        weight: number;
        port: number;
        target: string;
    }[];
    TLSA?: {
        usage: number;
        selector: number;
        matching_type: number;
        data: string;
    }[];
    TXT?: string | string[];
    URL?: URL;
};
