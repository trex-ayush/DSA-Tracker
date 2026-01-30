const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Question = require('../models/Question');
const Metadata = require('../models/Metadata');
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

    // Optimized: Use bulkWrite for performance
    const operations = [];

    // Fetch potentially matching questions
    const titles = questions.map(q => q.title);
    const existingQuestions = await Question.find({
      title: { $in: titles }
    }).select('title link companies');

    const existingMap = new Map();
    existingQuestions.forEach(q => existingMap.set(q.title + '|' + q.link, q)); // Key by title+link

    let createdCount = 0;
    let updatedCount = 0;

    for (const q of questions) {
      const key = q.title + '|' + q.link;
      const existing = existingMap.get(key);

      if (existing) {
        // Prepare update operation
        const updateFields = {};
        // Only update if value is present and valid
        if (q.difficulty) updateFields.difficulty = q.difficulty;
        if (q.topics && q.topics.length > 0) updateFields.topics = q.topics;
        if (q.acceptanceRate > 0) updateFields.acceptanceRate = q.acceptanceRate;
        if (q.link) updateFields.link = q.link;
        if (q.frequency > 0) updateFields.frequency = q.frequency;

        // Check for new companies to add
        // existing.companies is an array of objects { company, askedWithin, ... }
        // We want to add q.companies[0] if it doesn't exist (by name)

        const newCompanies = q.companies.filter(nc =>
          !existing.companies.some(ec => ec.company.toLowerCase() === nc.company.toLowerCase())
        );

        if (newCompanies.length > 0) {
          operations.push({
            updateOne: {
              filter: { _id: existing._id },
              update: {
                $set: updateFields,
                $push: { companies: { $each: newCompanies } }
              }
            }
          });
          updatedCount++;
        } else if (Object.keys(updateFields).length > 0) {
          operations.push({
            updateOne: {
              filter: { _id: existing._id },
              update: { $set: updateFields }
            }
          });
          updatedCount++;
        }
      } else {
        // Insert operation
        operations.push({
          insertOne: {
            document: q
          }
        });
        createdCount++;
      }
    }

    if (operations.length > 0) {
      console.log(`Executing ${operations.length} bulk write operations...`);
      await Question.bulkWrite(operations);

      // Update system metadata
      console.log('Updating metadata from CSV Upload...');
      await Metadata.findOneAndUpdate(
        { key: 'questions_last_updated' },
        { value: Date.now(), updatedAt: Date.now() },
        { upsert: true, new: true }
      );
      console.log('Metadata updated successfully.');
    } else {
      console.log('No operations to perform (no new data).');
    }

    // Clean up uploaded file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error deleting file:', e);
    }

    res.json({
      success: true,
      data: {
        created: createdCount,
        updated: updatedCount,
        errors: errors.length,
        details: errors
      }
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    // Cleanup file if error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { }
    }

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

    // Update system metadata
    await Metadata.findOneAndUpdate(
      { key: 'questions_last_updated' },
      { value: Date.now(), updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    console.log('Bulk questions created, metadata updated.');

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
      totalUsers: await require('../models/User').countDocuments(),
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
