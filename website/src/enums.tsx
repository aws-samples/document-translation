export const S3KeyTypes: Record<string, string> = {
	OBJECT: "OBJECT",
	USER_OBJECT: "USER_OBJECT",
	SCOPE_USER_OBJECT: "SCOPE_USER_OBJECT",
};

export const S3Scopes: Record<string, string> = {
	PRIVATE: "private",
};

export const VisualModes = {
	AUTO: "auto",
	LIGHT: "light",
	DARK: "dark",
};
export type VisualMode = (typeof VisualModes)[keyof typeof VisualModes];
