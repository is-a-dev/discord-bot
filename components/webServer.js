const express = require("express");
var cors = require("cors");
const multer = require("multer");
const { Octokit } = require("@octokit/rest");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const auth = require("../models/auth");
const user = require("../models/user");
const Prdata = require("../models/prdata");
const fetch = require("node-fetch");
const ejs = require("ejs");
const DM = require("../components/DmUser");
const DmUser = require("../components/DmUser");

const upload = multer();

function keepAlive(client) {
    const server = express();
    server.set("view engine", "ejs");
    server.use(cors());

    server.get("/", async (req, res) => {
        res.send("bot")
    });

    server.get("/login", async (req, res) => {
        const domain = process.env.DOMAIN;
        const GITHUB_ID = process.env.GITHUB_ID;
        console.log("Login request received");
        const uuid = req.query.uuid;
        // Check if uuid is valid
        if (!uuid) return res.status(400).send("Invalid UUID");
        // Check if uuid is in database
        try {
            const data = await auth.findOne({ uuid: uuid });
            if (!data) return res.status(404).send("UUID not found");
            // Check if user is logged in
            if (data.loggedIn)
                return res.status(400).send("User is already logged in");
            //redirect to github
            const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_ID}&scope=public_repo%20user:email&redirect_uri=${domain}/auth/handler?uuid=${uuid}`;
            res.redirect(authUrl);
        } catch (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }
    });

    server.get("/auth/handler", async (req, res) => {
        const code = req.query.code;
        const uuid = req.query.uuid;
        const GITHUB_ID = process.env.GITHUB_ID;
        const GITHUB_SECRET = process.env.GITHUB_SECRET;

        if (!code) return res.status(400).send("Invalid code");
        if (!uuid) return res.status(400).send("Invalid UUID");

        // Check if uuid is in database
        try {
            const existingData = await auth.findOne({ uuid: uuid });
            if (!existingData) return res.status(404).send("UUID not found");
            // Check if user is logged in
            if (existingData.loggedIn)
                return res.status(400).send("User is already logged in");
            // get id from db
            const id = existingData._id;

            const response = await fetch(
                `https://github.com/login/oauth/access_token?client_id=${GITHUB_ID}&client_secret=${GITHUB_SECRET}&code=${code}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                },
            );

            const data = await response.json();

            const accessToken = data.access_token;

            // get user info
            const userResponse = await fetch("https://api.github.com/user", {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const userData = await userResponse.json();
            const username = userData.login;
            const ProfilePic = userData.avatar_url;

            // get user email
            const emailResponse = await fetch(
                "https://api.github.com/user/emails",
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            const emailData = await emailResponse.json();
            const email = emailData[0].email;

            // create user
            await new user({
                _id: id,
                githubUsername: username,
                githubAccessToken: accessToken,
                email: email,
            }).save();

            // update auth
            await auth.updateOne({ uuid: uuid }, { loggedIn: true });


            // render success page
            res.render("logged-in", { username: username });
            const embed = {
                "description": `Username: ${username}\nEmail: ${email}`,
                "fields": [],
                "title": "Logged in as:",
                "image": {
                  "url": `${ProfilePic}`
                },
                "color": 16711680
              }
            DM(client, id, embed);
        } catch (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }
    });

    


    server.listen(3000, () => {
        console.log("Server is ready.");
    });
}

function getIP(request) {
    return (request.headers['x-forwarded-for'] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress).split(',').slice(-1)[0].split(':').slice(-1)[0];
}

module.exports = keepAlive;
