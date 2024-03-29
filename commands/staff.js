const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const fetch = require("node-fetch");
const staff = require("../models/staff");
const Loading = require("../components/loading");
const DmUser = require("../components/DmUser");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("staff")
        .setDescription("Staff Stuff")
        .addUserOption((option) =>
            option
                .setName("add")
                .setDescription("Adds a user to the staff database.")
                .setRequired(false)
        )
        .addUserOption((option) =>
            option
                .setName("remove")
                .setDescription("Removes a user from the staff database.")
                .setRequired(false)
        ),
    async execute(interaction) {
        await Loading(interaction, true);
        const data = await staff.findOne({ _id: interaction.user.id });
        if (!data) {
            const embed = new EmbedBuilder()
                .setDescription("You are not staff!")
                .setColor("#0096ff");
            return await interaction.editReply({ embeds: [embed] });
        }
        const add = interaction.options.getUser("add");
        const remove = interaction.options.getUser("remove");
        if (add) {
            if (interaction.user.id !== "598245488977903688" && interaction.user.id !== "853158265466257448") {
                const embed = new EmbedBuilder()
                    .setDescription("Only Andrew Or Wily can use this command!")
                    .setColor("#0096ff");
                return await interaction.editReply({ embeds: [embed] });
            }
            const addData = await staff.findOne({ _id: add.id });
            if (addData) {
                const embed = new EmbedBuilder()
                    .setDescription("This user is already staff!")
                    .setColor("#0096ff");
                return await interaction.editReply({ embeds: [embed] });
            }
            await new staff({
                _id: add.id,
                staff: true,
            }).save();
            const embed = new EmbedBuilder()
                .setDescription(`${add.username} has been added to the staff database!`)
                .setColor("#0096ff");

            const StaffNotif = new EmbedBuilder()
                .setTitle("Staff Update")
                .setDescription(`You have been added to the staff team! You can now use all the staff commands`)

            await DmUser(interaction.client, add, StaffNotif);
            return await interaction.editReply({ embeds: [embed] });
        }
        if (remove) {
            if (interaction.user.id !== "598245488977903688" && interaction.user.id !== "853158265466257448") {
                const embed = new EmbedBuilder()
                    .setDescription("Only Andrew Or Wily can use this command!")
                    .setColor("#0096ff");
                return await interaction.editReply({ embeds: [embed] });
            }
            const removeData = await staff.findOne({ _id: remove.id });
            if (!removeData) {
                const embed = new EmbedBuilder()
                    .setDescription("This user is not staff!")
                    .setColor("#0096ff");
                return await interaction.editReply({ embeds: [embed] });
            }
            await staff.deleteOne({ _id: remove.id });
            const embed = new EmbedBuilder()
                .setDescription(`${remove.username} has been removed from the staff database!`)
                .setColor("#0096ff");
                const StaffNotif = new EmbedBuilder()
                 .setTitle("Staff Update")
                 .setDescription(`You have been removed from the staff team! You can no longer use the staff commands.`)

                await DmUser(interaction.client, remove, StaffNotif);
            return await interaction.editReply({ embeds: [embed] });
        }
        if (!add && !remove) {
            // list all staff
            const staffData = await staff.find();
            const staffArray = [];
            for (const staff of staffData) {
                staffArray.push(`<@${staff._id}>`);
            }
            const embed = new EmbedBuilder()
                .setDescription(`Staff: ${staffArray.join(", ")}`)
                .setColor("#0096ff");
            return await interaction.editReply({ embeds: [embed] });
        }
    }
};