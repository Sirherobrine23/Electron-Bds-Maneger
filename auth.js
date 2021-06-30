const { app, UserRegister } = require("./index")
const { resolve } = require("path");
const { writeFileSync, readFileSync } = require("fs");
const uuid = require("uuid").v4
const { CheckUser, AddUser, GetManegerEnable } = require("./lib/ManegerConfig");

if (GetManegerEnable().register){
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
        if (!(Register[body.uuid])) return res.redirect("/login");
        const User = {
            user: body.user,
            pass: body.pass
        }
        // Check
        if (User.user.length <= 5) return res.redirect(`/register/${body.uuid}?error=15`)
        if (User.pass.length <= 7) return res.redirect(`/register/${body.uuid}?error=16`)
        if (CheckUser(User.user)) return res.redirect(`/register/${body.uuid}?error=A`)
        
        delete Register[body.uuid]
        writeFileSync(UserRegister, JSON.stringify(Register, null, 4))
        AddUser(body.uuid, {
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