const path = require("path");

module.exports = {
    mode: "production",
    devtool: false,
    entry: path.join(__dirname, "./src/main.ts"),
    optimization: {
        usedExports: true,
        minimize: true,
    },
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
