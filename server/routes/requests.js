const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const { protect, adminOnly } = require('../middleware/auth');

// @desc    Get all requests
// @route   GET /api/requests
// @access  Public
router.get('/', async (req, res) => {
    try {
        const requests = await Request.find()
            .populate('user', 'name email') // Populate name and email
            .populate('messages.sender', 'name role') // Populate sender details in messages
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @desc    Create a request
// @route   POST /api/requests
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { company, message } = req.body;

        const requestObj = {
            user: req.user.id,
            company,
            messages: []
        };

        if (message) {
            requestObj.messages.push({
                sender: req.user.id,
                content: message,
            });
        }

        const request = await Request.create(requestObj);

        // Populate to return the full object structure immediately
        await request.populate('user', 'name email');
        await request.populate('messages.sender', 'name role');

        res.status(201).json({
            success: true,
            data: request
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @desc    Add a message to a request
// @route   POST /api/requests/:id/message
// @access  Private
router.post('/:id/message', protect, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Only Admin or the Creator can add messages
        if (req.user.role !== 'admin' && request.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to comment on this request'
            });
        }

        // Block users from commenting on closed requests
        if (req.user.role !== 'admin' && (request.status === 'completed' || request.status === 'rejected')) {
            return res.status(400).json({
                success: false,
                message: `Cannot send message when request is ${request.status}`
            });
        }

        request.messages.push({
            sender: req.user.id,
            content
        });

        await request.save();

        // Re-populate for response
        await request.populate('messages.sender', 'name role');

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

// @desc    Update request status (Admin)
// @route   PUT /api/requests/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        request.status = status;

        // Optionally add a system message or notification here if desired
        // request.messages.push({ sender: req.user.id, content: `Status changed to ${status}`, isSystemMessage: true });

        await request.save();

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

module.exports = router;
