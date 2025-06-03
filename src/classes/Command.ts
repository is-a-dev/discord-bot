import { ApplicationCommandOptionData, PermissionResolvable, Permissions } from "discord.js";

import { roles } from "../../config.json";

type Role = keyof typeof roles;

export default class Command {
    public name: string;
    public description: string;
    public integration_types?: number[] | [0];
    public contexts?: number[] | [0];
    public options: ApplicationCommandOptionData[];
    public default_member_permissions?: Permissions | null;
    public botPermissions: PermissionResolvable[];
    public permittedRoles: Role[];
    public cooldown: number;
    public enabled: boolean;
    public deferReply: boolean;
    public ephemeral: boolean;
    public execute: Function;
    public autocomplete?: Function;
}
