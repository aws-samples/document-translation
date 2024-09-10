import * as fs from "fs";
import { Config } from "../lib/types";

export const defaultConfig: Config = {
	common: {
		development: {
			enable: false,
		},
		instance: {
			name: "main",
		},
	},
	pipeline: {
		approvals: {
			preCdkSynth: {
				enable: true,
				email: "",
			},
		},
		removalPolicy: "retain",
		source: {
			repoBranch: "main",
			repoHook: {
				enable: false,
			},
			repoName: "document-translation",
			repoOwner: "aws-samples",
		},
	},
	app: {
		cognito: {
			localUsers: {
				enable: false,
				mfa: {
					enforcement: "off",
					otp: false,
					sms: false,
				},
			},
			saml: {
				enable: false,
				metadataUrl: "",
			},
		},
		readable: {
			enable: false,
			bedrockRegion: "us-east-1",
		},
		removalPolicy: "retain",
		translation: {
			enable: false,
			lifecycle: 7,
			pii: {
				enable: false,
				lifecycle: 3,
			},
		},
		webUi: {
			customDomain: {
				enable: false,
				domain: "",
				certificateArn: "",
			},
			enable: true,
		},
	},
};

export const deepMerge = (defaultObj, priorityObj) => {
	const mergedObj = { ...defaultObj };
	for (const key in priorityObj) {
		if (
			typeof priorityObj[key] === "object" &&
			!Array.isArray(priorityObj[key])
		) {
			mergedObj[key] = deepMerge(mergedObj[key], priorityObj[key]);
		} else {
			mergedObj[key] = priorityObj[key];
		}
	}
	return mergedObj;
};

export const loadConfig = (): Config => {
	return deepMerge(
		defaultConfig,
		JSON.parse(fs.readFileSync("./config.json", "utf-8")),
	);
};
