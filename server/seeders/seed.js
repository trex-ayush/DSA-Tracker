const mongoose = require('mongoose');
const Question = require('../models/Question');
const User = require('../models/User');
const path = require('path');

// Load .env from server directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sampleQuestions = [
  {
    title: "Two Sum",
    difficulty: "Easy",
    topics: ["Array", "Hash Table"],
    link: "https://leetcode.com/problems/two-sum",
    acceptanceRate: 49.2,
    companies: [
      {
        company: "Google",
        lastAskedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        askedWithin: "30days",
        frequency: 5
      },
      {
        company: "Amazon",
        lastAskedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        askedWithin: "30days",
        frequency: 4
      }
    ]
  },
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topics: ["Hash Table", "String", "Sliding Window"],
    link: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
    acceptanceRate: 32.1,
    companies: [
      {
        company: "Meta",
        lastAskedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        askedWithin: "2months",
        frequency: 3
      },
      {
        company: "Apple",
        lastAskedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        askedWithin: "2months",
        frequency: 2
      }
    ]
  },
  {
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    topics: ["Array", "Binary Search", "Divide and Conquer"],
    link: "https://leetcode.com/problems/median-of-two-sorted-arrays",
    acceptanceRate: 29.8,
    companies: [
      {
        company: "Google",
        lastAskedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        askedWithin: "6months",
        frequency: 2
      },
      {
        company: "Microsoft",
        lastAskedDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        askedWithin: "older",
        frequency: 1
      }
    ]
  },
  {
    title: "Valid Parentheses",
    difficulty: "Easy",
    topics: ["Stack", "String"],
    link: "https://leetcode.com/problems/valid-parentheses",
    acceptanceRate: 40.5,
    companies: [
      {
        company: "Amazon",
        lastAskedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        askedWithin: "30days",
        frequency: 4
      },
      {
        company: "Microsoft",
        lastAskedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        askedWithin: "30days",
        frequency: 3
      }
    ]
  },
  {
    title: "Reverse Linked List",
    difficulty: "Easy",
    topics: ["Linked List", "Recursion"],
    link: "https://leetcode.com/problems/reverse-linked-list",
    acceptanceRate: 65.3,
    companies: [
      {
        company: "Meta",
        lastAskedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        askedWithin: "30days",
        frequency: 3
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017dsa-tracking');
    console.log('MongoDB connected');

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Insert sample questions
    await Question.insertMany(sampleQuestions);
    console.log('Sample questions inserted');

    // Create admin user if not exists
    const adminEmail = 'admin@dsatracker.com';
    const adminPassword = 'admin123';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      console.log('Admin user created:');
      console.log('  Email: admin@dsatracker.com');
      console.log('  Password: admin123');
    } else {
      console.log('Admin user already exists');
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
