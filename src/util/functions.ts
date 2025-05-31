import ExtendedClient from "../classes/ExtendedClient";

import Discord from "discord.js";
import axios from "axios";
import fs from "fs";

export async function getDirs(path: string): Promise<string[]> {
    return (await fs.promises.readdir(path, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
}

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

type Domain = {
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

export async function getDomains(
    excludeIAD = false,
    excludeInternal = false,
    excludeReserved = false
): Promise<Domain[]> {
    const domains: Domain[] = [];

    try {
        const res = (await axios.get("https://raw.is-a.dev/v2.json")).data;

        domains.push(
            ...res.filter((entry: Domain) => {
                if (excludeIAD && entry.owner.username === "is-a-dev") return false;
                if (excludeInternal && entry.internal) return false;
                if (excludeReserved && entry.reserved) return false;
                return true;
            })
        );
    } catch (err) {
        throw new Error(`Failed to fetch domains: ${err}`);
    }

    return domains;
}

export function loadHandlers(client: ExtendedClient): void {
    const handlers = fs.readdirSync("./dist/handlers").filter((file: String) => file.endsWith(".js"));

    for (const file of handlers) {
        require(`../handlers/${file}`)(client, Discord);
    }
}
