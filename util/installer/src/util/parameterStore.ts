import {
	SSMClient,
	PutParameterCommand,
	SSMClientConfig,
	PutParameterCommandInput,
	PutParameterCommandOutput,
} from "@aws-sdk/client-ssm";

const config: SSMClientConfig = {};

const client = new SSMClient(config);

export const putParameter = async (
	prefix: string,
	path: string,
	value: string,
	overwrite: boolean = true,
	pattern: string | undefined = undefined
) => {
	const name = prefix + path;
	const input: PutParameterCommandInput = {
		Name: name,
		Value: value,
		Overwrite: overwrite,
		AllowedPattern: pattern,
		Type: "String",
	};

	const command = new PutParameterCommand(input);
	try {
		const response: PutParameterCommandOutput = await client.send(command);
		console.log(
			`Saving '${name}' = '${value}' returned: '${response.$metadata.httpStatusCode}'`
		);
	} catch (error) {
		console.log(error);
		throw new Error("Unable to save parameter");
	}
};
