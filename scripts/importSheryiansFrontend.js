/**
 * Import Script: Sheryians Frontend Course
 * 
 * This script extracts FRONTEND videos from the Full Stack Web Development playlist
 * by Sheryians Coding School and imports them as a dedicated Frontend course.
 * 
 * Source: https://youtube.com/playlist?list=PLbtI3_MArDOkxh7XzixN2G4NAGIVqTFon
 * 
 * Frontend videos are identified by keywords like: HTML, CSS, JavaScript, DOM,
 * React, Vue, Angular, Bootstrap, Tailwind, responsive, forms, UI, frontend, etc.
 * 
 * Usage: node scripts/importSheryiansFrontend.js [--analyze] [--dry-run]
 * Options:
 *   --analyze   Run AI analysis on videos (slower, uses Groq API)
 *   --dry-run   Preview which videos would be imported without saving
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Course = require('../models/Course');
const FreeResource = require('../models/FreeResource');
const groqService = require('../services/GroqService');

// Playlist ID extracted from URL
const PLAYLIST_ID = 'PLbtI3_MArDOkxh7XzixN2G4NAGIVqTFon';

// Parse command line arguments
const args = process.argv.slice(2);
const RUN_AI_ANALYSIS = args.includes('--analyze');
const DRY_RUN = args.includes('--dry-run');



// Backend-related keywords that should exclude a video from frontend course
const BACKEND_EXCLUSION_KEYWORDS = [
  'backend', 'back-end', 'back end',
  'microservices', 'microservice',
  'node.js backend', 'express backend',
  'uber clone', 'mern stack complete',
  'device track', 'socket.io'
];

// Specific video IDs to exclude (backend tutorials)
const EXCLUDE_VIDEO_IDS = [
  'Q-icS7yZz5k',  // Learn Backend Development in 4 Hours
  'jbvh0jn4h9k',  // Master Microservices with UBER Project
  'JmpDGMgRFfo',  // Backend Project: Realtime Device track
  '4qyBjxPlEZo'   // Uber Clone App with MERN Stack
];

/**
 * Check if a video should be EXCLUDED (is a backend video)
 */
function isBackendVideo(videoId, title, description = '') {
  // Check if video ID is in exclusion list
  if (EXCLUDE_VIDEO_IDS.includes(videoId)) {
    return true;
  }
  
  const text = `${title} ${description}`.toLowerCase();
  
  // Check for backend exclusion keywords
  for (const keyword of BACKEND_EXCLUSION_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

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
        channelId: item.snippet.channelId || item.snippet.videoOwnerChannelId,
        publishedAt: item.snippet.publishedAt
      });
    }

    nextPageToken = data.nextPageToken;
    console.log(`   ✓ Fetched ${videos.length} videos so far...`);
  } while (nextPageToken);

  console.log(`✅ Total videos in playlist: ${videos.length}`);
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
        likeCount: parseInt(item.statistics.likeCount || 0),
        commentCount: parseInt(item.statistics.commentCount || 0)
      };
    }
  }
  
  return details;
}

/**
 * Fetch video comments for AI analysis
 */
