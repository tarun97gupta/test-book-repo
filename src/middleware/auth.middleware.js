import User from "../models/User.js";
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const protectRoute = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        if(!token){
            return res.status(401).json({ message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if(!user){
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        next();
    } catch (error) {
        console.log(error,'Error in Protect Route');
        return res.status(500).json({ message: "Internal server error" });
    }
}

export default protectRoute;