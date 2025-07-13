import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import { ChatInputCommandInteraction, ColorResolvable } from "discord.js";

import { emojis as emoji } from "../../../config.json";
import fs from "fs";
import { getDirs } from "../../util/functions";

const command: Command = {
    name: "help",
    description: "Displays a list of all my commands.",
    options: [
        {
            type: 3,
            name: "command",
            description: "Get info on a specific command."
        }
    ],
    cooldown: 5,
    execute: async (
        interaction: ChatInputCommandInteraction,
        client: ExtendedClient,
        Discord: typeof import("discord.js")
    ) => {
        try {
            const cmd = (interaction.options.get("command")?.value as string)?.toLowerCase();

            const commands: Command[] = [];

            async function pushCommands(path: string) {
                const files = fs.readdirSync(path).filter((file) => file.endsWith(".js"));

                for (const file of files) {
                    const command = require(`${path.replace("./dist", "../../")}/${file}`);

                    if (command.name && command.enabled) {
                        commands.push(command);
                    }
                }
            }

            if (!cmd) {
                await pushCommands("./dist/commands");
                for (const dir of await getDirs("./dist/commands")) {
                    await pushCommands(`./dist/commands/${dir}`);
                }
            }

            const cmds = [];

            for (const cmd of commands) {
                cmds.push(`</${cmd.name}:${client.commandIds.get(cmd.name)}>\n${emoji.reply} ${cmd.description}`);
            }

            const help = new Discord.EmbedBuilder()
                .setColor(client.config.embeds.default as ColorResolvable)
                .setThumbnail(client.user.displayAvatarURL({ extension: "png", forceStatic: false }))
                .setTitle("Commands")
                .setDescription(cmds.sort().join("\n"))
                .setTimestamp();

            if (cmd) {
                const command = client.commands.get(cmd);

                if (!command || !command.enabled) {
                    const noCommand = new Discord.EmbedBuilder()
                        .setColor(client.config.embeds.error as ColorResolvable)
                        .setDescription(`${emoji.cross} No command found with the name \`${cmd}\`.`);

                    await interaction.editReply({ embeds: [noCommand] });
                    return;
                }

                const botPermissions = command.botPermissions.length
                    ? `\`${command.botPermissions.join("`, `")}\``
                    : "*N/A*";
                const cooldown = command.cooldown
                    ? `${command.cooldown} second${command.cooldown === 1 ? "" : "s"}`
                    : "None";

                const commandHelp = new Discord.EmbedBuilder()
                    .setColor(client.config.embeds.default as ColorResolvable)
                    .setTitle(`Command: ${command.name}`)
                    .addFields(
                        { name: "Description", value: command.description },
                        { name: "Cooldown", value: cooldown },
                        { name: "Bot Permissions", value: botPermissions }
                    )
                    .setTimestamp();

                await interaction.editReply({ embeds: [commandHelp] });
                return;
            }

            await interaction.editReply({ embeds: [help] });
        } catch (err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
};

export = command;
