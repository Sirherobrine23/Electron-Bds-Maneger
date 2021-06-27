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
const { exit } = require("process");
const bds = require("@the-bds-maneger/core");

const options = require("minimist")(process.argv.slice(2));

if (options.h || options.help){
    const help = [
        "Bds Maneger [options]",
        "",
        "Options:",
        "   -p or --port            Bds Maneger Port, default 3000",
        `   -cwd                    Path to storage files, default current folder (${process.cwd()})`,
    ]
    console.log(help.join("\n"));
    exit()
}

const BdsPort = (options.port || options.p || 3000)
const PathExec = (options.cwd || process.cwd())

// Enable Bds Maneger Core API
require("@the-bds-maneger/core/rest/api").api()

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


// Functions
function checkUser(User){
    const config = JSON.parse(readFileSync(UserConfig, "utf8"));
    var Status = false
    for (let checkInfo of Object.getOwnPropertyNames(config)) {
        const user = config[checkInfo];
        if (user.user === User) Status = true
    }
    return Status
}
function checkPass(Pass){
    const config = JSON.parse(readFileSync(UserConfig, "utf8"));
    var Status = false
    for (let checkInfo of Object.getOwnPropertyNames(config)) {
        const user = config[checkInfo];
        if (user.pass === Pass) Status = true
    }
    return Status
}
function getUSerUUID(user){
    const Users = JSON.parse(readFileSync(UserConfig));
    for (let _usS of Object.getOwnPropertyNames(Users)) {
        Users[_usS];
        if (Users[_usS].user === user) return _usS
    }
    return false
}
function checkUUID(uid){
    const Users = JSON.parse(readFileSync(UserConfig));
    for (let _usS of Object.getOwnPropertyNames(Users)) {
        Users[_usS];
        if (_usS === uid) return true
    }
    return false
}

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
    const parseLogFile = readFileSync(join(bds.BdsSettigs.GetPaths("log"), "latest.log"), "utf8").split("\n").filter(data =>{return (data !== "")})
    socket.send(parseLogFile)
    socket.on("disconnect", ()=>{
        console.log(`User disconnected ${socket.id}`);
    })
});


// URi
app.use("/assents", express.static(resolve(__dirname, "page/assents/")))
app.get("/", (req, res) => res.redirect("/login"));

app.get("/index", (req, res)=>{
    const body = req.query
    if (checkUUID(body.uuid)) {
        var Index = readFileSync(resolve(__dirname, "page/index.html"), "utf8").toString();
        Index = Index.split("@{{UUID}}").join(body.uuid)
        return res.send(Index)
    } else res.redirect("/login")
})

app.get("/index/settings/:UUID", (req, res)=>{
    const body = req.params
    if (checkUUID(body.UUID)) {
        var ConfigHTML = readFileSync(resolve(__dirname, "page/config.html"), "utf8")
        ConfigHTML = ConfigHTML.split("@{{UUID}}").join(body.UUID)
        return res.send(ConfigHTML);
    }
    else res.redirect("/login")
})

app.post("/index/settings/:UUID/save", (req, res)=>{
    res.sendStatus(401)
})

app.get("/logout", (req, res)=>{
    const _uuid = req.query.uuid
    if (checkUUID(_uuid)) {
        const users = JSON.parse(readFileSync(UserConfig, "utf8"))
        if (users[_uuid]) {
            const newuid = uuid()
            users[newuid] = users[_uuid]
            if (users[newuid]) delete users[_uuid]; else return res.sendStatus(501);
            writeFileSync(UserConfig, JSON.stringify(users, null, 4));
            res.redirect("/login")
        }
    } else res.sendStatus(502)
})

app.post("/GetUserID", (req, res) => {
    const body = req.body
    // Return Status
    if (checkUser(body.user) && checkPass(body.pass)) res.redirect(`/index?uuid=${getUSerUUID(body.user)}`);
    else res.redirect("/login?error=L1");
})

if (Config.register){
    app.get("/register", (req, res) => {
        const UserUUID = uuid();
        const Users = JSON.parse(readFileSync(UserRegister, "utf8"));
        if (Users[UserUUID]) return res.redirect("/register");
        else Users[UserUUID] = {
            user: null,
            pass: null
        };
        writeFileSync(UserRegister, JSON.stringify(Users, null, 4));
        return res.redirect(`/register/${UserUUID}`)
    })

    app.get("/register/:ID", (req, res) => {
        const parm = req.params
        const Users = JSON.parse(readFileSync(UserRegister, "utf8"));
        if (!(Users[parm.ID])) return res.redirect("/register");
        return res.sendFile(resolve(__dirname, "page/register.html"))
    })
    app.post("/registerSave", (req, res) => {
        const body = req.body
        const Register = JSON.parse(readFileSync(UserRegister, "utf8"));
        const configUSer = JSON.parse(readFileSync(UserConfig, "utf8"));
        if (!(Register[body.uuid])) return res.redirect("/login");
        const User = {
            user: body.user,
            pass: body.pass
        }
        // Check
        if (User.user.length <= 5) return res.redirect(`/register/${body.uuid}?error=15`)
        if (User.pass.length <= 7) return res.redirect(`/register/${body.uuid}?error=16`)
        if (checkUser(User.user)) return res.redirect(`/register/${body.uuid}?error=A`)
        
        delete Register[body.uuid]
        writeFileSync(UserRegister, JSON.stringify(Register, null, 4))
        
        configUSer[body.uuid] = User
        writeFileSync(UserConfig, JSON.stringify(configUSer, null, 4));
        res.redirect(`/index?uuid=${body.uuid}`)
    })
} else {
    app.get("/register", (req, res) => {
        res.redirect("/login")
    })
}
app.get("/login", (req, res) => {res.sendFile(resolve(__dirname, "page/login.html"))})

// Bds Maneger Services
app.post("/service", (req, res) => {
    const _h = req.headers.command;
    const _uuid = req.headers.uuid;
    // Check uuid session
    if (!(checkUUID(_uuid))) return res.sendStatus(401);
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
    if (!(checkUUID(body.uuid))) return res.status(402).send("UUID Error");
    if (global.BdsExecs[global.TheRunUUID]) {
        global.BdsExecs[global.TheRunUUID].command(body.command, function(d){res.send(d)})
    } else res.status(401).send("Start Server")
})

// Listen Server
server.listen(BdsPort, () => {console.log(`listening on *:${BdsPort}`)});