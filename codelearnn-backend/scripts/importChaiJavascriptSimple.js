/**
 * Import Script: Chai aur Javascript (Hindi JavaScript Tutorial)
 * SIMPLIFIED VERSION - No AI analysis to avoid rate limits
 * 
 * This script imports the entire "Chai aur Javascript" playlist by Hitesh Choudhary
 * into the vault using basic YouTube metadata.
 * 
 * Usage: node scripts/importChaiJavascriptSimple.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Course = require('../models/Course');
const FreeResource = require('../models/FreeResource');

// Playlist ID extracted from URL
const PLAYLIST_ID = 'PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37';

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
        description: item.snippet.description || '',
        thumbnail: item.snippet.thumbnails?.maxres?.url || 
                   item.snippet.thumbnails?.high?.url || 
                   item.snippet.thumbnails?.medium?.url || '',
        position: item.snippet.position,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId || item.snippet.videoOwnerChannelId || 'UCNHFiyWgsnaSOsMtSoV_Q1A', // Hitesh Choudhary's channel ID as fallback
        publishedAt: item.snippet.publishedAt
      });
    }

    nextPageToken = data.nextPageToken;
    console.log(`   ✓ Fetched ${videos.length} videos so far...`);
  } while (nextPageToken);

  console.log(`✅ Total videos found: ${videos.length}`);
  return videos;
}

/**
 * Fetch video details (duration, view count, etc.)
 */
async function fetchVideoDetails(videoIds) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const details = {};
  
  // Process in batches of 50
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${batch.join(',')}&key=${apiKey}`;
    
    const response = await axios.get(url);
    
    for (const item of response.data.items) {
      const duration = item.contentDetails.duration;
      // Parse ISO 8601 duration (PT1H2M3S)
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match?.[1] || 0);
      const minutes = parseInt(match?.[2] || 0);
      const seconds = parseInt(match?.[3] || 0);
      const totalMinutes = hours * 60 + minutes + Math.ceil(seconds / 60);
      
      details[item.id] = {
        duration: totalMinutes > 60 ? `${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m` : `${totalMinutes}m`,
        durationMinutes: totalMinutes,
        viewCount: parseInt(item.statistics.viewCount || 0),
        likeCount: parseInt(item.statistics.likeCount || 0)
      };
    }
  }
  
  return details;
}

async function runImport() {
  console.log('🚀 Starting Chai aur Javascript Playlist Import (Simple Mode)');
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
    
    // Fetch video details
    console.log('\n📊 Fetching video details...');
    const videoIds = videos.map(v => v.videoId);
    const details = await fetchVideoDetails(videoIds);

    // Check if course already exists
    let course = await Course.findOne({ 
      slug: 'chai-aur-code-hitesh-choudhary-chai-aur-javascript-complete-javascript-in-hindi' 
    });
    
    if (!course) {
      // Create course
      console.log('\n📚 Creating course...');
      course = await Course.create({
        name: 'Chai aur Javascript | Complete JavaScript in Hindi',
        provider: 'Chai aur Code (Hitesh Choudhary)',
        description: 'A comprehensive JavaScript course in Hindi that covers everything from basics to advanced concepts. Perfect for Hindi-speaking developers who want to master JavaScript from scratch. This popular series by Hitesh Choudhary covers variables, data types, functions, DOM manipulation, async/await, promises, and much more.',
        category: 'javascript',
        level: 'beginner',
        targetAudience: 'Hindi-speaking developers, beginners learning JavaScript, students preparing for web development',
        tags: ['javascript', 'js', 'hindi', 'web development', 'frontend', 'chai aur code', 'hitesh choudhary', 'beginner', 'programming basics', 'dom', 'async', 'promises'],
        externalUrl: `https://youtube.com/playlist?list=${PLAYLIST_ID}`,
        thumbnail: videos[0]?.thumbnail || '',
        isFeatured: true
      });
      console.log(`✅ Course created: ${course.name}`);
    } else {
      console.log(`ℹ️ Course already exists: ${course.name}`);
    }

    // Import videos
    console.log('\n📹 Importing videos...');
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoDetail = details[video.videoId] || {};
      
      // Check if video already exists
      const existing = await FreeResource.findOne({ youtubeId: video.videoId });
      if (existing) {
        console.log(`   ⏭️ Skip ${i+1}/${videos.length}: Already exists - ${video.title.substring(0, 50)}...`);
        skipCount++;
        continue;
      }

      try {
        // Create resource with all required fields
        await FreeResource.create({
          title: video.title,
          description: video.description.substring(0, 2000) || 'JavaScript tutorial from Chai aur Code series.',
          type: 'youtube',
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          youtubeId: video.videoId,
          thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
          duration: videoDetail.duration || '10m',
          durationMinutes: videoDetail.durationMinutes || 10,
          category: 'javascript',
          courseId: course._id,
          lectureOrder: i + 1,
          channelName: video.channelTitle || 'Chai aur Code',
          channelId: video.channelId || 'UCNHFiyWgsnaSOsMtSoV_Q1A',
          viewCount: videoDetail.viewCount || 0,
          likeCount: videoDetail.likeCount || 0,
          publishedAt: video.publishedAt ? new Date(video.publishedAt) : new Date(),
          codeLearnnScore: 75, // Default good score for curated content
          qualityTier: 'good',
          tags: ['javascript', 'hindi', 'tutorial', 'chai aur code'],
          isActive: true
        });
        
        successCount++;
        console.log(`   ✅ ${i+1}/${videos.length}: ${video.title.substring(0, 50)}...`);
      } catch (err) {
        failCount++;
        console.log(`   ❌ ${i+1}/${videos.length}: Failed - ${err.message}`);
      }
    }

    // Update course stats
    await course.updateStats();

    // Print results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 IMPORT RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`\n✅ Course: ${course.name}`);
    console.log(`   Slug: ${course.slug}`);
    console.log(`   ID: ${course._id}`);
    
    console.log(`\n📹 Videos:`);
    console.log(`   ✓ Imported: ${successCount}`);
    console.log(`   ⏭️ Skipped (already exist): ${skipCount}`);
    console.log(`   ✗ Failed: ${failCount}`);
    console.log(`   📊 Total in playlist: ${videos.length}`);

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
