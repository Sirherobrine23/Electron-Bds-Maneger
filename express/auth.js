const current_session = {};
const path = require("path");
const fs = require("fs");
const { CheckUser } = require("../lib/ManegerConfig");

function session_check(req, res, next){
    console.log(req.path)
    if (/\/bds\/.*/.test(req.path)) {
        console.log(req.params)
        if (!CheckUser(req.params.UUID)) return res.send(fs.readFileSync(path.resolve(__dirname, "../page/login.html"), "utf8"))
    }
    return next()
}

module.exports = session_check