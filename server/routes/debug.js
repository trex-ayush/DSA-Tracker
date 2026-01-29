const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// Debug endpoint to check company data
router.get('/check-companies', async (req, res) => {
  try {
    // Get sample questions with companies
    const questions = await Question.find({ isActive: true })
      .select('title companies')
      .limit(5);

    // Get total count
    const total = await Question.countDocuments({ isActive: true });

    // Get questions with companies
    const withCompanies = await Question.countDocuments({
      isActive: true,
      'companies.0': { $exists: true }
    });

    res.json({
      success: true,
      data: {
        totalQuestions: total,
        questionsWithCompanies: withCompanies,
        sampleQuestions: questions
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error debugging',
      error: error.message
    });
  }
});

module.exports = router;
