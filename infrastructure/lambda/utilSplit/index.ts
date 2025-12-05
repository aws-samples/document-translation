interface Event {
	string: string;
	splitter: string;
}

export const handler = async (event: Event): Promise<string[]> => {
	const { string, splitter } = event;
	const split = string.split(splitter);
	return split;
};
