import { ClientEvent } from "../../classes/Event";
import ExtendedClient from "../../classes/ExtendedClient";

import registerCommands from "../../scripts/register";

const event: ClientEvent = {
    name: "ready",
    once: true,
    async execute(client: ExtendedClient) {
        try {
            // Login Message
            console.log(`Logged in as: ${client.user.tag}`);

            // Register Commands
            await registerCommands(client, client.config.guild);

            // Assign all users the correct roles
            const guild = client.guilds.cache.get(client.config.guild);
            const roles = client.config.roles;

            if (guild) {
                console.log(`Assigning roles in ${guild.name}...`);

                const botRole = guild.roles.cache.get(roles.bots);

                if (!botRole) {
                    console.error("Bot role not found in the guild.");
                    return;
                }

                const memberRole = guild.roles.cache.get(roles.member);

                if (!memberRole) {
                    console.error("Member role not found in the guild.");
                    return;
                }

                const members = (await guild.members.fetch()).filter((member) => {
                    return (
                        (member.user.bot && !member.roles.cache.has(botRole.id)) ||
                        (!member.user.bot && !member.roles.cache.has(memberRole.id))
                    );
                });

                if (members.size === 0) {
                    console.log("No members need role assignment.");
                    return;
                }

                console.log(`Found ${members.size} members needing role assignment.`);

                const BATCH_SIZE = 20;
                const memberArray = Array.from(members.values());

                let updatedMembers = 0;

                for (let i = 0; i < memberArray.length; i += BATCH_SIZE) {
                    const batch = memberArray.slice(i, i + BATCH_SIZE);
                    await Promise.allSettled(
                        batch.map((member) => {
                            const roleToAdd = member.user.bot ? botRole : memberRole;
                            return member.roles.add(roleToAdd).then(() => updatedMembers++);
                        })
                    );
                }

                console.log(`Assigned roles to ${updatedMembers} members.`);
            }
        } catch (err) {
            client.logError(err);
        }
    }
};

export = event;
