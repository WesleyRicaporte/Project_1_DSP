const path = require("path");

module.exports = {
    mode: "development",
    devtool: false,
    entry: path.join(__dirname, "./src/main.ts"),
    output: {
        path: path.resolve(__dirname, "./build"),
        filename: "bundle.js", // <--- Will be compiled to this single file
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        extensionAlias: {
            ".js": [".ts", ".js"],
            ".mjs": [".mts", ".mjs"],
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
            },
        ],
    },
};
