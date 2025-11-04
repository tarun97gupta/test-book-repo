import express from 'express';
import cloudinary from '../lib/cloudinary.js';
import Book from '../models/Book.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();


router.post("/", protectRoute, async (req, res) => {
    try {
        const { title, caption, image, rating } = req.body;

        if (!title || !caption || !image || !rating) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const result = await cloudinary.uploader.upload(image);
        const imageUrl = result.secure_url;

        const book = await Book.create({ title, caption, image: imageUrl, rating, user: req.user.id });
        await book.save()
        return res.status(201).json({ message: "Book created successfully", book });
    } catch (error) {
        console.log(error, 'Error in Create Book Route');
        return res.status(500).json({ message: "Internal server error" });
    }
})

router.get("/", protectRoute, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const books = await Book.find().skip(skip).limit(limit).populate('user', 'username profilePicture');
        const total = await Book.countDocuments();
        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({ message: "Books fetched successfully", books, total, currentPage: page, limit, totalPages });

    } catch (error) {
        console.log(error, 'Error in Get Books Route');
        return res.status(500).json({ message: "Internal server error" });
    }
})

router.get("/user", protectRoute, async (req, res) => {
    try {
        const books = await Book.find({user: req.user.id}).sort({createdAt: -1});
        return res.status(200).json({ message: "Books fetched successfully", books });
    } catch (error) {
        console.log(error, 'Error in Get User Books Route');
        return res.status(500).json({ message: "Internal server error" });
    }
})

router.delete("/:id", protectRoute, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        if (book.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (book.image && book.image.includes('cloudinary')) {
           try {
            const publicId = book.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
           } catch (deleteError) {
            console.log(deleteError, 'Error in Delete Image from Cloudinary');
           }
        }
        await book.deleteOne();
        return res.status(200).json({ message: "Book deleted successfully" });
    } catch (error) {
        console.log(error, 'Error in Delete Book Route');
        return res.status(500).json({ message: "Internal server error" });
    }
})



export default router;