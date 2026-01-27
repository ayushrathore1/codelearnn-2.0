/**
 * Update Scores Script - Analyze imported videos with AI
 * 
 * This script updates the scores for videos that were bulk imported
 * without AI analysis, processing them one at a time with delays
 * to avoid rate limits.
 * 
 * Usage: node scripts/updateVideoScores.js [batchSize] [delayMs]
 * Example: node scripts/updateVideoScores.js 5 10000
 */

require('dotenv').config();
const mongoose = require('mongoose');
const FreeResource = require('../models/FreeResource');
const groqService = require('../services/GroqService');
const youtubeService = require('../services/YouTubeService');

// Configuration
const BATCH_SIZE = parseInt(process.argv[2]) || 5;
const DELAY_MS = parseInt(process.argv[3]) || 10000; // 10 seconds between videos

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function analyzeVideo(resource) {
  try {
    // Fetch video data
    const videoData = await youtubeService.getVideoDetails(resource.youtubeId);
    if (!videoData) {
      console.log(`   ⚠️ Could not fetch video data for ${resource.youtubeId}`);
      return null;
    }

    // Fetch comments
    const comments = await youtubeService.getVideoComments(resource.youtubeId);

    // Run AI evaluation
    const evaluation = await groqService.evaluateVideoQuality(videoData, comments);
    if (!evaluation) {
      console.log(`   ⚠️ AI evaluation failed for ${resource.youtubeId}`);
      return null;
    }

    // Update resource with AI analysis
    resource.codeLearnnScore = evaluation.codeLearnnScore || 75;
    resource.qualityTier = evaluation.qualityTier || getQualityTier(evaluation.codeLearnnScore);
    resource.aiAnalysis = {
      breakdown: evaluation.breakdown || {
        engagement: 0,
        contentQuality: 0,
        teachingClarity: 0,
        practicalValue: 0,
        upToDateScore: 0,
        commentSentiment: 0
      },
      penalties: evaluation.penalties || {
        outdated: 0,
        confusion: 0
      },
      evaluationConfidence: evaluation.evaluationConfidence || 'medium',
      recommendation: evaluation.recommendation || 'neutral',
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      redFlags: evaluation.redFlags || [],
      recommendedFor: evaluation.recommendedFor || '',
      notRecommendedFor: evaluation.notRecommendedFor || '',
      summary: evaluation.summary || '',
      evaluatedAt: new Date()
    };

    await resource.save();
    return evaluation.codeLearnnScore;
  } catch (error) {
    console.log(`   ❌ Error analyzing ${resource.youtubeId}: ${error.message}`);
    return null;
  }
}

function getQualityTier(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'average';
  if (score >= 40) return 'below_average';
  return 'poor';
}

async function runUpdate() {
  console.log('🚀 Starting Video Score Update');
  console.log(`   Batch Size: ${BATCH_SIZE}`);
  console.log(`   Delay: ${DELAY_MS}ms between videos`);
  console.log('=' .repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find videos with default score (75) that need analysis
    const videosToAnalyze = await FreeResource.find({
      codeLearnnScore: 75,
      category: 'javascript',
      'aiAnalysis.evaluatedAt': { $exists: false }
    }).limit(BATCH_SIZE);

    console.log(`\n📹 Found ${videosToAnalyze.length} videos to analyze`);

    if (videosToAnalyze.length === 0) {
      console.log('✅ All videos have been analyzed!');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < videosToAnalyze.length; i++) {
      const video = videosToAnalyze[i];
      console.log(`\n[${i + 1}/${videosToAnalyze.length}] ${video.title.substring(0, 50)}...`);

      const score = await analyzeVideo(video);
      
      if (score !== null) {
        console.log(`   ✅ Score: ${score}/100`);
        successCount++;
      } else {
        failCount++;
      }

      // Delay before next video
      if (i < videosToAnalyze.length - 1) {
        console.log(`   ⏳ Waiting ${DELAY_MS/1000}s before next video...`);
        await delay(DELAY_MS);
      }
    }

    // Get remaining count
    const remainingCount = await FreeResource.countDocuments({
      codeLearnnScore: 75,
      category: 'javascript',
      'aiAnalysis.evaluatedAt': { $exists: false }
    });

    console.log('\n' + '=' .repeat(60));
    console.log('📊 UPDATE RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ Analyzed: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📋 Remaining: ${remainingCount}`);
    console.log('\n💡 Run this script again to process more videos.');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

runUpdate();
