import { Config } from "../../../infrastructure/lib/types";
import fs from "fs/promises";

import { prereqTranslation } from "./deploy/prereq.translationPii";

export const prerequisites = async (config: Config) => {
	if (config.app.translation.pii.enable) {
		await prereqTranslation();
	}
};

const main = async () => {
	const config: Config = JSON.parse(await fs.readFile("config.json", "utf8"));
	await prerequisites(config);
	console.log("Completed");
};
if (require.main === module) main();