async function fetchVideoComments(videoId, maxComments = 50) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxComments}&order=relevance&key=${apiKey}`;
    const response = await axios.get(url);
    
    return response.data.items?.map(item => ({
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt
    })) || [];
  } catch (error) {
    // Comments might be disabled
    return [];
  }
}

/**
 * Get quality tier from score
 */
function getQualityTier(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'average';
  if (score >= 40) return 'below_average';
  return 'poor';
}

/**
 * Analyze video with AI
 */
async function analyzeVideoWithAI(video, videoDetail) {
  try {
    const videoData = {
      id: video.videoId,
      title: video.title,
      description: video.description,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt,
      statistics: {
        viewCount: videoDetail?.viewCount || 0,
        likeCount: videoDetail?.likeCount || 0,
        commentCount: videoDetail?.commentCount || 0
      },
      contentDetails: {
        duration: videoDetail?.duration || '10m'
      }
    };

    const comments = await fetchVideoComments(video.videoId);
    
    const evaluation = await groqService.evaluateVideoQuality(videoData, comments);
    
    return evaluation;
  } catch (error) {
    console.log(`   ⚠️ AI analysis failed: ${error.message}`);
    return null;
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runImport() {
  console.log('🚀 Starting Sheryians Frontend Course Import');
  console.log('=' .repeat(70));
  console.log(`   Playlist: ${PLAYLIST_ID}`);
  console.log(`   AI Analysis: ${RUN_AI_ANALYSIS ? 'Enabled' : 'Disabled'}`);
  console.log(`   Dry Run: ${DRY_RUN ? 'Yes (no changes will be saved)' : 'No'}`);
  console.log('=' .repeat(70));
  
  try {
    // Connect to MongoDB
    if (!DRY_RUN) {
      console.log('\n📡 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Fetch all videos from the playlist
    console.log('\n📺 Fetching playlist videos...');
    const allVideos = await fetchPlaylistVideos(PLAYLIST_ID);
    
    // Filter out backend videos (include everything else)
    console.log('\n🔍 Filtering out backend videos...');
    const frontendVideos = allVideos.filter(v => !isBackendVideo(v.videoId, v.title, v.description));
    
    // Sort by position to maintain order
    frontendVideos.sort((a, b) => a.position - b.position);
    
    console.log(`   📊 Total videos in playlist: ${allVideos.length}`);
    console.log(`   ✅ Frontend videos identified: ${frontendVideos.length}`);
    console.log(`   🚫 Backend/excluded videos: ${allVideos.length - frontendVideos.length}`);
    
    // Print the filtered videos
    console.log('\n📋 Frontend Videos to Import:');
    console.log('-'.repeat(70));
    frontendVideos.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.title.substring(0, 60)}...`);
    });
    console.log('-'.repeat(70));

    if (DRY_RUN) {
      console.log('\n🔵 DRY RUN - No changes made.');
      console.log('\n📋 Videos that would be EXCLUDED (backend):');
      console.log('-'.repeat(70));
      const excludedVideos = allVideos.filter(v => isBackendVideo(v.videoId, v.title, v.description));
      excludedVideos.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.title.substring(0, 60)}...`);
      });
      return;
    }
    
    // Fetch video details
    console.log('\n📊 Fetching video details...');
    const videoIds = frontendVideos.map(v => v.videoId);
    const details = await fetchVideoDetails(videoIds);

    // Check if course already exists
    const courseSlug = 'sheryians-coding-school-frontend-web-development';
    let course = await Course.findOne({ slug: courseSlug });
    
    if (!course) {
      // Create course
      console.log('\n📚 Creating Frontend course...');
      course = await Course.create({
        name: 'Frontend Web Development Complete Course',
        provider: 'Sheryians Coding School',
        description: 'A comprehensive frontend web development course extracted from the Full Stack Web Development playlist by Sheryians Coding School. This course covers HTML, CSS, JavaScript, DOM manipulation, responsive design, animations, and modern frontend development practices. Perfect for beginners who want to master frontend development from scratch.',
        category: 'web-dev',
        level: 'beginner',
        targetAudience: 'Beginners learning frontend development, aspiring web developers, students preparing for frontend careers',
        tags: ['frontend', 'html', 'css', 'javascript', 'web development', 'dom', 'responsive design', 'animations', 'sheryians'],
        externalUrl: `https://youtube.com/playlist?list=${PLAYLIST_ID}`,
        thumbnail: frontendVideos[0]?.thumbnail || '',
        isFeatured: true
      });
      console.log(`✅ Course created: ${course.name}`);
    } else {
      console.log(`ℹ️ Course already exists: ${course.name}`);
    }

    // Import videos
    console.log('\n📹 Importing frontend videos...');
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    const analyzedScores = [];

    for (let i = 0; i < frontendVideos.length; i++) {
      const video = frontendVideos[i];
      const videoDetail = details[video.videoId] || {};
      
      // Check if video already exists
      const existing = await FreeResource.findOne({ youtubeId: video.videoId });
      if (existing) {
        console.log(`   ⏭️ Skip ${i+1}/${frontendVideos.length}: Already exists - ${video.title.substring(0, 40)}...`);
        skipCount++;
        continue;
      }

      try {
        let codeLearnnScore = 75; // Default score
        let qualityTier = 'good';
        let aiAnalysis = null;

        // Run AI analysis if enabled
        if (RUN_AI_ANALYSIS) {
          console.log(`   🤖 Analyzing ${i+1}/${frontendVideos.length}: ${video.title.substring(0, 40)}...`);
          const evaluation = await analyzeVideoWithAI(video, videoDetail);
          
          if (evaluation) {
            codeLearnnScore = evaluation.codeLearnnScore || 75;
            qualityTier = evaluation.qualityTier || getQualityTier(codeLearnnScore);
            aiAnalysis = {
              breakdown: evaluation.breakdown || {},
              penalties: evaluation.penalties || { outdated: 0, confusion: 0 },
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
            analyzedScores.push(codeLearnnScore);
          }
          
          // Delay to avoid rate limits
          if (i < frontendVideos.length - 1) {
            await delay(3000); // 3 second delay
          }
        }

        // Create resource
        const resourceData = {
          title: video.title,
          description: video.description.substring(0, 2000) || 'Frontend web development tutorial from Sheryians Coding School.',
          type: 'youtube',
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          youtubeId: video.videoId,
          thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
          duration: videoDetail.duration || '10m',
          durationMinutes: videoDetail.durationMinutes || 10,
          category: 'web-dev',
          courseId: course._id,
          lectureOrder: i + 1,
          channelName: video.channelTitle || 'Sheryians Coding School',
          channelId: video.channelId,
          publishedAt: video.publishedAt ? new Date(video.publishedAt) : new Date(),
          codeLearnnScore,
          qualityTier,
          statistics: {
            viewCount: videoDetail.viewCount || 0,
            likeCount: videoDetail.likeCount || 0,
            commentCount: videoDetail.commentCount || 0,
            lastUpdated: new Date()
          },
          tags: ['frontend', 'html', 'css', 'javascript', 'sheryians'],
          isActive: true
        };

        if (aiAnalysis) {
          resourceData.aiAnalysis = aiAnalysis;
        }

        await FreeResource.create(resourceData);
        
        successCount++;
        const scoreDisplay = RUN_AI_ANALYSIS ? ` (Score: ${codeLearnnScore})` : '';
        console.log(`   ✅ ${i+1}/${frontendVideos.length}: ${video.title.substring(0, 40)}...${scoreDisplay}`);
      } catch (err) {
        failCount++;
        console.log(`   ❌ ${i+1}/${frontendVideos.length}: Failed - ${err.message}`);
      }
    }

    // Update course stats
    await course.updateStats();

    // Print results
    console.log('\n' + '=' .repeat(70));
    console.log('📊 IMPORT RESULTS');
    console.log('=' .repeat(70));
    
    console.log(`\n✅ Course: ${course.name}`);
    console.log(`   Slug: ${course.slug}`);
    console.log(`   ID: ${course._id}`);
    console.log(`   Lecture Count: ${course.lectureCount}`);
    console.log(`   Total Duration: ${course.totalDuration}`);
    console.log(`   Average Score: ${course.averageScore}`);
    
    console.log(`\n📹 Videos:`);
    console.log(`   ✓ Imported: ${successCount}`);
    console.log(`   ⏭️ Skipped (already exist): ${skipCount}`);
    console.log(`   ✗ Failed: ${failCount}`);
    console.log(`   📊 Total frontend videos: ${frontendVideos.length}`);

    if (RUN_AI_ANALYSIS && analyzedScores.length > 0) {
      const avgScore = Math.round(analyzedScores.reduce((a, b) => a + b, 0) / analyzedScores.length);
      console.log(`\n🤖 AI Analysis:`);
      console.log(`   Analyzed: ${analyzedScores.length} videos`);
      console.log(`   Average Score: ${avgScore}/100`);
      console.log(`   Highest Score: ${Math.max(...analyzedScores)}/100`);
      console.log(`   Lowest Score: ${Math.min(...analyzedScores)}/100`);
    }

    console.log('\n' + '=' .repeat(70));
    console.log('🎉 Import Complete!');
    console.log('=' .repeat(70));
    
    if (!RUN_AI_ANALYSIS) {
      console.log('\n💡 Tip: Run with --analyze flag to add AI-generated scores:');
      console.log('   node scripts/importSheryiansFrontend.js --analyze');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error);
  } finally {
    // Close MongoDB connection
    if (!DRY_RUN && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📡 Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

// Run the import
runImport();
