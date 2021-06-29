const { resolve, join } = require("path");
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require("fs");
const { bds_dir } = require("@the-bds-maneger/core/lib/BdsSettings");
const yaml = require("js-yaml");
const { randomUUID } = require("crypto");

// Maneger UI Folder
const WebUIPath = resolve(bds_dir, "WebUI")
if (!(existsSync(WebUIPath))) mkdirSync(WebUIPath, {recursive: true});

// Config File
var ManegerConfig = {
    enable: {
        register: true
    },
    port: {
        webui: 3000
    },
    Settings: {
        Cookie: randomUUID()
    },
    Users: [],
    Session: []
}
const ConfigFilePath = join(WebUIPath, "Maneger.yaml")
if (!(existsSync(ConfigFilePath))) writeFileSync(ConfigFilePath, yaml.dump(ManegerConfig));
else ManegerConfig = yaml.load(readFileSync(ConfigFilePath, "utf8"));

ManegerConfig.Session = []

function SaveConfig(){writeFileSync(ConfigFilePath, yaml.dump(ManegerConfig));}

module.exports = {
    WebUIPath,
    SaveConfig,
    GetUIPort: function(){return ManegerConfig.port.webui},
    UpdateUIPort: function(port = 3000){ManegerConfig.port.webui = port; SaveConfig()},
    GetManegerEnable: function(){return ManegerConfig.enable},
    UpdateManegerEnable: function(service = "register", option = true){
        if (typeof service !== "string") throw "Service is string";
        if (typeof option !== "boolean") throw "Allowed boolean";
        if (ManegerConfig.enable[service]) ManegerConfig.enable[service] = option; else throw "service invalid";
        SaveConfig();
    },
    GetCookieString: function(){return ManegerConfig.Settings.Cookie},
    GetUser: function (user = "aaaaaaaaaaaaaaaaa", passworld = "aaaaaaaaaaaaa", cookie = "aaaaaa"){
        for (let userObject of ManegerConfig.Users){
            if ((userObject.passworld === passworld) && (userObject.user === user)) return {
                uid: userObject.uuid,
                cookie: userObject.cookie
            }
        }
        return {
            uid: null,
            data: null,
            cookie: null
        }
    },
    CheckUser: function (uuid = "aaaaaaaaaaaaaaaaa"){
        for (let userObject of ManegerConfig.Users) if (userObject.uuid === uuid) return true;
        return false
    },
    AddUser: function (uuid = "", user = {user: null, passworld: null, cookie: "aaaa"}){
        for (let ObjectUser of ManegerConfig.Users) if (ObjectUser["uuid"] === uuid) return false;
        user.uuid = uuid
        ManegerConfig.Users.push(user)
        SaveConfig()
        return true
    },
    UpdateUser: function (uuid = "", user = {user: null, passworld: null, data: new Date()}){
        for (let ArrayNumber in ManegerConfig.Users) {
            const UserArray = ManegerConfig.Users[ArrayNumber];
            if (UserArray["uuid"] === uuid) {
                delete ManegerConfig.Users[ArrayNumber]
                ManegerConfig.Users = ManegerConfig.Users.filter(d=>{return !(d === "" || d === undefined || d === null)})
                user.uuid = uuid
                ManegerConfig.Users.push(user)
                SaveConfig()
                return user
            }
        }
        throw "Update User Error"
    },
    GetSession: function(cookie = ""){
        for (let session of ManegerConfig.Users) if (session.cookie === cookie) return session.uuid;
        return false
    }
}
