const {
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    MessageSelectMenu,
} = require("discord.js");

const fetch = require("node-fetch");
const User = require("../models/user.js");
const Maintainers = require("../models/maintainers.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete a domain."),
    async execute(interaction) {
        const githubUser = await User.findOne({ userid: interaction.user.id });

        if (!githubUser) {
            await interaction.reply("You are not logged in!");
            return;
        }

        const username = githubUser.githubid;

        fetch("https://raw-api.is-a.dev")
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
                    await interaction.reply("You don't own any domains");
                    return;
                } else {
                    // Create a select menu
                    const select = new StringSelectMenuBuilder()
                        .setCustomId("delete")
                        .setPlaceholder("Choose a domain to delete!")
                        .addOptions(results);

                    const row = new ActionRowBuilder().addComponents(select);

                    // Create the text input components
                    await interaction.reply({
                        content: "Choose the domian you want to delete",
                        components: [row],
                        ephemeral: true,
                    });
                }
            });
    },
};
