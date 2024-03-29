const { Octokit } = require("@octokit/rest");
async function RegisterDomain(
    subdomain,
    type,
    username,
    email,
    apikey,
    recordString,
) {
    switch (type) {
        case "A":
            regexPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
            break;
        case "CNAME":
            regexPattern = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/;
            break;
        case "MX":
            regexPattern = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/;
            break;
        case "TXT":
            regexPattern = /^.*$/;
            break;
        case "URL":
            regexPattern =
                /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}(\/[a-zA-Z0-9-_.~:/?#[\]@!$&'()*+,;=%]*)?$/;
            break;
        default:
            return { error: "Invalid record type." };
    }
    if (!regexPattern.test(recordString))
        return { error: "Invalid record string." };
    let octokit = new Octokit({
        auth: apikey,
    });
    let data = recordString;
    if (type === "A" || type === "MX") {
        data = JSON.stringify(data.split(",").map((s) => s.trim()));
    } else {
        data = `"${data.trim()}"`;
    }
    content = `{
        "owner": {
           "username": "${username}",
           "email": "${email}"
        },
        "record": {
            "${type}": ${data.toLowerCase()}
        }
    }
    `;

    let record = Buffer.from(content).toString("base64");

    try {
        let commit = await octokit.repos.createOrUpdateFileContents({
            owner: username,
            repo: "register",
            path: "domains/" + subdomain + ".json",
            message: `feat(domain): ${subdomain}.is-a.dev`,
            content: record,
            committer: {
                name: username,
                email: email,
            },
            author: {
                name: username,
                email: email,
            },
        });
    } catch (e) {
        console.log(e);
        return { error: "Error creating domain file." };
    }

    try {
        let existingPullRequests = await octokit.pulls.list({
            owner: "is-a-dev",
            repo: "register",
            state: "open",
            head: `${username}:main`,
            base: "main",
        });

        if (existingPullRequests.data.length > 0) {
            // Pull request already exists, return an error or handle it accordingly
            return { error: "A pull request for this domain already exists." };
        }
        let pr = await octokit.pulls.create({
            owner: "is-a-dev",
            repo: "register",
            title: `BETA: Register ${subdomain
                .toLowerCase()
                .replace(/\.[^/.]+$/, "")}.is-a.dev`,
            head: `${username}:main`,
            base: "main",
            body: `Added \`${subdomain
                .toLowerCase()
                .replace(/\.[^/.]+$/, "")}.is-a.dev\` using the site.`,
        });
        let PrUrl = pr.data.html_url;
        return { prurl: PrUrl };
    } catch (e) {
        console.log(e);
        return { error: "Error creating pull request." };
    }
}

exports.RegisterDomain = RegisterDomain;
