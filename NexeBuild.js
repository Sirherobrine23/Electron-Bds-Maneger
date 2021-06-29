#!/usr/bin/env node
const { compile } = require("nexe");
const { resolve } = require("path");
const opt = require("minimist")(process.argv.slice(2));
const MoreOptions = {
    name: "Bds Maneger",
    build: true,
    loglevel: "verbose",
    input: resolve(__dirname, "index.js"),
    output: resolve(__dirname,  `Bds_Maneger_Portable-${process.platform}-${process.arch}`),
    temp: resolve(__dirname, ".nexe"),
    resources: [
        resolve(__dirname, "page"),
        resolve(__dirname, "package*.json"),
        resolve(__dirname, "lib"),
    ],
}
if (opt.android) {
    MoreOptions["configure"] = [
        "--dest-cpu=arm64",
        "--dest-os=android",
        "--shared-cares",
        "--shared-openssl",
        "--shared-zlib",
        "--cross-compiling"
    ]
    MoreOptions["output"] = resolve(__dirname, "Bds_Maneger_Bin-Android-arm64")
}
if (process.platform === "win32") {
    MoreOptions["rc"] = {
        CompanyName: "The Bds Maneger Project",
        FileDescription: "A modern and versatile Manager for Minecraft Servers",
        LegalCopyright: "The Bds Maneger Project, AGPL-3.0 License"
    }
    MoreOptions["ico"] = resolve(__dirname, ".github/assents/BdsIcon.ico")
}
compile(MoreOptions).then(() => {console.log("success")})
