import Connection, { Config } from "node-imap";
import { Source, simpleParser } from "mailparser";

export class EmailClient {
	private config: Config;
	private client: Connection | undefined;

	constructor(config: any) {
		this.config = config;
	}

	private async parseMessage(messageId: number): Promise<unknown> {
		return await new Promise<unknown>((resolve, reject) => {
			if (!this.client) {
				reject("Not connected!");
				return;
			}

			const fetch = this.client.fetch([messageId], { bodies: "", struct: true, markSeen: false });

			fetch.on("message", (message: any) => {
				message.on("body", (stream: Source) => {
					simpleParser(stream, {}, (error: unknown, parsed: unknown) => {
						if (error) {
							reject(error);
							return;
						}

						resolve(parsed);
					});
				});
			});
		});
	}

	public async connect(): Promise<void> {
		this.client = new Connection(this.config);
		this.client.connect();

		return await new Promise<void>((resolve, reject) => {
			if (!this.client) {
				reject("Not connected!");
				return;
			}

			this.client.once("ready", () => {
				resolve();
			});
		});
	}

	public async disconnect(): Promise<void> {
		return await new Promise((resolve, reject) => {
			if (!this.client) {
				reject("Not connected!");
				return;
			}

			this.client.end();
			this.client.once("end", resolve);
		});
	}

	public async listBoxes(): Promise<Connection.MailBoxes> {
		return await new Promise<Connection.MailBoxes>((resolve, reject) => {
			if (!this.client) {
				reject("Not connected!");
				return;
			}

			this.client.getBoxes((error: Error, boxes: Connection.MailBoxes) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(boxes);
			});
		});
	}

	public async openBox(box: string): Promise<Connection.Box> {
		return await new Promise<Connection.Box>((resolve, reject) => {
			if (!this.client) {
				reject("Not connected!");
				return;
			}

			this.client.openBox(box, true, (error: Error, result: Connection.Box) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(result);
			});
		});
	}

	public async search(searchCriteria: any[]): Promise<number[]> {
		return await new Promise<number[]>((resolve, reject) => {
			if (!this.client) {
				reject("Not connected!");
				return;
			}

			this.client.search(searchCriteria, (error: Error, uids: number[]) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(uids);
			});
		});
	}

	public async getEmailsBySender(sender: string): Promise<any[]> {
		const searchResults = await this.search([["HEADER", "FROM", sender]]);

		const messages: any = [];
		for (const messageId of searchResults) {
			const message = await this.parseMessage(messageId);
			messages.push(message);
		}

		return messages;
	}

	public async retrieveAll(): Promise<any[]> {
		const searchResults = await this.search([["ALL"]]);

		const messages: any = [];
		for (const messageId of searchResults) {
			const message = await this.parseMessage(messageId);
			messages.push(message);
		}

		return messages;
	}
}
