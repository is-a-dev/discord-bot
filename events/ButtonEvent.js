const ChooseDeleteDomain = require("./buttons/ChooseDeleteDomain")
const CancelDeleteDomain = require("./buttons/CancelDelete")
const ConfirmDelete = require("./buttons/ConfirmDelete")
const registerDomain = require("./buttons/registerDomain")
const RecordType = require("./buttons/RecordType")
const ConfirmRegister = require("./buttons/ConfirmRegister")
const Cancel = require("./buttons/Cancel")
const Owl = require("./buttons/Owl")
module.exports = async function (interaction) {
    if (interaction.customId === "deleteDomain") {
        await ChooseDeleteDomain(interaction);
    }
    if (interaction.customId === "cancel-del") {
        await CancelDeleteDomain(interaction);
    }
    if (interaction.customId.startsWith("del-")) {
        ConfirmDelete(interaction);
    }
    if (interaction.customId === "registerDomain") {
        await registerDomain(interaction);
    }
    if (interaction.customId === "tryagain") {
        await registerDomain(interaction);
    }
    if (interaction.customId.startsWith("register-")) {
        RecordType(interaction);
    }
    if (interaction.customId.startsWith("owl-")) {
        Owl(interaction);
    }
    if (interaction.customId.startsWith("confirm-d")) {
        ConfirmRegister(interaction);
    }
    if (interaction.customId === "cancel") {
        Cancel(interaction);
    }
}