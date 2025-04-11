const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const loading = require("../components/loading");
const user = require("../models/user");
const staff = require("../models/staff");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("domains")
        .setDescription("View and manage your domains."),
    async execute(interaction) {
        await loading(interaction, true);
        const data = await user.findOne({ _id: interaction.user.id });
        if (!data) {
            const embed = new EmbedBuilder()
                .setDescription("You are not logged in!")
                .setColor("#0096ff");
            return await interaction.editReply({ embeds: [embed] });
        }
        const username = data.githubUsername;
        found = false;
        results = [];
        let staffresults = [];
        const maintainers = await staff.findOne({ _id: interaction.user.id });
        if (maintainers) {
            const maintainer = "is-a-dev";

            await fetch("https://raw.is-a.dev")
                .then((response) => response.json())
                .then(async (data) => {
                    for (let i = 0; i < data.length; i++) {
                        if (
                            data[i].owner.username.toLowerCase() ===
                            maintainer.toLowerCase()
                        ) {
                            staffresults.push(data[i].domain);
                        }
                    }
                });
        }
        fetch("https://raw.is-a.dev")
            .then((response) => response.json())
            .then(async (data) => {
                for (let i = 0; i < data.length; i++) {
                    if (
                        data[i].owner.username.toLowerCase() ===
                        username.toLowerCase()
                    ) {
                        results.push(data[i].domain);
                        found = true;
                    }
                }

                if (found) {
                    if (maintainers) {
                        const embed = new EmbedBuilder()
                            .setTitle("Your Domains")
                            .setDescription(results.join("\n"))
                            .addFields({
                                name: "Staff Domains",
                                value: staffresults.join("\n"),
                            })
                            .setColor("#00b0f4")
                            .setFooter({
                                text: "is-a.dev",
                                iconURL:
                                    "https://raw.githubusercontent.com/is-a-dev/register/main/media/logo.png",
                            });

                        const deleteDomain = new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger)
                            .setLabel("Delete a Domain")
                            .setCustomId("deleteDomain");
                            
                        const registerDomain = new ButtonBuilder()
                            .setStyle(ButtonStyle.Success)
                            .setLabel("Register a Domain")
                            .setCustomId("registerDomain");
                            
                        const row = new ActionRowBuilder().addComponents(deleteDomain, registerDomain);    

                        await interaction.editReply({ embeds: [embed], components: [row] });
                    } else {
                        const embed = new EmbedBuilder()
                            .setTitle("Your Domains")
                            .setDescription(results.join("\n"))
                            .setColor("#00b0f4")
                            .setFooter({
                                text: "is-a.dev",
                                iconURL:
                                    "https://raw.githubusercontent.com/is-a-dev/register/main/media/logo.png",
                            });

                            const deleteDomain = new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger)
                            .setLabel("Delete a Domain")
                            .setCustomId("deleteDomain");
                            
                        const registerDomain = new ButtonBuilder()
                            .setStyle(ButtonStyle.Success)
                            .setLabel("Register a Domain")
                            .setCustomId("registerDomain");
                            
                        const row = new ActionRowBuilder().addComponents(deleteDomain, registerDomain);    

                            
                        await interaction.editReply({ embeds: [embed], components: [row] });
                    }
                } else {
                    await interaction.editReply("You don't own any domains.");
                }
            });
    },
};
