#!/usr/bin/env node
const { compile } = require("nexe");
const { resolve } = require("path");
const opt = require("minimist")(process.argv.slice(2));
const MoreOptions = {}
if (opt.android) {
    MoreOptions["configure"] = [
        "--dest-cpu=arm64",
        "--dest-os=android",
        "--shared-cares",
        "--shared-openssl",
        "--shared-zlib",
        "--cross-compiling"
    ]
    MoreOptions["output"] = "Bds_Maneger_Bin-Android-arm64"
}
compile({
    name: "Bds Maneger",
    build: true,
    loglevel: "verbose",
    input: resolve(__dirname, "index.js"),
    output: resolve(__dirname,  `Bds_Maneger_Bin-${process.platform}-${process.arch}`),
    resources: [
        resolve(__dirname, "page"),
        resolve(__dirname, "package*.json"),
    ],
    ...MoreOptions
}).then(() => {console.log("success")})
