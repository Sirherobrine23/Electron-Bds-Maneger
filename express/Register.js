const { UserRegister } = require("../index")
const express = require("express");
const app = express.Router();
const { resolve } = require("path");
const { writeFileSync, readFileSync } = require("fs");
const uuid = require("crypto").randomUUID;
const { CheckUser, AddUser, GetManegerEnable } = require("../lib/ManegerConfig");

if (GetManegerEnable().register){
    app.get("/register", (req, res) => {
        const UserUUID = (()=>{var a = uuid().split("-");return a[0] + a[2]})()
        const Users = JSON.parse(readFileSync(UserRegister, "utf8"));
        if (Users[UserUUID]) return res.redirect("/register");
        else Users[UserUUID] = {
            user: null,
            pass: null
        };
        writeFileSync(UserRegister, JSON.stringify(Users, null, 4));
        return res.redirect(`/register/${UserUUID}/reg`)
    })

    app.get("/register/:ID/reg", (req, res) => {
        const parm = req.params
        const Users = JSON.parse(readFileSync(UserRegister, "utf8"));
        if (!(Users[parm.ID])) return res.redirect("/register");
        return res.sendFile(resolve(__dirname, "../page/register.html"))
    })
    app.post("/register/:ID/registerSave", (req, res) => {
        const body = req.body
        console.log(req.body)
        const Register = JSON.parse(readFileSync(UserRegister, "utf8"));
        if (!(Register[req.params.ID])) return res.redirect("/login");
        const User = {
            user: body.user,
            pass: body.pass
        }
        // Check
        if (User.user.length <= 5) return res.redirect(`/register/${body.uuid}/reg?error=15`)
        if (User.pass.length <= 7) return res.redirect(`/register/${body.uuid}/reg?error=16`)
        if (CheckUser(User.user)) return res.redirect(`/register/${body.uuid}/reg?error=A`)
        
        delete Register[req.params.ID]
        writeFileSync(UserRegister, JSON.stringify(Register, null, 4))
        AddUser(req.params.ID, {
            "user": User.user,
            "passworld": User.pass
        })
        res.redirect(`/bds/${body.uuid}/index`)
    })
} else {
    app.get("/register", (req, res) => {
        res.redirect("/login")
    })
}

module.exports = appR => appR.use(app)