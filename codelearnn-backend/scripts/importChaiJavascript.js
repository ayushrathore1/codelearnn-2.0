/**
 * Import Script: Chai aur Javascript (Hindi JavaScript Tutorial)
 * 
 * This script imports the entire "Chai aur Javascript" playlist by Hitesh Choudhary
 * into the vault with AI-powered analysis and enhanced descriptions.
 * 
 * Usage: node scripts/importChaiJavascript.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const bulkImportService = require('../services/BulkImportService');

// Playlist ID extracted from URL
const PLAYLIST_ID = 'PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37';

// Course metadata
const COURSE_DATA = {
  name: 'Chai aur Javascript | Complete JavaScript in Hindi',
  provider: 'Chai aur Code (Hitesh Choudhary)',
  description: 'A comprehensive JavaScript course in Hindi that covers everything from basics to advanced concepts. Perfect for Hindi-speaking developers who want to master JavaScript from scratch.',
  level: 'beginner',
  targetAudience: 'Hindi-speaking developers, beginners learning JavaScript, students preparing for web development',
  tags: ['javascript', 'js', 'hindi', 'web development', 'frontend', 'chai aur code', 'hitesh choudhary', 'beginner', 'programming basics'],
  externalUrl: `https://youtube.com/playlist?list=${PLAYLIST_ID}`
};

/**
 * Fetch all videos from a YouTube playlist using the YouTube Data API
 */
async function fetchPlaylistVideos(playlistId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY not found in environment variables');
  }

  const videos = [];
  let nextPageToken = null;

  console.log('📥 Fetching playlist videos from YouTube API...');

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    
    const response = await axios.get(url);
    const data = response.data;

    for (const item of data.items) {
      const videoId = item.contentDetails.videoId;
      const title = item.snippet.title;
      
      // Skip private or deleted videos
      if (title === 'Private video' || title === 'Deleted video') {
        console.log(`   ⚠️ Skipping: ${title}`);
        continue;
      }

      videos.push({
        videoId,
        title,
        position: item.snippet.position,
        url: `https://www.youtube.com/watch?v=${videoId}`
      });
    }

    nextPageToken = data.nextPageToken;
    console.log(`   ✓ Fetched ${videos.length} videos so far...`);
  } while (nextPageToken);

  console.log(`✅ Total videos found: ${videos.length}`);
  return videos;
}

async function runImport() {
  console.log('🚀 Starting Chai aur Javascript Playlist Import');
  console.log('=' .repeat(60));
  
  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch all videos from the playlist
    console.log('\n📺 Fetching playlist videos...');
    const videos = await fetchPlaylistVideos(PLAYLIST_ID);
    
    // Sort by position to maintain order
    videos.sort((a, b) => a.position - b.position);
    
    const videoUrls = videos.map(v => v.url);

    // Run the import
    console.log('\n📚 Importing course...');
    console.log(`   Course: ${COURSE_DATA.name}`);
    console.log(`   Provider: ${COURSE_DATA.provider}`);
    console.log(`   Videos: ${videoUrls.length}`);
    console.log('\n');

    const result = await bulkImportService.importCourse(
      COURSE_DATA,
      videoUrls,
      {
        analyzeWithAI: true,
        category: 'javascript'
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
      console.log('\n📖 LECTURES (First 10):');
      result.results.successful.slice(0, 10).forEach((lecture, index) => {
        console.log(`   ${index + 1}. ${lecture.title}`);
        console.log(`      Score: ${lecture.score}/100`);
      });
      if (result.results.successful.length > 10) {
        console.log(`   ... and ${result.results.successful.length - 10} more`);
      }
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
