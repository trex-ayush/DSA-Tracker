const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Question = require('../models/Question');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-tracking';

const createIndexes = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB...');

        console.log('Creating indexes...');

        // Index for filtering by difficulty
        await Question.collection.createIndex({ difficulty: 1 });
        console.log('Created index: difficulty');

        // Index for filtering by company
        await Question.collection.createIndex({ 'companies.company': 1 });
        console.log('Created index: companies.company');

        // Index for filtering by date (latest first)
        await Question.collection.createIndex({ 'companies.lastAskedDate': -1 });
        console.log('Created index: companies.lastAskedDate');

        // Index for filtering by topics
        await Question.collection.createIndex({ topics: 1 });
        console.log('Created index: topics');

        // Compound index for active + lastAskedDate (common sort)
        await Question.collection.createIndex({ isActive: 1, 'companies.lastAskedDate': -1 });
        console.log('Created compound index: isActive + lastAskedDate');

        console.log('All indexes created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating indexes:', error);
        process.exit(1);
    }
};

createIndexes();
