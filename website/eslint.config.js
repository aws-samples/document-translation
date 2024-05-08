import eslintConfigPrettier from "eslint-config-prettier";

export default [
    {
        extends: [
            "react-app",
            "react-app/jest",
        ],
    },
    eslintConfigPrettier,
];
