#!/usr/bin/env node
const express = require("express");
const app = express();
const http = require("http");
const { resolve, join } = require("path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { existsSync, writeFileSync, readFileSync } = require("fs");
const uuid = require("uuid").v4
const bodyParser = require("body-parser");
const bds = require("@the-bds-maneger/core");
const ManegerConfig = require("./lib/ManegerConfig");
const options = require("minimist")(process.argv.slice(2));
const proxy = require("express-http-proxy");
const RateLimit = require("express-rate-limit");
const { CheckUser, GetUser, SaveConfig } = require("./lib/ManegerConfig");

if (options.DockerImage) console.log("Old docker image is now in bdsmaneger/core, bdsmaneger/maneger will now be Bds Maneger web interface.");
const BdsPort = ManegerConfig.GetUIPort()
const PathExec = ManegerConfig.WebUIPath

// Enable Bds Maneger Core API
require("@the-bds-maneger/core/rest/api").api()
app.use("/api", proxy("http://localhost:1932"))

// set up rate limiter: maximum of five requests per minute
const htmlLimit = readFileSync("./page/Limit.html", "utf8")
// apply rate limiter to all requests
app.use(new RateLimit({
    windowMs: 5*60*1000, // 5 minute
    max: 9000000,
    message: htmlLimit
}));
// Register
const UserConfig = resolve(PathExec, "User.json");
if(!(existsSync(UserConfig))) writeFileSync(UserConfig, "{}")

const ConfigPath = resolve(PathExec, "Config.json");
var Config = {
    register: true,
    api: true
};
if(!(existsSync(ConfigPath))) writeFileSync(ConfigPath, JSON.stringify(Config, null, 4)); else Config = JSON.parse(readFileSync(ConfigPath, "utf8"))

const UserRegister = resolve(PathExec, "Register.json");
writeFileSync(UserRegister, "{}")
module.exports.UserRegister = UserRegister
module.exports.app = app
require("./auth")

console.log((function(){
    console.log("Changing user uuids");
    const oldUUID = JSON.parse(readFileSync(UserConfig, "utf8"));
    const newusersfile = {};
    for (let changeUuid of Object.getOwnPropertyNames(oldUUID)) {
        newusersfile[uuid()] = oldUUID[changeUuid]
    }
    writeFileSync(UserConfig, JSON.stringify(newusersfile, null, 4))
    return "uuids successfully exchanged"
})());

// Express Settings
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

// Socket.io
function sendLog(data = ""){
    data = data.split("\n").filter(data =>{return (data !== "")})
    io.emit("BdsLog", data);
    for (let log of data) console.log(log);
}

io.on("connection", (socket) => {
    console.log(`User Id Connected: ${socket.id}`);
    if (existsSync(join(bds.BdsSettigs.GetPaths("log"), "latest.log")) && bds.detect()) {
        const parseLogFile = readFileSync(join(bds.BdsSettigs.GetPaths("log"), "latest.log"), "utf8").split("\n").filter(data =>{return (data !== "")})
        socket.send(parseLogFile)
    }
    socket.on("disconnect", ()=>{
        console.log(`User disconnected ${socket.id}`);
    })
});

// URi
app.use("/assents", express.static(resolve(__dirname, "page/assents/")))
app.get("/", (req, res) => res.redirect("/login"));
app.get("/index", (req, res)=>{res.redirect("/login")})
app.get("/bds", (req, res)=>{res.redirect("/login")})

// Index
app.get("/bds/:UUID/index", (req, res)=>{
    const body = req.params
    if (CheckUser(body.UUID)) {
        var Index = readFileSync(resolve(__dirname, "page/index.html"), "utf8").toString();
        Index = Index.split("@{{UUID}}").join(body.UUID)
        return res.send(Index)
    } else res.redirect("/login")
})

// Players
app.get("/bds/:UUID/players", (req, res)=>{
    if (CheckUser(req.params.UUID)) return res.sendFile(resolve(__dirname, "page/players.html"))
    else res.redirect("/login")
})

// Server Settings
app.get("/bds/:UUID/settings", (req, res)=>{
    if (CheckUser(req.params.UUID)) return res.sendFile(resolve(__dirname, "page/config.html"));
    else res.redirect("/login")
})

app.post("/bds/:UUID/settings/save", (req, res)=>{
    if (CheckUser(req.params.UUID)) {
        bds.set_config(req.body)
        res.redirect("../index")
    }
    else res.sendStatus(401)
})

app.get("/bds/:UUID/settings/get", (req, res)=>{
    if (CheckUser(req.params.UUID)) return res.json(bds.get_config())
    else res.sendStatus(401)
})

app.get("/bds/:UUID/running", (req, res)=>{
    if (CheckUser(req.params.UUID)) return res.json({running: bds.detect()})
    else res.sendStatus(404)
})

app.post("/bds/:UUID/settings/Server/:PLATFORM/:VERSION", (req, res)=>{
    if (CheckUser(req.params.UUID)) {
        if (req.params.PLATFORM) bds.BdsSettigs.UpdatePlatform(req.params.PLATFORM)
        try {
            bds.download(req.params.VERSION, true, function(){
                return res.sendStatus(200)
            })
        } catch (error) {
            return res.sendStatus(501)
        }
    } else res.sendStatus(404)
})

app.get("/bds/:UUID/api/token", (req, res)=>{
    const tokenPath = join(bds.BdsSettigs.bds_dir, "bds_tokens.json")
    if (!(existsSync(tokenPath))) bds.token_register()
    const Tokens = require(tokenPath)
    if (CheckUser(req.params.UUID)) {
        res.json({
            token: Tokens[0].token
        })
    } else res.sendStatus(404)
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

app.get("/login", (req, res) => res.sendFile(resolve(__dirname, "page/login.html")))

// Bds Maneger Services
app.post("/service", (req, res) => {
    const _h = req.headers.command;
    const _uuid = req.headers.uuid;
    // Check uuid session
    if (!(CheckUser(_uuid))) return res.sendStatus(401);
    if (_h === "start") {
        if (bds.detect()) return res.json({
            status: false
        })
        const bdsstart = bds.start();
        bdsstart.log(sendLog)
        global.TheRunUUID = bdsstart.uuid
        return res.send({
            status: true
        })
    } else if (_h === "stop") {
        if (bds.detect()) return res.json({
            rtu: global.BdsExecs[global.TheRunUUID].stop(),
            status: true
        }); else return res.json({
            status: false
        })
    }
    return res.statusCode(401)
});

app.post("/command", (req, res) => {
    console.log("Command request");
    const body = req.headers
    console.log(body);
    if (!(CheckUser(body.uuid))) return res.status(402).send("UUID Error");
    if (global.BdsExecs[global.TheRunUUID]) {
        global.BdsExecs[global.TheRunUUID].command(body.command, function(d){res.send(d)})
    } else res.status(401).send("Start Server")
})



// Listen Server
server.listen(BdsPort, () => {console.log(`listening on *:${BdsPort}`)});