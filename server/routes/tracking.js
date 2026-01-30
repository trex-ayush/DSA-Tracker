const express = require('express');
const router = express.Router();
const Tracking = require('../models/Tracking');
const Question = require('../models/Question');
const { protect } = require('../middleware/auth');

// @route   GET /api/tracking
// @desc    Get all tracking records for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { isSolved, isRevise, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.user._id };
    if (isSolved !== undefined) {
      query.isSolved = isSolved === 'true';
    }
    if (isRevise !== undefined) {
      query.isRevise = isRevise === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tracking = await Tracking.find(query)
      .populate('question')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tracking.countDocuments(query);

    res.json({
      success: true,
      data: tracking,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracking data',
      error: error.message
    });
  }
});

// @route   GET /api/tracking/stats
// @desc    Get user tracking statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const tracking = await Tracking.find({ user: req.user._id });
    
    const stats = {
      total: tracking.length,
      solved: tracking.filter(t => t.isSolved).length,
      unsolved: tracking.filter(t => !t.isSolved).length,
      revising: tracking.filter(t => t.isRevise).length,
      bothSolvedAndRevise: tracking.filter(t => t.isSolved && t.isRevise).length,
      byDifficulty: {
        Easy: { total: 0, solved: 0 },
        Medium: { total: 0, solved: 0 },
        Hard: { total: 0, solved: 0 }
      },
      byCompany: {},
      recentlySolved: []
    };

    // Calculate difficulty-based stats
    for (const t of tracking) {
      if (t.question) {
        const difficulty = t.question.difficulty || 'Unknown';
        if (!stats.byDifficulty[difficulty]) {
          stats.byDifficulty[difficulty] = { total: 0, solved: 0 };
        }
        stats.byDifficulty[difficulty].total++;
        if (t.isSolved) {
          stats.byDifficulty[difficulty].solved++;
        }

        // Calculate company-based stats
        if (t.question.companies) {
          for (const company of t.question.companies) {
            if (!stats.byCompany[company.company]) {
              stats.byCompany[company.company] = { total: 0, solved: 0 };
            }
            stats.byCompany[company.company].total++;
            if (t.isSolved) {
              stats.byCompany[company.company].solved++;
            }
          }
        }
      }
    }

    // Get recently solved questions
    const recentlySolved = await Tracking.find({ user: req.user._id, isSolved: true })
      .populate('question')
      .sort({ solvedAt: -1 })
      .limit(5);

    stats.recentlySolved = recentlySolved;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get tracking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracking stats',
      error: error.message
    });
  }
});

// @route   POST /api/tracking/:questionId
// @desc    Create or update tracking for a question (toggle isSolved and isRevise independently)
// @access  Private
router.post('/:questionId', protect, async (req, res) => {
  try {
    const { isSolved, isRevise, notes } = req.body;
    const { questionId } = req.params;

    // Validate question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check for existing tracking record
    let tracking = await Tracking.findOne({
      user: req.user._id,
      question: questionId
    });

    if (tracking) {
      // Update existing tracking
      if (isSolved !== undefined) {
        tracking.isSolved = isSolved;
        if (isSolved) {
          tracking.solvedAt = new Date();
        } else {
          tracking.solvedAt = null;
        }
      }
      if (isRevise !== undefined) {
        tracking.isRevise = isRevise;
      }
      if (notes !== undefined) {
        tracking.notes = notes;
      }
      tracking = await tracking.save();
    } else {
      // Create new tracking
      tracking = await Tracking.create({
        user: req.user._id,
        question: questionId,
        isSolved: isSolved || false,
        isRevise: isRevise || false,
        notes: notes || null,
        solvedAt: isSolved ? new Date() : null
      });
    }

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Create tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tracking record',
      error: error.message
    });
  }
});

// @route   PUT /api/tracking/:questionId
// @desc    Update tracking status for a question (legacy support - updated for new schema)
// @access  Private
router.put('/:questionId', protect, async (req, res) => {
  try {
    const { isSolved, isRevise, notes } = req.body;
    const { questionId } = req.params;

    const updateData = {};
    if (isSolved !== undefined) {
      updateData.isSolved = isSolved;
      updateData.solvedAt = isSolved ? new Date() : null;
    }
    if (isRevise !== undefined) {
      updateData.isRevise = isRevise;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const tracking = await Tracking.findOneAndUpdate(
      { user: req.user._id, question: questionId },
      updateData,
      { new: true }
    );

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking record not found'
      });
    }

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tracking record',
      error: error.message
    });
  }
});

// @route   DELETE /api/tracking/:questionId
// @desc    Delete tracking record for a question
// @access  Private
router.delete('/:questionId', protect, async (req, res) => {
  try {
    const tracking = await Tracking.findOneAndDelete({
      user: req.user._id,
      question: req.params.questionId
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking record not found'
      });
    }

    res.json({
      success: true,
      message: 'Tracking record deleted successfully'
    });
  } catch (error) {
    console.error('Delete tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tracking record',
      error: error.message
    });
  }
});

module.exports = router;
