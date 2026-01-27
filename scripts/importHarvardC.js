/**
 * Import Script: Harvard edX - Introduction to Programming with C
 * 
 * This script imports the 4 Harvard C programming lecture videos into the vault
 * with AI-powered analysis and enhanced descriptions.
 * 
 * Usage: node scripts/importHarvardC.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bulkImportService = require('../services/BulkImportService');

// Harvard C Programming Course Videos
const COURSE_DATA = {
  name: 'Introduction to Programming with C',
  provider: 'Harvard edX',
  description: 'A comprehensive introduction to programming fundamentals using the C language, taught by Harvard University. Perfect for students new to programming who want to learn the foundations of computer science.',
  level: 'beginner',
  targetAudience: 'Students new to programming, those wanting to learn C as their first language, aspiring computer science students',
  tags: ['c', 'c programming', 'harvard', 'edx', 'beginner', 'fundamentals', 'programming basics', 'computer science'],
  externalUrl: 'https://www.edx.org/learn/c-programming/harvard-university-introduction-to-programming-with-c'
};

const VIDEO_URLS = [
  'https://www.youtube.com/live/2WtPyqwTLKM',
  'https://www.youtube.com/live/89cbCbWrM4U',
  'https://www.youtube.com/live/Y8qnryVy5sQ',
  'https://www.youtube.com/live/iCx3zwK8Ms8'
];

async function runImport() {
  console.log('🚀 Starting Harvard C Programming Course Import');
  console.log('=' .repeat(60));
  
  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Run the import
    console.log('\n📚 Importing course...');
    console.log(`   Course: ${COURSE_DATA.name}`);
    console.log(`   Provider: ${COURSE_DATA.provider}`);
    console.log(`   Videos: ${VIDEO_URLS.length}`);
    console.log('\n');

    const result = await bulkImportService.importCourse(
      COURSE_DATA,
      VIDEO_URLS,
      {
        analyzeWithAI: true,
        category: 'c-programming'
      }
    );

    // Print results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 IMPORT RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`\n✅ Course Created: ${result.course.name}`);
    console.log(`   Slug: ${result.course.slug}`);
    console.log(`   ID: ${result.course._id}`);
    
    console.log(`\n📹 Videos Processed: ${result.results.totalProcessed}`);
    console.log(`   ✓ Successful: ${result.results.successful.length}`);
    console.log(`   ✗ Failed: ${result.results.failed.length}`);

    if (result.results.successful.length > 0) {
      console.log('\n📖 LECTURES:');
      result.results.successful.forEach((lecture, index) => {
        console.log(`   ${index + 1}. ${lecture.title}`);
        console.log(`      Score: ${lecture.score}/100`);
      });
    }

    if (result.results.failed.length > 0) {
      console.log('\n⚠️ FAILED IMPORTS:');
      result.results.failed.forEach(fail => {
        console.log(`   - ${fail.lectureNumber}: ${fail.error}`);
      });
    }

    if (result.course.aiOverview) {
      console.log('\n🤖 AI COURSE OVERVIEW:');
      console.log(`   Summary: ${result.course.aiOverview.summary}`);
      if (result.course.aiOverview.learningObjectives) {
        console.log('   Learning Objectives:');
        result.course.aiOverview.learningObjectives.forEach(obj => {
          console.log(`     • ${obj}`);
        });
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Import Complete!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the import
runImport();
