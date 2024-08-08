const express = require("express")
const app = express()
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');

app.use(cors());
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const mongoUrl = "mongodb+srv://ducombackend:ducomadmin@ducomapp.nqicz5h.mongodb.net/?retryWrites=true&w=majority&appName=DucomApp"
const JWT_SECRET = "bfidkfdsajciusfweubfsdihugigfbrecfnsdprisca[][ewfddsafcdsacdsj13"

mongoose.connect(mongoUrl).then(() => {
    console.log("MongoDB Connected")
}).catch((err) => {
    console.log(err)
})

app.get("/", (res) => {
    res.send({ status: "Hello World" })
})

app.listen(5001, () => {
    console.log("server is running on port 5001")
})

require('./Model/UserModel')
const User = mongoose.model("UserModel")

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
    const { email, username, password } = req.body;

    let oldUser;

    // Jika email disediakan, cari berdasarkan email
    if (email || username) {
        if (email) oldUser = await User.findOne({ email: email });
        // Jika username disediakan, cari berdasarkan username
        if (!oldUser) {
            oldUser = await User.findOne({ username: email });
        }
    }
    // Jika tidak ada email atau username yang disediakan
    else {
        return res.send({ status: "error", data: "Email or Username is required" });
    }

    // Jika pengguna tidak ditemukan
    if (!oldUser) {
        return res.send({ status: "error", data: "User Not Found" });
    }

    // Periksa apakah password valid
    const isPasswordValid = await bcrypt.compare(password, oldUser.password);

    // Jika password valid, buat token JWT
    if (isPasswordValid) {
        const token = jwt.sign({ email: oldUser.email }, JWT_SECRET);
        return res.status(201).send({ status: "ok", data: token });
    } else {
        return res.send({ status: "errorPass", data: "Incorrect Password" });
    }
});

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

// Multer configuration for image uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

require('./Model/ImageModel')
const Image = mongoose.model("ImageModel")

// Endpoint to upload image
app.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        const image = new Image({
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            imageBase64: req.file.buffer.toString('base64'),
        });

        await image.save();
        res.status(201).send({ status: 'ok', data: 'Image uploaded successfully' });
    } catch (error) {
        res.status(500).send({ status: 'error', data: error.message });
    }
});

// Endpoint to get image by filename
app.get('/image/:filename', async (req, res) => {
    try {
        const image = await Image.findOne({ filename: req.params.filename });

        if (!image) {
            return res.status(404).send({ status: 'error', data: 'Image not found' });
        }

        res.set('Content-Type', image.contentType);
        res.send(Buffer.from(image.imageBase64, 'base64'));
    } catch (error) {
        res.status(500).send({ status: 'error', data: error.message });
    }
});


// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: 'ducombackend@gmail.com',
        pass: 'qylfvgqpmmslwivq'
    }
});

let otps = {};

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await User.findOne({ email: email });
        if (!oldUser) {
            return res.send({ status: "error", data: "User Not Found" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        otps[email] = otp;

        const mailOptions = {
            from: 'ducombackend@gmail.com',
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.send({ status: "error", data: error.message });
            } else {
                return res.send({ status: "ok", data: "OTP sent to email" });
            }
        });
    } catch (error) {
        return res.send({ status: 'error', error: error.message });
    }
});

app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (otps[email] && otps[email] === otp) {
        delete otps[email]; // Remove OTP after verification
        return res.send({ status: "ok", data: "OTP verified" });
    } else {
        return res.send({ status: "error", data: "Invalid OTP" });
    }
});