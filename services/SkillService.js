/**
 * Skill Service
 * Manages user skill scores, updates, and calculations
 */

const UserSkill = require('../models/UserSkill');
const EventService = require('./EventService');
const cacheService = require('./CacheService');

class SkillService {
  /**
   * Mapping of common tags to skill names and categories
   */
  static SKILL_MAPPINGS = {
    // Languages
    'javascript': { displayName: 'JavaScript', category: 'language' },
    'js': { displayName: 'JavaScript', category: 'language', alias: 'javascript' },
    'python': { displayName: 'Python', category: 'language' },
    'java': { displayName: 'Java', category: 'language' },
    'c++': { displayName: 'C++', category: 'language' },
    'c': { displayName: 'C', category: 'language' },
    'typescript': { displayName: 'TypeScript', category: 'language' },
    'ts': { displayName: 'TypeScript', category: 'language', alias: 'typescript' },
    'go': { displayName: 'Go', category: 'language' },
    'rust': { displayName: 'Rust', category: 'language' },
    'ruby': { displayName: 'Ruby', category: 'language' },
    'php': { displayName: 'PHP', category: 'language' },
    'swift': { displayName: 'Swift', category: 'language' },
    'kotlin': { displayName: 'Kotlin', category: 'language' },
    'sql': { displayName: 'SQL', category: 'language' },
    
    // Frontend Frameworks
    'react': { displayName: 'React', category: 'framework' },
    'reactjs': { displayName: 'React', category: 'framework', alias: 'react' },
    'react.js': { displayName: 'React', category: 'framework', alias: 'react' },
    'vue': { displayName: 'Vue.js', category: 'framework' },
    'vuejs': { displayName: 'Vue.js', category: 'framework', alias: 'vue' },
    'angular': { displayName: 'Angular', category: 'framework' },
    'svelte': { displayName: 'Svelte', category: 'framework' },
    'nextjs': { displayName: 'Next.js', category: 'framework' },
    'next.js': { displayName: 'Next.js', category: 'framework', alias: 'nextjs' },
    
    // Backend Frameworks
    'node': { displayName: 'Node.js', category: 'framework' },
    'nodejs': { displayName: 'Node.js', category: 'framework', alias: 'node' },
    'node.js': { displayName: 'Node.js', category: 'framework', alias: 'node' },
    'express': { displayName: 'Express.js', category: 'framework' },
    'expressjs': { displayName: 'Express.js', category: 'framework', alias: 'express' },
    'django': { displayName: 'Django', category: 'framework' },
    'flask': { displayName: 'Flask', category: 'framework' },
    'spring': { displayName: 'Spring Boot', category: 'framework' },
    'nestjs': { displayName: 'NestJS', category: 'framework' },
    
    // Mobile
    'react-native': { displayName: 'React Native', category: 'framework' },
    'flutter': { displayName: 'Flutter', category: 'framework' },
    
    // Databases
    'mongodb': { displayName: 'MongoDB', category: 'tools' },
    'mysql': { displayName: 'MySQL', category: 'tools' },
    'postgresql': { displayName: 'PostgreSQL', category: 'tools' },
    'redis': { displayName: 'Redis', category: 'tools' },
    
    // DevOps/Tools
    'docker': { displayName: 'Docker', category: 'tools' },
    'kubernetes': { displayName: 'Kubernetes', category: 'tools' },
    'aws': { displayName: 'AWS', category: 'tools' },
    'git': { displayName: 'Git', category: 'tools' },
    'linux': { displayName: 'Linux', category: 'tools' },
    
    // Concepts
    'dsa': { displayName: 'Data Structures & Algorithms', category: 'concepts' },
    'data-structures': { displayName: 'Data Structures & Algorithms', category: 'concepts', alias: 'dsa' },
    'algorithms': { displayName: 'Data Structures & Algorithms', category: 'concepts', alias: 'dsa' },
    'system-design': { displayName: 'System Design', category: 'concepts' },
    'oop': { displayName: 'Object-Oriented Programming', category: 'concepts' },
    'api': { displayName: 'API Development', category: 'concepts' },
    'rest': { displayName: 'REST APIs', category: 'concepts' },
    'graphql': { displayName: 'GraphQL', category: 'concepts' },
    
    // Domain
    'web-development': { displayName: 'Web Development', category: 'domain' },
    'frontend': { displayName: 'Frontend Development', category: 'domain' },
    'backend': { displayName: 'Backend Development', category: 'domain' },
    'fullstack': { displayName: 'Full Stack Development', category: 'domain' },
    'mobile-development': { displayName: 'Mobile Development', category: 'domain' },
    'devops': { displayName: 'DevOps', category: 'domain' },
    'machine-learning': { displayName: 'Machine Learning', category: 'domain' },
    'data-science': { displayName: 'Data Science', category: 'domain' }
  };

