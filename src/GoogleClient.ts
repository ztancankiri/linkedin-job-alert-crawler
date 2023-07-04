import axios from "axios";
import qs from "node:querystring";

export interface Config {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

export class GoogleClient {
	static AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/auth";
	static TOKEN_ENDPOINT = "https://accounts.google.com/o/oauth2/token";

	private config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	public generateConsentUrl(scope: string[]): string {
		const params = qs.stringify({
			redirect_uri: this.config.redirectUri,
			client_id: this.config.clientId,
			access_type: "offline",
			response_type: "code",
			prompt: "consent",
			scope: scope,
		});

		return `Consent URL: ${GoogleClient.AUTH_ENDPOINT}?${params}`;
	}

	public async generateRefreshToken(code: string): Promise<string> {
		const response = await axios.post(GoogleClient.TOKEN_ENDPOINT, {
			code: code,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
			redirect_uri: this.config.redirectUri,
			grant_type: "authorization_code",
		});

		return response.data.refresh_token;
	}

	public async generateAccessToken(refreshToken: string): Promise<string> {
		const response = await axios.post(GoogleClient.TOKEN_ENDPOINT, {
			refresh_token: refreshToken,
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
			grant_type: "refresh_token",
		});

		return response.data.access_token;
	}

	public async generateXOAuth2Token(user: string, refreshToken: string): Promise<string> {
		const accessToken = await this.generateAccessToken(refreshToken);
		return Buffer.from(`user=${user}\x01auth=Bearer ${accessToken}\x01\x01`).toString("base64");
	}
}
