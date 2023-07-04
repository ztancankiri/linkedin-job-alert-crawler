import { GoogleClient } from "./GoogleClient";
import { EmailClient } from "./EmailClient";
import fs from "fs";
import path from "path";

interface Configuration {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope: string[];
	user: string;
	refreshToken: string;
}

async function main() {
	try {
		const configFiles = fs.readdirSync("config");

		if (configFiles.length === 0) {
			throw new Error("There is no configutarion!");
		}

		const config: Configuration = JSON.parse(fs.readFileSync(path.join("config", configFiles[0])).toString()) as Configuration;

		const googleClient = new GoogleClient({
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			redirectUri: config.redirectUri,
		});

		const xoauth2 = await googleClient.generateXOAuth2Token(config.user, config.refreshToken);

		const client = new EmailClient({
			user: config.user,
			xoauth2: xoauth2,
			host: "imap.gmail.com",
			port: 993,
			tls: true,
		});

		await client.connect();
		await client.openBox("Job Alerts");
		const emails = await client.retrieveAll();

		const jobs = new Set<string>();
		const regex = /https:\/\/www\.linkedin\.com\/comm\/jobs\/view\/([0-9]+)\/\?/gm;

		emails.forEach((email) => {
			let m;
			while ((m = regex.exec(email.textAsHtml)) !== null) {
				if (m.index === regex.lastIndex) {
					regex.lastIndex++;
				}

				jobs.add(`https://www.linkedin.com/comm/jobs/view/${m[1]}`);
			}
		});

		const jobList = Array.from(jobs.values());

		fs.writeFileSync("jobs.json", JSON.stringify(jobList, null, "\t"));
	} catch (error) {
		console.error(error);
	}
}

main();
