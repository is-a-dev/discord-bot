import {
    ApplicationCommandOption,
    ApplicationCommandType,
    ApplicationIntegrationType,
    InteractionContextType,
    PermissionResolvable,
    PermissionsBitField
} from "discord.js";

import { roles } from "../../config.json";

type Role = keyof typeof roles;

export default class Command {
    public type?: ApplicationCommandType;
    public name: string;
    public description: string;
    public options?: (ApplicationCommandOption & { nameLocalized?: string; descriptionLocalized?: string })[];
    public default_member_permissions?: Readonly<PermissionsBitField>;
    public integration_types?: ApplicationIntegrationType[];
    public contexts?: InteractionContextType[];
    public enabled?: boolean;
    public botPermissions?: PermissionResolvable[] = [];
    public permittedRoles?: Role[] = [];
    public cooldown?: number;
    public deferReply?: boolean;
    public ephemeral?: boolean;
    public ownerOnly?: boolean;
    public execute: Function;
    public autocomplete?: Function;
}
