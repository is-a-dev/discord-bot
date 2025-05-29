import Command from "../../classes/Command";
import ExtendedClient from "../../classes/ExtendedClient";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  ColorResolvable,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { emojis as emoji } from "../../../config.json";
import { fetchDomains } from "../../util/domains";
import ms from "ms";
import { filterObject } from "../../util/functions";

const command: Command = {
  name: "generate-domain-json",
  description: "Generate a subdomain's JSON file.",
  options: [
    {
      type: 3,
      name: "subdomain",
      description: "The subdomain you want to generate the JSON for.",
      max_length: 253 - ".is-a.dev".length,
      required: true,
    },
  ],
  botPermissions: [],
  requiredRoles: [],
  cooldown: 5,
  enabled: true,
  deferReply: true,
  ephemeral: false,
  async execute(
    interaction: ChatInputCommandInteraction,
    client: ExtendedClient,
    Discord: typeof import("discord.js")
  ) {
    try {
      const subdomain = interaction.options.get("subdomain").value as string;

      const hostnameRegex =
        /^(?=.{1,253}$)(?:(?:[_a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)\.)+[a-zA-Z]{2,63}$/;

      if (!hostnameRegex.test(`${subdomain}.is-a.dev`)) {
        const invalidSubdomain = new Discord.EmbedBuilder()
          .setColor(client.config.embeds.error as ColorResolvable)
          .setDescription(
            `${emoji.cross} \`${subdomain}\` is not a valid subdomain.`
          );

        await interaction.editReply({ embeds: [invalidSubdomain] });
        return;
      }

      let domains = await fetchDomains();
      const data = domains.find((v) => v.domain === `${subdomain}.is-a.dev`);

      if (data) {
        const noResult = new Discord.EmbedBuilder()
          .setColor(client.config.embeds.error as ColorResolvable)
          .setDescription(
            `${emoji.cross} \`${subdomain}.is-a.dev\` exists already.`
          );

        await interaction.editReply({ embeds: [noResult] });
        return;
      }

      if (data && (data.internal || data.reserved)) {
        const internalError = new Discord.EmbedBuilder()
          .setColor(client.config.embeds.error as ColorResolvable)
          .setDescription(
            `${emoji.cross} \`${subdomain}.is-a.dev\` is an internal or reserved subdomain and cannot be accessed.`
          );

        await interaction.editReply({ embeds: [internalError] });
        return;
      }

      const embed = new Discord.EmbedBuilder()
        .setColor(client.config.embeds.default as ColorResolvable)
        .setTitle("Domain JSON Generation")
        .setDescription(
          `Generate your .is-a.dev domain JSON by hitting the button bellow.`
        );

      const endEmbed = new Discord.EmbedBuilder()
        .setColor(client.config.embeds.error as ColorResolvable)
        .setDescription(`${emoji.cross} Ended Generation`);

      const actions = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId("start-generation")
          .setStyle(ButtonStyle.Primary)
          .setLabel("Generate domain JSON")
      );

      const records = [
        new TextInputBuilder()
          .setCustomId("cname-record")
          .setLabel("CNAME Record")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Place your CNAME Record here")
          .setRequired(false),
        new TextInputBuilder()
          .setCustomId("a-records")
          .setLabel("A Records")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("A Records are split into an array by commas")
          .setRequired(false),
      ];

      const records2 = [
        new TextInputBuilder()
          .setCustomId("txt-record")
          .setLabel("TXT Record")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Place your TXT Record here")
          .setRequired(false),
        new TextInputBuilder()
          .setCustomId("mx-record")
          .setLabel("MX Record")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Place your MX Record here")
          .setRequired(false),
      ];

      const userInfo = [
        new TextInputBuilder()
          .setCustomId("username")
          .setLabel("Github Username")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Place your github username here")
          .setRequired(true),
      ];

      // Each TextInput needs its own ActionRow, or discord will cause an error
      const modalActionRows = [
        new ActionRowBuilder<TextInputBuilder>().addComponents(userInfo[0]),
        new ActionRowBuilder<TextInputBuilder>().addComponents(records[0]),
        new ActionRowBuilder<TextInputBuilder>().addComponents(records[1]),
        new ActionRowBuilder<TextInputBuilder>().addComponents(records2[0]),
        new ActionRowBuilder<TextInputBuilder>().addComponents(records2[1]),
      ];

      const modal = new ModalBuilder()
        .setCustomId("generation-modal")
        .setTitle(".is-a.dev JSON Domain")
        .addComponents(...modalActionRows);

      const sentMessage = await interaction.editReply({
        embeds: [embed],
        components: [actions],
      });

      const componentCollector = sentMessage.createMessageComponentCollector({
        time: ms("10m"),
      });

      componentCollector.on(
        "collect",
        async (v: ButtonInteraction<"cached">) => {
          if (v.user.id !== interaction.user.id) return; // Disallow any other users from disrupting the generation
          if (v.customId === "start-generation") {
            await v.showModal(modal);

            const modalResponse = await v.awaitModalSubmit({ time: ms("10m") });
            await modalResponse.reply({
              content: "Generated",
              flags: Discord.MessageFlags.Ephemeral,
            });
            const aRecords =
              modalResponse.fields.getTextInputValue("a-records");

            const { A, cname, txt, mx, github, discord } = {
              cname: modalResponse.fields.getTextInputValue("cname-record"),
              A: aRecords.length ? aRecords.split(",") : [],
              txt: modalResponse.fields.getTextInputValue("txt-record"),
              mx: modalResponse.fields.getTextInputValue("mx-record"),

              // User Data
              github: modalResponse.fields.getTextInputValue("username"),
              discord: interaction.user.username,
            };

            const data = filterObject(
              {
                owner: {
                  username: github,
                  discord,
                },
                records: {
                  CNAME: cname.length ? cname : null,
                  A: A.length ? A : null,
                  TXT: txt.length ? txt : null,
                  MX: mx.length ? mx : null,
                },
              },
              (_, v) => {
                return v != null;
              },
              true
            );

            const resultEmbed = new Discord.EmbedBuilder()
              .setColor(client.config.embeds.default as ColorResolvable)
              .setDescription(
                `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
              );

            await interaction.editReply({
              embeds: [resultEmbed],
              components: [],
            });
            componentCollector.stop("generated");
          }
        }
      );

      componentCollector.on("end", async (collected, reason) => {
        if (reason === "unfinished") {
          await interaction.editReply({
            embeds: [endEmbed],
            components: [], // Remove all the components, aka the action row
          });
        }
      });
    } catch (err) {
      client.logCommandError(err, interaction, Discord);
    }
  },
};

export = command;
