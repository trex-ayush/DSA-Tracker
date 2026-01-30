const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Metadata = require('../models/Metadata');
const { optionalAuth, protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/questions/metadata
// @desc    Get system metadata (e.g. last updated time)
// @access  Public
router.get('/metadata', async (req, res) => {
  try {
    const meta = await Metadata.findOne({ key: 'questions_last_updated' });
    res.status(200).json({
      success: true,
      lastUpdated: meta ? meta.value : 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/questions
// @desc    Get all questions with filters
// @access  Public (with optional auth for tracking status)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      company,
      difficulty,
      topics,
      timeRange,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query = { isActive: true };

    // Company filter
    if (company) {
      query['companies.company'] = { $regex: company, $options: 'i' };
    }

    // Difficulty filter
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Topics filter
    if (topics) {
      const topicList = topics.split(',').map(t => t.trim());
      query.topics = { $in: topicList };
    }

    // Time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case '30days':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '2months':
          startDate = new Date(now.setMonth(now.getMonth() - 2));
          break;
        case '6months':
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case 'older':
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          query['companies.lastAskedDate'] = { $lt: startDate };
          break;
      }

      if (timeRange !== 'older') {
        query['companies.lastAskedDate'] = { $gte: startDate };
      }
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topics: { $regex: search, $options: 'i' } }
      ];
    }

    // Get user's tracking data if authenticated
    let userTracking = {};
    if (req.user) {
      const tracking = await Tracking.find({ user: req.user._id });
      tracking.forEach(t => {
        userTracking[t.question.toString()] = t;
      });
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const questions = await Question.find(query)
      .sort({ 'companies.lastAskedDate': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Question.countDocuments(query);

    // Transform questions with tracking status
    const questionsWithTracking = questions.map(q => {
      const tracking = userTracking[q._id.toString()];
      return {
        ...q,
        trackingStatus: tracking ? tracking.status : null,
        userNotes: tracking ? tracking.notes : null
      };
    });

    res.json({
      success: true,
      data: questionsWithTracking,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message
    });
  }
});

// @route   GET /api/questions/company-stats
// @desc    Get all companies with their question counts
// @access  Public
router.get('/company-stats', async (req, res) => {
  try {
    const companies = await Question.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$companies' },
      {
        $group: {
          _id: '$companies.company',
          count: { $sum: 1 },
          companyData: { $push: '$companies' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Simplified response: Just the array.
    // Client can derive lookup maps if needed.
    res.json({
      success: true,
      data: {
        companies: companies.map(c => ({ name: c._id, count: c.count }))
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
});

// @route   GET /api/questions/topics
// @desc    Get all unique topics
// @access  Public
router.get('/topics', async (req, res) => {
  try {
    const topics = await Question.distinct('topics');
    res.json({
      success: true,
      data: topics.filter(t => t).sort()
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching topics',
      error: error.message
    });
  }
});

// @route   GET /api/questions/home-stats
// @desc    Get optimized stats for home page (Total, Difficulty, FAANG, Top 12)
// @access  Public
router.get('/home-stats', async (req, res) => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $facet: {
          // 1. Difficulty Stats
          difficultyStats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                easy: { $sum: { $cond: [{ $eq: ["$difficulty", "Easy"] }, 1, 0] } },
                medium: { $sum: { $cond: [{ $eq: ["$difficulty", "Medium"] }, 1, 0] } },
                hard: { $sum: { $cond: [{ $eq: ["$difficulty", "Hard"] }, 1, 0] } }
              }
            }
          ],
          // 2. Company Counts (to derive FAANG and Top 12)
          companyCounts: [
            { $unwind: "$companies" },
            {
              $group: {
                _id: "$companies.company",
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ]
        }
      }
    ];

    const results = await Question.aggregate(pipeline);
    const stats = results[0].difficultyStats[0] || { total: 0, easy: 0, medium: 0, hard: 0 };
    const allCompanies = results[0].companyCounts || [];

    // FAANG Logic
    const faangNames = ['Meta', 'Apple', 'Amazon', 'Netflix', 'Google'];
    const faangMap = {};
    // Pre-fill with 0
    faangNames.forEach(f => faangMap[f] = 0);

    // Populate FAANG counts from allCompanies (lookup)
    allCompanies.forEach(c => {
      if (faangNames.includes(c._id)) {
        faangMap[c._id] = c.count;
      }
    });

    const faangData = faangNames.map(name => ({
      name,
      count: faangMap[name] || 0
    }));

    // Top 12 Logic (Excluding FAANG)
    const topCompanies = allCompanies
      .filter(c => !faangNames.includes(c._id)) // Exclude FAANG
      .slice(0, 12) // Take top 12 remaining
      .map(c => ({
        name: c._id,
        count: c.count
      }));

    res.json({
      success: true,
      data: {
        total: stats.total,
        easy: stats.easy,
        medium: stats.medium,
        hard: stats.hard,
        faang: faangData,
        topCompanies,
        totalCompanies: allCompanies.length
      }
    });

  } catch (error) {
    console.error('Home stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching home stats',
      error: error.message
    });
  }
});

// @route   GET /api/questions/stats
// @desc    Get question statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      total: await Question.countDocuments({ isActive: true }),
      byDifficulty: {
        Easy: await Question.countDocuments({ isActive: true, difficulty: 'Easy' }),
        Medium: await Question.countDocuments({ isActive: true, difficulty: 'Medium' }),
        Hard: await Question.countDocuments({ isActive: true, difficulty: 'Hard' })
      },
      byTimeRange: {
        last30Days: 0,
        last2Months: 0,
        last6Months: 0,
        older: 0
      }
    };

    const now = new Date();
    const last30Days = new Date(now.setDate(now.getDate() - 30));
    const last2Months = new Date(now.setMonth(now.getMonth() - 2));
    const last6Months = new Date(now.setMonth(now.getMonth() - 6));

    stats.byTimeRange.last30Days = await Question.countDocuments({
      isActive: true,
      'companies.lastAskedDate': { $gte: last30Days }
    });

    stats.byTimeRange.last2Months = await Question.countDocuments({
      isActive: true,
      'companies.lastAskedDate': { $gte: last2Months }
    });

    stats.byTimeRange.last6Months = await Question.countDocuments({
      isActive: true,
      'companies.lastAskedDate': { $gte: last6Months }
    });

    stats.byTimeRange.older = await Question.countDocuments({
      isActive: true,
      'companies.lastAskedDate': { $lt: last6Months }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

// @route   GET /api/questions/:id
// @desc    Get single question
// @access  Public (with optional auth for tracking status)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    let tracking = null;
    if (req.user) {
      tracking = await Tracking.findOne({
        user: req.user._id,
        question: question._id
      });
    }

    res.json({
      success: true,
      data: {
        ...question.toObject(),
        trackingStatus: tracking ? tracking.status : null,
        userNotes: tracking ? tracking.notes : null
      }
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question',
      error: error.message
    });
  }
});

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.create(req.body);

    // Update metadata for cache invalidation
    console.log('Updating questions_last_updated metadata...');
    await Metadata.findOneAndUpdate(
      { key: 'questions_last_updated' },
      { value: Date.now() },
      { upsert: true }
    );
    console.log('Metadata updated.');

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating question',
      error: error.message
    });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: error.message
    });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Also delete associated tracking records
    await Tracking.deleteMany({ question: req.params.id });

    // Update metadata for cache invalidation
    await Metadata.findOneAndUpdate(
      { key: 'questions_last_updated' },
      { value: Date.now() },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: error.message
    });
  }
});

module.exports = router;
