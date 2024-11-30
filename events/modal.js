const RegisterDomain = require('./modals/RegisterDomain');
const Confirm = require('./modals/Confirm');
module.exports = async function (interaction) {
    if (interaction.customId === "regiserDomain") {
        await RegisterDomain(interaction);
    }
    if (interaction.customId.startsWith("Content-")) {
        await Confirm(interaction);
    }
}
