#!/usr/bin/env node
const { compile } = require("nexe");
const { resolve } = require("path");
const files = [
    "../page/",
    "../package*.json"
]
compile({
    name: "Bds Maneger",
    build: true,
    input: resolve(__dirname, "..", "index.js"),
    output: resolve(__dirname,  "..",  `Bds_Maneger_Bin-${process.platform}-${process.arch}`),
    resources: files,
}).then(() => {console.log("success")})