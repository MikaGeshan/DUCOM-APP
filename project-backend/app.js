const express = require("express")
const app = express()
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

app.use(express.json())

const mongoUrl = "mongodb+srv://rifzky:admin@cluster0.as0eld6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const JWT_SECRET = "dskfbdsaifvdsfvqueqbegfdbhfvsdbfioh23b4235145bj134[][ewfddsafcdsacdsj13"

mongoose.connect(mongoUrl).then(() => {
    console.log("MongoDB Connected")
}).catch((err) => {
    console.log(err)
})
require('./UserDetails')

const User = mongoose.model("UserInfo")

app.get("/", (req, res) => {
    res.send({ status: "Hello World" })
})

app.post("/register", async (req, res) => {
    const { name, username, email, password } = req.body

    const oldUserEmail = await User.findOne({ email: email })
    const oldUserUsername = await User.findOne({ username: username })

    if (oldUserUsername) {
        return res.send({ status: "alreadyUser", data: "User Already Exists!!" })
    }

    if (oldUserEmail) {
        return res.send({ status: "alreadyEmail", data: "Email Already Exists!!" })
    }

    const encryptedpassword = await bcrypt.hash(password, 10)

    try {
        await User.create({
            name: name,
            username: username,
            email: email,
            password: encryptedpassword
        })
        res.send({ status: "ok", data: "User Created" })
    } catch (error) {
        res.send({ status: "error", data: error })

    }
})

app.post("/login-user", async (req, res) => {
    const { email, password } = req.body

    const oldUser = await User.findOne({ email: email })

    if (!oldUser) {
        return res.send({ status: "error", data: "Email Doesn't Exists!!" })
    }

    const isPasswordValid = await bcrypt.compare(password, oldUser.password);

    if (isPasswordValid) {
        // Jika password cocok, buat token JWT
        const token = jwt.sign({ email: oldUser.email }, JWT_SECRET);

        // Mengirim respons dengan status 201 dan token JWT
        return res.status(201).send({ status: "ok", data: token });
    } else {
        // Jika password tidak cocok, kirim respons error
        return res.send({ status: "errorPass", data: "Incorrect Password" });
    }

})

app.post("/userdata", async (req, res) => {
    const { token } = req.body
    try {
        const user = jwt.verify(token, JWT_SECRET)
        const useremail = user.email

        User
            .findOne({ email: useremail })
            .then(data => {
                return res.send({ status: "ok", data: data })
            })
    } catch (error) {
        return res.send({ status: 'error', error: error })
    }
})

app.listen(5001, () => {
    console.log("server is running on port 5001")
})