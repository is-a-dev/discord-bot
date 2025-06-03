import ExtendedClient from "../../classes/ExtendedClient";
import Command from "../../classes/Command";
import { AutocompleteInteraction } from "discord.js";

export = async (client: ExtendedClient, interaction: AutocompleteInteraction) => {
    try {
        const command: Command = client.commands.get(interaction.commandName);

        if (!command) return;

        if (!command.enabled || !command.autocomplete) return await interaction.respond([]);

        const member = await interaction?.guild.members.fetch(interaction.user.id);

        if (command.permittedRoles.length && !member?.roles.cache.has(client.config.roles.owner)) {
            let permitted = false;

            for (const role of command.permittedRoles) {
                const roleId = client.config.roles[role];
                if (!roleId) continue;

                if (member?.roles.cache.has(roleId)) {
                    permitted = true;
                    break;
                }
            }

            if (!permitted) {
                return await interaction.respond([]);
            }
        }

        const validPermissions = client.validPermissions;

        if (command.botPermissions.length) {
            const invalidPerms = [];

            for (const perm of command.botPermissions as any) {
                if (!validPermissions.includes(perm)) return;

                if (!interaction.guild?.members.me?.permissions.has(perm)) invalidPerms.push(perm);
            }

            if (invalidPerms.length) return await interaction.respond([]);
        }

        try {
            // Log interaction to console
            console.log(
                `[interactionCreate] [autocomplete] ${interaction.user.tag} (${interaction.user.id}): /${interaction.commandName} ${interaction.options.getFocused(true).name}${interaction.options.getFocused(true).value ? `:${interaction.options.getFocused(true).value}` : ""}`
            );

            await command.autocomplete(interaction, client);
        } catch (err) {
            client.logError(err);
        }
    } catch (err) {
        client.logError(err);
    }
};
