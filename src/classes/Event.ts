import { ClientEvents, Events } from "discord.js";

export class ClientEvent {
    public name: keyof ClientEvents;
    public once: boolean;
    public execute: Function;
}

export class GuildEvent {
    public name: keyof typeof Events;
    public once: boolean;
    public execute: Function;
}