  /**
   * Normalize a skill tag to its canonical form
   */
  static normalizeSkill(tag) {
    const normalized = tag.toLowerCase().trim();
    const mapping = this.SKILL_MAPPINGS[normalized];
    
    if (mapping) {
      // If it's an alias, return the canonical skill name
      if (mapping.alias) {
        return mapping.alias;
      }
      return normalized;
    }
    
    return normalized;
  }

  /**
   * Get skill display info
   */
  static getSkillInfo(skillName) {
    const normalized = this.normalizeSkill(skillName);
    const mapping = this.SKILL_MAPPINGS[normalized];
    
    if (mapping && !mapping.alias) {
      return {
        skillName: normalized,
        displayName: mapping.displayName,
        category: mapping.category
      };
    }
    
    // Default for unknown skills
    return {
      skillName: normalized,
      displayName: skillName,
      category: 'language'
    };
  }

  /**
   * Update skills based on video completion
   * @param {string} userId - User ID
   * @param {string[]} tags - Video tags
   * @returns {Object[]} Array of skill updates
   */
  static async updateFromVideoCompletion(userId, tags) {
    const updates = [];
    const processedSkills = new Set();
    
    for (const tag of tags) {
      const normalizedSkill = this.normalizeSkill(tag);
      
      // Skip if we already processed this skill (handles aliases)
      if (processedSkills.has(normalizedSkill)) continue;
      processedSkills.add(normalizedSkill);
      
      const skillInfo = this.getSkillInfo(normalizedSkill);
      
      try {
        const skill = await UserSkill.getOrCreate(
          userId,
          normalizedSkill,
          skillInfo.displayName,
          skillInfo.category
        );
        
        const previousScore = skill.score;
        const previousLevel = skill.level;
        
        const result = await skill.addActivity('videos', 1);
        
        updates.push({
          skillName: normalizedSkill,
          displayName: skillInfo.displayName,
          previousScore,
          newScore: result.newScore,
          previousLevel,
          newLevel: result.newLevel,
          leveledUp: result.leveledUp
        });
        
        // Record skill event
        await EventService.skillUpdated(
          userId,
          normalizedSkill,
          previousScore,
          result.newScore,
          result.newLevel
        );
        
        // Record level up event if applicable
        if (result.leveledUp) {
          await EventService.skillLevelUp(userId, normalizedSkill, result.newScore, result.newLevel);
        }
      } catch (error) {
        console.error(`Error updating skill ${normalizedSkill}:`, error.message);
      }
    }
    
    // Invalidate skills cache
    if (updates.length > 0) {
      await cacheService.invalidateUserSkills(userId);
    }
    
    return updates;
  }

  /**
   * Update skills based on quiz completion
   */
  static async updateFromQuizCompletion(userId, skills, score, maxScore) {
    const updates = [];
    const percentage = (score / maxScore) * 100;
    
    // Award points based on score percentage
    const pointsEarned = percentage >= 80 ? 3 : percentage >= 60 ? 2 : 1;
    
    for (const skillName of skills) {
      const normalizedSkill = this.normalizeSkill(skillName);
      const skillInfo = this.getSkillInfo(normalizedSkill);
      
      try {
        const skill = await UserSkill.getOrCreate(
          userId,
          normalizedSkill,
          skillInfo.displayName,
          skillInfo.category
        );
        
        const previousScore = skill.score;
        const result = await skill.addActivity('quizzes', pointsEarned);
        
        updates.push({
          skillName: normalizedSkill,
          previousScore,
          newScore: result.newScore,
          leveledUp: result.leveledUp
        });
        
        await EventService.skillUpdated(userId, normalizedSkill, previousScore, result.newScore, result.newLevel);
      } catch (error) {
        console.error(`Error updating skill ${normalizedSkill}:`, error.message);
      }
    }
    
    if (updates.length > 0) {
      await cacheService.invalidateUserSkills(userId);
    }
    
    return updates;
  }

  /**
   * Update skills based on coding challenge completion
   */
  static async updateFromChallengeCompletion(userId, skills, difficulty) {
    const updates = [];
    
    // Points based on difficulty
    const pointsMap = { easy: 2, medium: 4, hard: 6 };
    const pointsEarned = pointsMap[difficulty] || 3;
    
    for (const skillName of skills) {
      const normalizedSkill = this.normalizeSkill(skillName);
      const skillInfo = this.getSkillInfo(normalizedSkill);
      
      try {
        const skill = await UserSkill.getOrCreate(
          userId,
          normalizedSkill,
          skillInfo.displayName,
          skillInfo.category
        );
        
        const previousScore = skill.score;
        const result = await skill.addActivity('challenges', pointsEarned);
        
        updates.push({
          skillName: normalizedSkill,
          previousScore,
          newScore: result.newScore,
          leveledUp: result.leveledUp
        });
        
        await EventService.skillUpdated(userId, normalizedSkill, previousScore, result.newScore, result.newLevel);
      } catch (error) {
        console.error(`Error updating skill ${normalizedSkill}:`, error.message);
      }
    }
    
    if (updates.length > 0) {
      await cacheService.invalidateUserSkills(userId);
    }
    
    return updates;
  }

