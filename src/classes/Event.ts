import { ClientEvents } from "discord.js";

export class ClientEvent {
    public name: keyof ClientEvents;
    public once: boolean;
    public execute: Function;
}

export class GuildEvent {
    public name: string;
    public execute: Function;
}
