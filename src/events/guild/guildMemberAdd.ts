import { GuildEvent } from "../../classes/Event";
import ExtendedClient from "../../classes/ExtendedClient";
import { GuildMember, PermissionResolvable } from "discord.js";

const event: GuildEvent = {
    name: "GuildMemberAdd",
    once: false,
    async execute(client: ExtendedClient, Discord: typeof import("discord.js"), member: GuildMember) {
        try {
            const requiredPerms: PermissionResolvable = ["ManageRoles"];

            const guild = member.guild;

            if (guild.id !== client.config.guild || !guild.members.me.permissions.has(requiredPerms)) return;

            const roles = client.config.roles;

            const botRole = guild.roles.cache.get(roles.bots);
            const memberRole = guild.roles.cache.get(roles.member);

            if (!botRole) {
                console.error("Bot role not found in the guild.");
                return;
            }

            if (!memberRole) {
                console.error("Member role not found in the guild.");
                return;
            }

            if (guild.members.me.roles.highest.position <= botRole.position || guild.members.me.roles.highest.position <= memberRole.position) {
                console.error("Bot does not have permission to assign Bot/Member roles.");
                return;
            }

            const roleToAssign = member.user.bot ? botRole : memberRole;

            if (!member.roles.cache.has(roleToAssign.id)) {
                await member.roles.add(roleToAssign);
            }
        } catch (err) {
            client.logError(err);
        }
    }
}

export = event;
