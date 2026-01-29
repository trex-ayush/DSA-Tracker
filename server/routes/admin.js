const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Question = require('../models/Question');
const { protect, adminOnly } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// @route   POST /api/admin/upload
// @desc    Upload CSV file with questions
// @access  Private (Admin only)
router.post('/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get company and askedIn from form data
    const { company, askedIn } = req.body;
    
    if (!company || !askedIn) {
      return res.status(400).json({
        success: false,
        message: 'Company and Asked In time range are required'
      });
    }

    const results = [];
    const filePath = req.file.path;

    // Read and parse CSV
    const stream = fs.createReadStream(filePath);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', (error) => reject(error));
    });

    const questions = [];
    const errors = [];

    // Process each row
    for (const [index, row] of results.entries()) {
      try {
        const questionData = {
          title: row.Title || row.title || row.Title?.trim(),
          difficulty: row.Difficulty || row.difficulty || row.Difficulty?.trim(),
          topics: (row.Topics || row.topics || '').split(',').map(t => t.trim()).filter(Boolean),
          link: row.URL || row.url || row.Link || row.link || row.URL?.trim(),
          acceptanceRate: parseFloat(row['Acceptance %'] || row['Acceptance Rate'] || row.acceptanceRate || 0),
          frequency: parseFloat(row['Frequency %'] || row['Frequency %'] || row.frequency || 0),
          companies: [{
            company: company,
            lastAskedDate: null,
            askedWithin: askedIn,
            frequency: parseFloat(row['Frequency %'] || row['Frequency %'] || row.frequency || 0)
          }]
        };

        if (!questionData.title || !questionData.difficulty || !questionData.link) {
          errors.push({ row: index + 1, message: 'Missing required fields' });
          continue;
        }

        questions.push(questionData);
      } catch (err) {
        errors.push({ row: index + 1, message: err.message });
      }
    }

    // Upsert questions
    let created = 0;
    let updated = 0;

    for (const q of questions) {
      const existing = await Question.findOne({ title: q.title, link: q.link });
      
      if (existing) {
        // Only update fields if they have meaningful values
        if (q.difficulty) existing.difficulty = q.difficulty;
        if (q.topics && q.topics.length > 0) existing.topics = q.topics;
        if (q.acceptanceRate > 0) existing.acceptanceRate = q.acceptanceRate;
        if (q.link) existing.link = q.link;
        
        // Always add new companies (don't replace existing ones)
        // This ensures multiple companies can tag the same question
        for (const newCompany of q.companies) {
          const companyExists = existing.companies.some(
            c => c.company.toLowerCase() === newCompany.company.toLowerCase()
          );
          
          if (!companyExists) {
            existing.companies.push(newCompany);
          }
        }
        
        await existing.save();
        updated++;
      } else {
        // Create new question
        await Question.create(q);
        created++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: {
        created,
        updated,
        errors: errors.length,
        details: errors
      }
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing CSV file',
      error: error.message
    });
  }
});

// @route   POST /api/admin/questions
// @desc    Create multiple questions at once
// @access  Private (Admin only)
router.post('/questions', protect, adminOnly, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required'
      });
    }

    const results = await Question.insertMany(questions, { ordered: false });

    res.status(201).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Bulk create questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating questions',
      error: error.message
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const stats = {
      totalQuestions: await Question.countDocuments(),
      totalUsers: require('../models/User').countDocuments(),
      questionsByDifficulty: {
        Easy: await Question.countDocuments({ difficulty: 'Easy' }),
        Medium: await Question.countDocuments({ difficulty: 'Medium' }),
        Hard: await Question.countDocuments({ difficulty: 'Hard' })
      },
      totalCompanies: (await Question.distinct('companies.company')).length,
      recentQuestions: await Question.find().sort({ createdAt: -1 }).limit(10)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin stats',
      error: error.message
    });
  }
});

module.exports = router;
