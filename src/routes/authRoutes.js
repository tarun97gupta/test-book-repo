import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '10h' });
}

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }
        if (username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters long" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const user = await User.create({ username, email, password, profilePicture: "" });

        await user.save();

        const token = generateToken(user._id);
        return res.status(201).json({
            message: "User created successfully", user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            }, token
        });

    } catch (error) {
        console.log(error, 'Error in Register Route');
        return res.status(500).json({ message: "Internal server error" });
    }

});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = generateToken(user._id);
        return res.status(200).json({
            message: "Login successful", user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            }, token
        });

    } catch (error) {
        console.log(error, 'Error in Login Route');
        return res.status(500).json({ message: "Internal server error" });
    }
});


export default router;