  /**
   * Update skills based on project completion
   */
  static async updateFromProjectCompletion(userId, techStack, peerRating = null) {
    const updates = [];
    
    for (const tech of techStack) {
      const normalizedSkill = this.normalizeSkill(tech);
      const skillInfo = this.getSkillInfo(normalizedSkill);
      
      try {
        const skill = await UserSkill.getOrCreate(
          userId,
          normalizedSkill,
          skillInfo.displayName,
          skillInfo.category
        );
        
        const previousScore = skill.score;
        
        // Add project points
        await skill.addActivity('projects', 5);
        
        // Add peer review points if rated
        if (peerRating) {
          const reviewPoints = Math.round(peerRating); // 1-5 points based on rating
          await skill.addActivity('peerReviews', reviewPoints);
        }
        
        const result = {
          newScore: skill.score,
          newLevel: skill.level,
          leveledUp: skill.level !== (await UserSkill.findById(skill._id)).level
        };
        
        updates.push({
          skillName: normalizedSkill,
          previousScore,
          newScore: result.newScore,
          leveledUp: result.leveledUp
        });
        
        await EventService.skillUpdated(userId, normalizedSkill, previousScore, result.newScore, result.newLevel);
      } catch (error) {
        console.error(`Error updating skill ${normalizedSkill}:`, error.message);
      }
    }
    
    if (updates.length > 0) {
      await cacheService.invalidateUserSkills(userId);
    }
    
    return updates;
  }

  /**
   * Get user's skills (with caching)
   */
  static async getUserSkills(userId, options = {}) {
    // Try cache first
    const cached = await cacheService.getUserSkills(userId);
    if (cached) {
      return cached;
    }
    
    // Query database
    const skills = await UserSkill.getUserSkills(userId, options);
    
    // Cache the result
    await cacheService.cacheUserSkills(userId, skills);
    
    return skills;
  }

  /**
   * Get top skills for profile/resume
   */
  static async getTopSkills(userId, limit = 10) {
    return UserSkill.getTopSkills(userId, limit);
  }

  /**
   * Get skill by name for user
   */
  static async getSkill(userId, skillName) {
    const normalized = this.normalizeSkill(skillName);
    return UserSkill.findOne({ user: userId, skillName: normalized });
  }

  /**
   * Get skill gaps based on career goal
   * Returns skills that need improvement to reach goal
   */
  static async getSkillGaps(userId, targetRole) {
    // Define required skills for common roles
    const roleRequirements = {
      'frontend-developer': [
        { skill: 'javascript', minLevel: 'intermediate' },
        { skill: 'react', minLevel: 'intermediate' },
        { skill: 'html', minLevel: 'intermediate' },
        { skill: 'css', minLevel: 'intermediate' }
      ],
      'backend-developer': [
        { skill: 'node', minLevel: 'intermediate' },
        { skill: 'express', minLevel: 'intermediate' },
        { skill: 'mongodb', minLevel: 'beginner' },
        { skill: 'sql', minLevel: 'beginner' }
      ],
      'fullstack-developer': [
        { skill: 'javascript', minLevel: 'intermediate' },
        { skill: 'react', minLevel: 'beginner' },
        { skill: 'node', minLevel: 'intermediate' },
        { skill: 'mongodb', minLevel: 'beginner' }
      ],
      'data-scientist': [
        { skill: 'python', minLevel: 'intermediate' },
        { skill: 'sql', minLevel: 'intermediate' },
        { skill: 'machine-learning', minLevel: 'beginner' }
      ]
    };
    
    const requirements = roleRequirements[targetRole] || [];
    const userSkills = await this.getUserSkills(userId);
    const skillMap = new Map(userSkills.map(s => [s.skillName, s]));
    
    const levelOrder = ['novice', 'beginner', 'intermediate', 'advanced', 'expert'];
    
    const gaps = [];
    for (const req of requirements) {
      const userSkill = skillMap.get(req.skill);
      const currentLevel = userSkill?.level || 'novice';
      const requiredLevelIndex = levelOrder.indexOf(req.minLevel);
      const currentLevelIndex = levelOrder.indexOf(currentLevel);
      
      if (currentLevelIndex < requiredLevelIndex) {
        gaps.push({
          skillName: req.skill,
          displayName: this.getSkillInfo(req.skill).displayName,
          currentLevel,
          requiredLevel: req.minLevel,
          currentScore: userSkill?.score || 0,
          gap: requiredLevelIndex - currentLevelIndex
        });
      }
    }
    
    // Sort by gap size (biggest gaps first)
    return gaps.sort((a, b) => b.gap - a.gap);
  }
}

module.exports = SkillService;
