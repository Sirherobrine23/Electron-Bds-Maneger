const { resolve, join } = require("path");
const { readFileSync, writeFileSync, existsSync } = require("fs");
const express = require("express");
const app = express.Router();
const bds = require("@the-bds-maneger/core");
const { CheckUser, GetUser, SaveConfig } = require("../lib/ManegerConfig");
const qrcode = require("qrcode");

// Index
// Bds Auth check
function session(req, res, next){
    if (!CheckUser(req.params.UUID)) return res.send(readFileSync(resolve(__dirname, "../page/login.html"), "utf8"))
    return next()
}

app.get("/bds/:UUID/index", session, (req, res)=>{
    const body = req.params
    var Index = readFileSync(resolve(__dirname, "../page/index.html"), "utf8").toString();
    Index = Index.split("@{{UUID}}").join(body.UUID)
    return res.send(Index)
})

// Players
app.get("/bds/:UUID/players", session, (req, res)=>{
    return res.sendFile(resolve(__dirname, "../page/players.html"))
})

// Server Settings
app.get("/bds/:UUID/settings", session, (req, res)=>{
    return res.sendFile(resolve(__dirname, "../page/config.html"));
})

app.post("/bds/:UUID/settings/save", session, (req, res)=>{
    bds.set_config(req.body)
    res.redirect("../index")
})

app.get("/bds/:UUID/settings/get", session, (req, res)=>{
    return res.json(bds.get_config())
})

app.get("/bds/:UUID/running", session, (req, res)=>{
    return res.json({running: bds.detect()})
})

app.get("/bds/:UUID/Connect", session, (req, res)=>{
    const { Type } = req.query;
    const CurrentConfig = bds.get_config();
    const urlV4 = `${req.hostname}:${CurrentConfig.portv4}`;
    const urlV6 = `${req.hostname}:${CurrentConfig.portv6}`;
    if (Type === "url") {
        res.json({ url: urlV4 })
    } else if (Type === "Add") {
        return res.json({url: `minecraft:?addExternalServer=${CurrentConfig.world}|${urlV4}`});
    } else {
        qrcode.toBuffer(`minecraft:?addExternalServer=${CurrentConfig.world}|${urlV4}`, {type: "png"}, (err, url) => {
            if (err) return res.status(400).send({error: "Qrcode error"});
            res.send(url)
        });
    }
})

app.post("/bds/:UUID/settings/Server/:PLATFORM/:VERSION", session, (req, res)=>{
    if (req.params.PLATFORM) bds.BdsSettigs.UpdatePlatform(req.params.PLATFORM)
    try {return bds.download(req.params.VERSION, true, function(){return res.sendStatus(200)})}
    catch (error) {return res.sendStatus(501)}
})

app.get("/bds/:UUID/api/token", session, (req, res)=>{
    const tokenPath = join(bds.BdsSettigs.bds_dir, "bds_tokens.json")
    if (!(existsSync(tokenPath))) bds.token_register()
    const Tokens = require(tokenPath)
    res.json({token: Tokens[0].token})
})

app.get("/bds/:UUID/logout", (req, res)=>{
    res.redirect("/login")
    return SaveConfig()
})

app.post("/GetUserID", (req, res) => {
    const body = req.body
    // Return Status
    const UserUUID = GetUser(body.user, body.pass)
    if (UserUUID.uid) res.redirect(`/bds/${UserUUID.uid}/index`);
    else res.redirect("/login?error=L1");
})

module.exports = appR => appR.use(app)