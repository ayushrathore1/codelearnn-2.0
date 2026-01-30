const mongoose = require('mongoose');

/**
 * User Skill Model
 * Tracks individual skill scores and progression for each user
 * Enables skill-based recommendations and profile generation
 */
const UserSkillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Skill identifier (normalized lowercase)
  skillName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },

  // Display name for UI
  displayName: {
    type: String,
    required: true,
    trim: true
  },

  // Category of the skill
  category: {
    type: String,
    enum: [
      'language',      // JavaScript, Python, Java, etc.
      'framework',     // React, Node.js, Django, etc.
      'tools',         // Git, Docker, VS Code, etc.
      'concepts',      // DSA, System Design, OOP, etc.
      'soft-skills',   // Communication, Problem Solving, etc.
      'domain'         // Web Dev, Mobile, Data Science, etc.
    ],
    default: 'language'
  },

  // Current skill score (0-100)
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Skill level based on score
  level: {
    type: String,
    enum: ['novice', 'beginner', 'intermediate', 'advanced', 'expert'],
    default: 'novice'
  },

  // Score breakdown by activity type
  scoreBreakdown: {
    videos: { type: Number, default: 0 },      // From watching videos
    quizzes: { type: Number, default: 0 },     // From passing quizzes
    challenges: { type: Number, default: 0 },  // From coding challenges
    projects: { type: Number, default: 0 },    // From projects
    peerReviews: { type: Number, default: 0 }  // From peer review ratings
  },

  // Activity counts
  activities: {
    videosCompleted: { type: Number, default: 0 },
    quizzesPassed: { type: Number, default: 0 },
    challengesSolved: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    reviewsReceived: { type: Number, default: 0 }
  },

  // XP earned for this skill
  xpEarned: {
    type: Number,
    default: 0
  },

  // Timestamps
  firstEarnedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },

  // Is this skill verified (via assessment)?
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verificationScore: Number

}, {
  timestamps: true
});

// Compound index for user-skill uniqueness
UserSkillSchema.index({ user: 1, skillName: 1 }, { unique: true });

// Score thresholds for levels
const LEVEL_THRESHOLDS = {
  novice: 0,
  beginner: 20,
  intermediate: 45,
  advanced: 70,
  expert: 90
};

// Weight multipliers for different activities
const ACTIVITY_WEIGHTS = {
  video: 1,
  quiz: 3,
  challenge: 5,
  project: 10,
  peerReview: 2
};

// Calculate level from score
UserSkillSchema.methods.calculateLevel = function() {
  if (this.score >= LEVEL_THRESHOLDS.expert) return 'expert';
  if (this.score >= LEVEL_THRESHOLDS.advanced) return 'advanced';
  if (this.score >= LEVEL_THRESHOLDS.intermediate) return 'intermediate';
  if (this.score >= LEVEL_THRESHOLDS.beginner) return 'beginner';
  return 'novice';
};

// Recalculate total score from breakdown
UserSkillSchema.methods.recalculateScore = function() {
  const { videos, quizzes, challenges, projects, peerReviews } = this.scoreBreakdown;
  
  // Weighted sum with diminishing returns
  const rawScore = 
    (videos * ACTIVITY_WEIGHTS.video) +
    (quizzes * ACTIVITY_WEIGHTS.quiz) +
    (challenges * ACTIVITY_WEIGHTS.challenge) +
    (projects * ACTIVITY_WEIGHTS.project) +
    (peerReviews * ACTIVITY_WEIGHTS.peerReview);
  
  // Apply logarithmic scaling to prevent score inflation
  // Score approaches 100 asymptotically
  this.score = Math.min(100, Math.round(100 * (1 - Math.exp(-rawScore / 500))));
  this.level = this.calculateLevel();
  this.lastUpdatedAt = new Date();
  
  return this.score;
};

// Add points for an activity
UserSkillSchema.methods.addActivity = async function(activityType, points = 1) {
  const validTypes = ['videos', 'quizzes', 'challenges', 'projects', 'peerReviews'];
  const activityCountMap = {
    videos: 'videosCompleted',
    quizzes: 'quizzesPassed',
    challenges: 'challengesSolved',
    projects: 'projectsCompleted',
    peerReviews: 'reviewsReceived'
  };
  
  if (!validTypes.includes(activityType)) {
    throw new Error(`Invalid activity type: ${activityType}`);
  }
  
  const previousLevel = this.level;
  
  this.scoreBreakdown[activityType] += points;
  this.activities[activityCountMap[activityType]] += 1;
  this.recalculateScore();
  
  const leveledUp = this.level !== previousLevel && 
    LEVEL_THRESHOLDS[this.level] > LEVEL_THRESHOLDS[previousLevel];
  
  await this.save();
  
  return {
    newScore: this.score,
    newLevel: this.level,
    leveledUp
  };
};

// Static: Get or create skill for user
UserSkillSchema.statics.getOrCreate = async function(userId, skillName, displayName = null, category = 'language') {
  const normalizedName = skillName.toLowerCase().trim();
  
  let skill = await this.findOne({ user: userId, skillName: normalizedName });
  
  if (!skill) {
    skill = await this.create({
      user: userId,
      skillName: normalizedName,
      displayName: displayName || skillName,
      category
    });
  }
  
  return skill;
};

// Static: Get all skills for user
UserSkillSchema.statics.getUserSkills = function(userId, options = {}) {
  const { minScore = 0, category, limit = 50 } = options;
  
  const query = { user: userId, score: { $gte: minScore } };
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ score: -1 })
    .limit(limit)
    .lean();
};

// Static: Get top skills for user (for profile/resume)
UserSkillSchema.statics.getTopSkills = function(userId, limit = 10) {
  return this.find({ user: userId, score: { $gte: 20 } }) // Only skills above beginner
    .sort({ score: -1 })
    .limit(limit)
    .select('skillName displayName score level category isVerified')
    .lean();
};

// Static: Get skill comparison between users (for teams/matching)
UserSkillSchema.statics.compareSkills = async function(userId1, userId2) {
  const [skills1, skills2] = await Promise.all([
    this.find({ user: userId1 }).lean(),
    this.find({ user: userId2 }).lean()
  ]);
  
  const skillMap1 = new Map(skills1.map(s => [s.skillName, s.score]));
  const skillMap2 = new Map(skills2.map(s => [s.skillName, s.score]));
  
  const allSkills = new Set([...skillMap1.keys(), ...skillMap2.keys()]);
  
  const comparison = [];
  for (const skill of allSkills) {
    comparison.push({
      skillName: skill,
      user1Score: skillMap1.get(skill) || 0,
      user2Score: skillMap2.get(skill) || 0
    });
  }
  
  return comparison.sort((a, b) => 
    Math.max(b.user1Score, b.user2Score) - Math.max(a.user1Score, a.user2Score)
  );
};

// Static: Bulk update skills from video tags
UserSkillSchema.statics.updateFromVideoCompletion = async function(userId, tags) {
  const updates = [];
  
  for (const tag of tags) {
    const skill = await this.getOrCreate(userId, tag, tag, 'language');
    const result = await skill.addActivity('videos', 1);
    updates.push({
      skillName: tag,
      ...result
    });
  }
  
  return updates;
};

module.exports = mongoose.model('UserSkill', UserSkillSchema);
