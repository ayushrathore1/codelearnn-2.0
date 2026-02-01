/**
 * Data Migration Script
 * 
 * Migrates existing data to support new architecture:
 * 1. Migrates analyzed videos to SavedVideo format
 * 2. Creates initial UserLearningPath for existing users
 * 3. Generates initial version records for existing paths
 * 4. Populates readiness scores
 * 
 * Run with: node scripts/migrateExistingData.js [--dry-run]
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Models
const User = require('../models/User');
const SavedVideo = require('../models/SavedVideo');
const UserLearningPath = require('../models/UserLearningPath');
const LearningPathVersion = require('../models/LearningPathVersion');

// Services
const CareerReadinessService = require('../services/CareerReadinessService');

const isDryRun = process.argv.includes('--dry-run');

async function migrate() {
  console.log('===================================');
  console.log('CodeLearnn Data Migration Script');
  console.log('===================================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    const stats = {
      usersProcessed: 0,
      savedVideosMigrated: 0,
      learningPathsCreated: 0,
      versionRecordsCreated: 0,
      readinessScoresCalculated: 0,
      errors: []
    };

    // 1. Get all users
    const users = await User.find({});
    console.log(`📋 Found ${users.length} users to process`);
    console.log('');

    for (const user of users) {
      try {
        console.log(`Processing user: ${user.email}`);
        stats.usersProcessed++;

        // 2. Check for saved videos without proper fields
        const savedVideos = await SavedVideo.find({ 
          userId: user._id,
          deletedAt: null 
        });

        for (const video of savedVideos) {
          let needsUpdate = false;

          // Ensure required fields exist
          if (!video.savedAt) {
            video.savedAt = video.createdAt || new Date();
            needsUpdate = true;
          }

          if (typeof video.isCompleted === 'undefined') {
            video.isCompleted = false;
            needsUpdate = true;
          }

          if (needsUpdate && !isDryRun) {
            await video.save();
            stats.savedVideosMigrated++;
          } else if (needsUpdate) {
            stats.savedVideosMigrated++;
          }
        }

        // 3. Check for learning paths without version records
        const learningPaths = await UserLearningPath.find({
          userId: user._id,
          deletedAt: null
        });

        for (const learningPath of learningPaths) {
          // Check if initial version exists
          const existingVersion = await LearningPathVersion.findOne({
            pathId: learningPath._id,
            versionNumber: 1
          });

          if (!existingVersion) {
            console.log(`  Creating initial version for path: ${learningPath.title}`);
            
            if (!isDryRun) {
              await LearningPathVersion.create({
                pathId: learningPath._id,
                userId: user._id,
                versionNumber: 1,
                reason: 'migration',
                changeDescription: 'Initial version created during migration',
                snapshot: {
                  title: learningPath.title,
                  description: learningPath.description,
                  careerId: learningPath.careerId,
                  status: learningPath.status,
                  structureGraph: learningPath.structureGraph,
                  inferredSkills: learningPath.inferredSkills,
                  inferredCareers: learningPath.inferredCareers,
                  visibility: learningPath.visibility || 'private'
                }
              });
            }
            stats.versionRecordsCreated++;
          }

          // Ensure visibility field exists
          if (!learningPath.visibility) {
            if (!isDryRun) {
              learningPath.visibility = 'private';
              await learningPath.save();
            }
          }
        }

        // 4. Create default learning path for users without any
        if (learningPaths.length === 0 && savedVideos.length > 0) {
          console.log(`  Creating default learning path for user with ${savedVideos.length} saved videos`);
          
          if (!isDryRun) {
            const nodes = savedVideos.slice(0, 5).map((video, index) => ({
              id: `node_${Date.now()}_${index}`,
              videoId: video.videoId,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              duration: video.duration,
              channelTitle: video.channelTitle,
              order: index,
              isCompleted: video.isCompleted || false
            }));

            const edges = nodes.slice(0, -1).map((node, index) => ({
              from: node.id,
              to: nodes[index + 1].id,
              type: 'prerequisite'
            }));

            await UserLearningPath.create({
              userId: user._id,
              title: user.activeCareerId ? `My ${user.activeCareerId} Journey` : 'My Learning Path',
              description: 'Auto-created learning path from saved videos',
              careerId: user.activeCareerId || null,
              isAutoGenerated: true,
              status: 'active',
              structureGraph: { nodes, edges },
              visibility: 'private'
            });

            stats.learningPathsCreated++;
          } else {
            stats.learningPathsCreated++;
          }
        }

        // 5. Calculate readiness score if user has active career
        if (user.activeCareerId) {
          try {
            if (!isDryRun) {
              await CareerReadinessService.calculateReadiness(user._id, user.activeCareerId);
            }
            stats.readinessScoresCalculated++;
          } catch (err) {
            console.log(`  ⚠️  Could not calculate readiness: ${err.message}`);
          }
        }

        console.log(`  ✅ User processed`);

      } catch (error) {
        console.error(`  ❌ Error processing user ${user.email}:`, error.message);
        stats.errors.push({ userId: user._id, error: error.message });
      }
    }

    // Print summary
    console.log('');
    console.log('===================================');
    console.log('Migration Summary');
    console.log('===================================');
    console.log(`Users processed: ${stats.usersProcessed}`);
    console.log(`Saved videos migrated: ${stats.savedVideosMigrated}`);
    console.log(`Learning paths created: ${stats.learningPathsCreated}`);
    console.log(`Version records created: ${stats.versionRecordsCreated}`);
    console.log(`Readiness scores calculated: ${stats.readinessScoresCalculated}`);
    console.log(`Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('');
      console.log('Errors:');
      stats.errors.forEach(e => console.log(`  - User ${e.userId}: ${e.error}`));
    }

    if (isDryRun) {
      console.log('');
      console.log('⚠️  This was a dry run. No changes were made.');
      console.log('    Run without --dry-run to apply changes.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrate().catch(console.error);
