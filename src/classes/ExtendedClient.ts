import { Client, Collection, PermissionResolvable, Snowflake } from "discord.js";
import { QuickDB } from "quick.db";

import Command from "./Command";
import { ClientEvent, GuildEvent } from "./Event";
import { Domain } from "../util/functions";

import config from "../../config.json";

export default class ExtendedClient extends Client {
    public commandIds: Collection<string, Snowflake>;
    public commands: Collection<string, Command>;
    public config: typeof config;
    public db: QuickDB;
    public events: Collection<string, ClientEvent | GuildEvent>;
    public logCommandError: Function;
    public logError: Function;
    public rawAPICache: Domain[];
    public rawAPICacheLastUpdated: Date;
    public validPermissions: PermissionResolvable[];
}
