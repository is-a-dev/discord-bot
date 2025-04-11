const user = require("../../models/user");
const loading = require('../../components/loading');
const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = async function (interaction) {
    await loading(interaction, true);
    const data = await user.findOne({ _id: interaction.user.id });
    if (!data) {
        const embed = new EmbedBuilder()
            .setDescription("You are not logged in!")
            .setColor("#0096ff");
        return await interaction.editReply({ embeds: [embed] });
    }
    const username = data.githubUsername;
    fetch("https://raw.is-a.dev")
            .then((response) => response.json())
            .then(async (data) => {
                let found = false;
                let results = [];
                for (let i = 0; i < data.length; i++) {
                    if (
                        data[i].owner.username.toLowerCase() ===
                        username.toLowerCase()
                    ) {
                        results.push({
                            label: data[i].domain,
                            value: data[i].domain,
                        });
                        found = true;
                    }
                }
                if (!found) {
                    const sadEmbed = new EmbedBuilder()
                        .setDescription("You don't own any domains")
                        .setColor("#0096ff");
                    await interaction.editReply({ embeds: [sadEmbed] });
                    return;
                } else {
                    // Create a select menu
                    const select = new StringSelectMenuBuilder()
                        .setCustomId("delete")
                        .setPlaceholder("Choose a domain to delete!")
                        .addOptions(results);

                    const row = new ActionRowBuilder().addComponents(select);

                    const embed = new EmbedBuilder()
                        .setDescription("Choose the domain you want to delete")
                        .setColor("#0096ff");

                    // Create the text input components
                    await interaction.editReply({
                        components: [row],
                        ephemeral: true,
                        embeds: [embed]
                    });
                }
            });
}