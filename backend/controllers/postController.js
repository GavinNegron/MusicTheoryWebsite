const Posts = require('../models/Posts');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();
const axios = require('axios');
const { ObjectId } = require('mongoose').Types;  // Import ObjectId for validation

const storage = new Storage({
    keyFilename: undefined, 
    credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.PRIVATE_KEY_ID,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.CLIENT_EMAIL,
        client_id: process.env.CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/admin-805%40nofunmondays.iam.gserviceaccount.com',
    },
});

const bucketName = "nofunmondays";

// Get all posts
const getPosts = async (req, res) => {
    try {
        const posts = await Posts.find();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: `Server Error: \n ${error}` });
    }
};

// Get recent posts with a limit
const getRecentPosts = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        const featuredPost = await Posts.findOne({ featured: true });

        const posts = await Posts.find({ _id: { $ne: featuredPost?._id } })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: `Server Error: \n ${error}` });
    }
};

// Get featured post
const getFeaturedPost = async (req, res) => {
    try {
        const featuredPost = await Posts.findOne({ featured: true });
        if (!featuredPost) {
            return res.status(404).json({ message: 'No featured post found.' });
        }
        res.status(200).json(featuredPost);
    } catch (error) {
        res.status(500).json({ message: `Server Error: \n ${error}` });
    }
};

// Set a post as featured
const setFeaturedPost = async (req, res) => {
    try {
        const { postId } = req.params;
        await Posts.updateMany({}, { featured: false });
        await Posts.findByIdAndUpdate(postId, { featured: true });

        const updatedPost = await Posts.findById(postId);
        res.status(200).json(updatedPost);
    } catch(error) {
        res.status(500).json({ message: `Server Error: \n ${error}` });
    }
};

// Create a new post
const setPost = async (req, res) => {
    const { title, description, imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
    }

    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];
        const fileName = `images/${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        await file.save(response.data, { metadata: { contentType } });
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

        const post = await Posts.create({
            title,
            description,
            imageUrl: publicUrl,
        });

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a post (currently a placeholder)
const updatePost = async (req, res) => {
    res.status(200).json({ message: 'Test Update' });
};

// Delete a post
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;  // Get postId from the URL parameter
        console.log('Received ID:', id);  // Log the ID for debugging

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const post = await Posts.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await post.remove();
        return res.status(200).json({ message: 'Post deleted successfully', id });
    } catch (error) {
        return res.status(500).json({ message: `Server Error: \n ${error.message}` });
    }
};

module.exports = {
    getRecentPosts, 
    getFeaturedPost, 
    setFeaturedPost, 
    setPost, 
    updatePost, 
    deletePost, 
    getPosts,
};
