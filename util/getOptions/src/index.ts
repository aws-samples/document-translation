// This script fetches all parameters from SSM Parameter Store that start with the specified prefix
// (e.g., /doctran/main) and generates a JSON file with the parameter names and values as keys and values.
// The generated JSON file can then be used as the config for the CDK.
import fs from "fs/promises";
import {
	SSMClient,
	GetParametersByPathCommand,
	GetParametersByPathResult,
} from "@aws-sdk/client-ssm";

interface ConfigItem {
	Name: string;
	Value: string;
}

const instanceName = process.env.INSTANCE_NAME;
if (!instanceName) {
	throw new Error("INSTANCE_NAME environment variable is not set. E.g. 'main'");
}

const projectName = "doctran";
const projectPrefix = `/${projectName}/${instanceName}`;
const outputFileName = "config.json";

// Get all parameters with specific prefix
const fetchParameters = async (
	prefix: string
): Promise<GetParametersByPathResult> => {
	const params = {
		Path: prefix,
		Recursive: true,
		WithDecryption: true,
	};

	const client = new SSMClient();
	const command = new GetParametersByPathCommand(params);

	let nextToken: string | undefined;
	const collatedResults: any[] = [];

	do {
		const result = await client.send(command);
		collatedResults.push(...(result.Parameters || []));
		nextToken = result.NextToken;
		command.input.NextToken = nextToken;
	} while (nextToken);

	return { Parameters: collatedResults };
};

// Map the fetched parameters to a ConfigItem array
const extractRelevantFields = (parameters: any): ConfigItem[] =>
	parameters.map(({ Name, Value }: any) => ({ Name: Name!, Value: Value! }));

// Remove the project prefix from the parameter names
const removePrefix = (config: ConfigItem[]): ConfigItem[] =>
	config.map(({ Name, Value }) => ({
		Name: Name.replace(projectPrefix, ""),
		Value,
	}));

// Split the path string '/foo/bar' into an array of keys
const splitPath = (path: string): string[] => path.slice(1).split("/");

// Recursively build the nested object structure
const buildNestedConfigObject = (
	configItems: ConfigItem[],
	obj: any = {}
): any =>
	configItems.reduce((acc, item) => {
		const keys = splitPath(item.Name);
		let currentObj = acc;

		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i];
			currentObj[key] = currentObj[key] || {};
			currentObj = currentObj[key];
		}

		const finalKey = keys[keys.length - 1];
		currentObj[finalKey] =
			item.Value === "true"
				? true
				: item.Value === "false"
				? false
				: isNaN(Number(item.Value))
				? item.Value
				: Number(item.Value);

		return acc;
	}, obj);

const saveConfigToFile = async (output: any) => {
	await fs.writeFile(outputFileName, JSON.stringify(output, null, 4));
};

const main = async () => {
	const allParameters = await fetchParameters(`${projectPrefix}/`);
	if (!allParameters?.Parameters?.length)
		throw new Error("No parameters found");

	const parametersWithRelevantFields = extractRelevantFields(
		allParameters.Parameters!
	);

	const parametersWithoutPrefix = removePrefix(parametersWithRelevantFields);

	const nestedConfigObject = buildNestedConfigObject(parametersWithoutPrefix);

	await saveConfigToFile(nestedConfigObject);
	console.log(JSON.stringify(nestedConfigObject, null, 4));
	console.log(`\nSaved config to ${outputFileName}`);
};

main();
