import { input, select } from "@inquirer/prompts";
import {
	SecretsManagerClient,
	CreateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
export type githubOptions = {
	repoOwner: string;
	repoName: string;
	release: string;
	token: string;
	repoHook: boolean;
};

type secretsManagerError = {
	$fault: string;
	$metadata: {
		httpStatusCode: number;
		requestId: string;
		extendedRequestId: string | undefined;
		cfId: string | undefined;
		attempts: number;
		totalRetryDelay: number;
	};
	__type: string;
};

const createAwsSecret = async (name: string, secret: string) => {
	const client = new SecretsManagerClient();
	try {
		const data = await client.send(
			new CreateSecretCommand({
				Name: name,
				SecretString: secret,
			})
		);
		return data;
	} catch (err) {
		const error: secretsManagerError = err as secretsManagerError;
		if (error.__type === "ResourceExistsException") {
			throw new Error(
				// `Secret already exists in AWS SecretsManager: ${name}.\nIf this token is old and no longer required it can be deleted (this is irreversable).\nDelete command: 'aws secretsmanager delete-secret --secret-id ${name}'.\nYou can view the contents of the secret to check its value.\nReveal command: 'aws secretsmanager get-secret-value --secret-id ${name}'. `
				`Secret already exists in AWS SecretsManager: ${name}. `
			);
		} else {
			throw new Error(
				`Error creating secret in AWS SecretsManager: ${name}: ${err}`
			);
		}
	}
};

type githubBranchInfo = {
	name: string;
	commit: {
		sha: string;
		url: string;
	};
	protected: boolean;
	protection: {
		enabled: boolean;
		required_status_checks: {
			enforcement_level: string;
			contexts: string[];
			checks: string[];
		};
	};
	protection_url: string;
};

// get the branches for a github repo without an API key
const getGithubBranches = async (
	repoOwner: string,
	repoName: string,
	token: string
): Promise<string[]> => {
	// get the branches for a github repo without an API key
	const url = `https://api.github.com/repos/${repoOwner}/${repoName}/branches`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const jsonData = await response.json();
	if (Array.isArray(jsonData)) {
		const data: githubBranchInfo[] = jsonData;
		return data.map((branch: any) => branch.name);
	} else {
		throw new Error("Unexpected response format");
	}
};

type branchChoices = {
	name: string;
	value: string;
};

const getGitHubReleaseBranches = async (
	repoOwner: string,
	repoName: string,
	token: string
): Promise<branchChoices[]> => {
	const branches = await getGithubBranches(repoOwner, repoName, token);
	const releaseBranches = branches.filter((branch: string) =>
		branch.startsWith("release/")
	);

	releaseBranches.sort().reverse();
	const choices: branchChoices[] = releaseBranches.map((branch: string) => ({
		name: branch,
		value: branch,
	}));

	return choices;
};

const canTokenRepoHook = async (token: string): Promise<boolean> => {
	const url = `https://api.github.com/authorizations`;
	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const scopes = response.headers.get("x-oauth-scopes");
	if (scopes && scopes.includes("repo_hook")) {
		return true;
	}
	return false;
};

const showInstruction = () => {
	console.log(`
# GitHub Configuration
GitHub is used at the source code repository.
Requirements: 1) GitHub Account. 2) GitHub Access Token.
If using the upstream AWS-Samples respository then a classic token with "public_repo" and no expiration will work. 
Prerequisite: https://aws-samples.github.io/document-translation/docs/shared/configuration/source-service/github/
	`);
};

export const getGithubOptions = async (): Promise<githubOptions> => {
	showInstruction();

	const theme = {
		prefix: "GitHub: ",
	};

	let answers: githubOptions = {
		repoOwner: await input({
			message: "Repo Owner (github.com/<OWNER>/<NAME>)",
			required: true,
			default: "aws-samples",
			theme,
		}),
		repoName: await input({
			message: "Repo Name (github.com/<OWNER>/<NAME>)",
			required: true,
			default: "document-translation",
			theme,
		}),
		token: await input({
			message: "Token",
			required: true,
			theme,
		}),
		release: "",
		repoHook: false,
	};

	answers.release = await select({
		message: "Release",
		choices: await getGitHubReleaseBranches(
			answers.repoOwner,
			answers.repoName,
			answers.token
		),
		theme,
	});

	answers.repoHook = await canTokenRepoHook(answers.token);

	createAwsSecret("github-token", answers.token);

	return answers;
};
