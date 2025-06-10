import { Octokit } from "@octokit/core";

export async function getUser(token: string): Promise<{ username: string; id: number; avatar: string } | null> {
    try {
        const octokit = new Octokit({ auth: token });
        const user = await octokit.request("GET /user");

        return { username: user.data.login, id: user.data.id, avatar: user.data.avatar_url };
    } catch (err: any) {
        return null;
    }
}

export async function getUserEmails(token: string): Promise<{ email: string; primary: boolean }[]> {
    try {
        const octokit = new Octokit({ auth: token });
        const user = await octokit.request("GET /user/emails");

        const emails = user.data.filter(
            (e: any) => e.verified && !e.email.toLowerCase().endsWith("@users.noreply.github.com")
        );

        return emails.map((e: any) => ({ email: e.email, primary: e.primary }));
    } catch {
        return [];
    }
}
