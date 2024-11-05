import { putParameter } from "./util/parameterStore";
import fs from "fs/promises";

import { Config } from "../../../infrastructure/lib/types";

export interface AwsConfig {
	account: string;
	region: string;
}

// foo.bar.pie = true becomes foo/bar/pie = true
const flattenObject = (obj: any, parentKey = ""): any => {
	let result: any = {};
	for (const key in obj) {
		const value = obj[key];
		const newKey = parentKey ? `${parentKey}/${key}` : key;
		if (typeof value === "object") {
			result = { ...result, ...flattenObject(value, newKey) };
		} else {
			result[newKey] = value;
		}
	}
	return result;
};

export const saveConfigToParameterStore = async (config: Config) => {
	const flattenedConfig = flattenObject(config);

	const overwrite = true;
	const prefix = `/doctran/${config.common.instance.name}/`;
	for (const [key, value] of Object.entries(flattenedConfig)) {
		if (value !== undefined && value !== null && value.toString().length > 0) {
			await putParameter(prefix, key, value.toString(), overwrite);
			// calculate 1 second plus up to 1 second of jitter
			const oneSecond = 1000;
			const jitter = Math.floor(Math.random() * oneSecond);
			await new Promise((resolve) => {
				setTimeout(resolve, oneSecond + jitter);
			});
		}
	}
};

const main = async () => {
	const config: Config = JSON.parse(await fs.readFile("config.json", "utf8"));
	await saveConfigToParameterStore(config);
	console.log("Completed");
};
if (require.main === module) main();
