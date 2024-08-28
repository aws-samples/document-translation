import { getMiscOptions, MiscOptions } from "./common.misc";
import { getGithubOptions, githubOptions } from "./pipeline.source";
import { getUserOptions, userOptions } from "./shared.users";
import {
	getCognitoUserOptions,
	cognitoUserOptions,
	cognitoMfaOption,
} from "./shared.users.cognito";
import { getSamlUserOptions, samlUserOptions } from "./shared.users.saml";
import { getWebOptions, webOptions } from "./shared.web";
import { getTranslationOptions, translationOptions } from "./translation";
import { getReadableOptions, readableOptions } from "./readable";
import { getDevelopmentOptions, developmentOptions } from "./development";

import { prereqCdk } from "./prereq.cdk";
import { prereqTranslation } from "./prereq.translationPii";

import { deploy, awsConfig, appConfig } from "./deploy";
import { getAccountId, getRegionId } from "./getAccountDetails";

import { monitorCodepipeline } from "./monitor.codepipeline";

const getOptions = async (): Promise<appConfig> => {
	//
	// Shared
	// Shared | Misc
	const misc: MiscOptions = await getMiscOptions();
	// Shared | GitHub
	const github: githubOptions = await getGithubOptions();
	// Shared | Users
	const users: userOptions = await getUserOptions();
	// Shared | Users | Cognito
	let users_cognito: cognitoUserOptions = {};
	if (users.cognitoUsers) {
		users_cognito = await getCognitoUserOptions();
	}
	// Shared | Users | Saml
	let users_saml: samlUserOptions = {};
	if (users.samlUsers) {
		users_saml = await getSamlUserOptions();
	}
	// Shared | Web
	const web: webOptions = await getWebOptions();
	//
	// Features
	// Features | Translation
	const translation: translationOptions = await getTranslationOptions();
	// Features | Readable
	const readable: readableOptions = await getReadableOptions();
	//
	// Development
	const development: developmentOptions = await getDevelopmentOptions();

	return {
		misc,
		github,
		users,
		users_cognito,
		users_saml,
		web,
		translation,
		readable,
		development,
	};
};

const main = async () => {
	const awsConfig: awsConfig = {
		account: await getAccountId(),
		region: await getRegionId(),
	};

	// Get Options
	const appConfig = await getOptions();
	console.log("AppConfig:", appConfig);

	// Prerequisites
	prereqCdk();
	if (appConfig.translation.translationPii) {
		await prereqTranslation();
	}

	// Assumptions for source code
	let periodicChecksInCodepipeline = false;
	if (
		appConfig.github.repoOwner === "aws-samples" &&
		appConfig.github.repoName === "document-translation"
	) {
		periodicChecksInCodepipeline = true;
		console.log("Pointed at upstream. Using periodic checks in codepipeline");
	} else {
		console.log("Pointed at fork. Using repo hooks to codepipeline");
	}

	// const appConfig: appConfig = {
	// 	github: {
	// 		repoOwner: "aws-samples",
	// 		repoName: "document-translation",
	// 		release: "latest",
	// 		token: "<YOUR_GithubPersonalAccessToken_HERE>",
	// 	},
	// 	users: { cognitoUsers: true, samlUsers: false },
	// 	users_cognito: {
	// 		cognitoMfa: cognitoMfaOption.OFF,
	// 		cognitoMfaOtp: false,
	// 		cognitoMfaSms: false,
	// 	},
	// 	users_saml: {},
	// 	web: {
	// 		webUi: true,
	// 		customDomain: false,
	// 		// customDomainName: "d.com",
	// 		// customDomainArn: "arn:aws:acm:foobar",
	// 	},
	// 	translation: {
	// 		translation: true,
	// 		translationLifecycleDefault: 7,
	// 		translationPii: true,
	// 		translationLifecyclePii: 7,
	// 	},
	// 	readable: { readable: true, readableBedrockRegion: "us-west-2" },
	// 	development: {
	// 		development: true,
	// 		appRemovalPolicy: "DESTROY",
	// 		pipelineRemovalPolicy: "DESTROY",
	// 	},
	// };

	// Deploy
	await deploy({
		appConfig,
		awsConfig,
	});

	// Monitor codepipeline
	await monitorCodepipeline();
};

main();
