const UserLearningPath = require('../models/UserLearningPath');
const SavedVideo = require('../models/SavedVideo');
const User = require('../models/User');

/**
 * Career Readiness Service
 * 
 * Calculates and tracks career readiness based on:
 * - Learning path progress
 * - Skills coverage
 * - Video completion
 * - Career alignment
 */

class CareerReadinessService {
  
  /**
   * Calculate readiness score for a user's active career
   */
  static async calculateReadiness(userId, careerId = null) {
    try {
      const user = await User.findById(userId);
      const targetCareer = careerId || user?.activeCareerId;
      
      if (!targetCareer) {
        return {
          score: 0,
          breakdown: {
            pathProgress: 0,
            skillsCoverage: 0,
            careerAlignment: 0,
            videosCompleted: 0
          },
          message: 'No active career selected',
          recommendations: ['Choose a career goal to start tracking readiness']
        };
      }
      
      // Get user's learning paths
      const paths = await UserLearningPath.find({
        userId,
        deletedAt: null
      });
      
      // Get saved videos
      const savedVideos = await SavedVideo.find({
        userId,
        deletedAt: null
      });
      
      // Calculate components
      const pathProgress = this._calculatePathProgress(paths);
      const skillsCoverage = this._calculateSkillsCoverage(paths, savedVideos, targetCareer);
      const careerAlignment = this._calculateCareerAlignment(paths, savedVideos, targetCareer);
      const videosCompleted = this._calculateVideosCompleted(paths);
      
      // Weighted score calculation
      const weights = {
        pathProgress: 0.30,
        skillsCoverage: 0.30,
        careerAlignment: 0.25,
        videosCompleted: 0.15
      };
      
      const score = Math.round(
        (pathProgress * weights.pathProgress) +
        (skillsCoverage * weights.skillsCoverage) +
        (careerAlignment * weights.careerAlignment) +
        (videosCompleted * weights.videosCompleted)
      );
      
      // Generate recommendations
      const recommendations = this._generateRecommendations({
        pathProgress,
        skillsCoverage,
        careerAlignment,
        videosCompleted,
        targetCareer
      });
      
      // Determine level
      const level = this._getReadinessLevel(score);
      
      return {
        score,
        level,
        careerId: targetCareer,
        breakdown: {
          pathProgress: Math.round(pathProgress),
          skillsCoverage: Math.round(skillsCoverage),
          careerAlignment: Math.round(careerAlignment),
          videosCompleted: Math.round(videosCompleted)
        },
        stats: {
          totalPaths: paths.length,
          activePaths: paths.filter(p => p.status === 'active').length,
          completedPaths: paths.filter(p => p.status === 'completed').length,
          totalVideos: savedVideos.length,
          completedVideos: savedVideos.filter(v => v.isCompleted).length
        },
        recommendations
      };
      
    } catch (error) {
      console.error('Calculate readiness error:', error);
      throw error;
    }
  }
  
  /**
   * Calculate path progress component (0-100)
   */
  static _calculatePathProgress(paths) {
    if (paths.length === 0) return 0;
    
    // Focus on active paths
    const activePaths = paths.filter(p => p.status === 'active');
    if (activePaths.length === 0) {
      // Check for any paths with progress
      const pathsWithNodes = paths.filter(p => p.totalNodesCount > 0);
      if (pathsWithNodes.length === 0) return 0;
      
      const avgProgress = pathsWithNodes.reduce((sum, p) => 
        sum + (p.completedNodesCount / p.totalNodesCount * 100), 0
      ) / pathsWithNodes.length;
      
      return avgProgress * 0.7; // Penalize for not having active paths
    }
    
    // Calculate weighted average progress
    const totalNodes = activePaths.reduce((sum, p) => sum + p.totalNodesCount, 0);
    const completedNodes = activePaths.reduce((sum, p) => sum + p.completedNodesCount, 0);
    
    if (totalNodes === 0) return 0;
    return (completedNodes / totalNodes) * 100;
  }
  
  /**
   * Calculate skills coverage component (0-100)
   */
  static _calculateSkillsCoverage(paths, savedVideos, targetCareer) {
    // Get all skills from completed videos in paths
    const coveredSkills = new Set();
    
    paths.forEach(path => {
      if (path.inferredSkills) {
        path.inferredSkills.forEach(skill => coveredSkills.add(skill.toLowerCase()));
      }
    });
    
    savedVideos.forEach(video => {
      if (video.isCompleted && video.inferredSkills) {
        video.inferredSkills.forEach(skill => coveredSkills.add(skill.toLowerCase()));
      }
    });
    
    // Define expected skills per career (simplified - in production, fetch from career data)
    const expectedSkillsCount = this._getExpectedSkillsCount(targetCareer);
    
    if (expectedSkillsCount === 0) return 50; // Default if no career data
    
    // Calculate coverage (capped at 100)
    const coverage = Math.min(100, (coveredSkills.size / expectedSkillsCount) * 100);
    
    return coverage;
  }
  
  /**
   * Calculate career alignment component (0-100)
   */
  static _calculateCareerAlignment(paths, savedVideos, targetCareer) {
    if (!targetCareer) return 0;
    
    const careerLower = targetCareer.toLowerCase();
    
    // Count career-aligned content
    let alignedPaths = 0;
    let totalPaths = 0;
    
    paths.forEach(path => {
      if (path.totalNodesCount > 0) {
        totalPaths++;
        if (path.careerId?.toLowerCase() === careerLower ||
            path.inferredCareers?.some(c => c.toLowerCase().includes(careerLower))) {
          alignedPaths++;
        }
      }
    });
    
    let alignedVideos = 0;
    let totalVideos = 0;
    
    savedVideos.forEach(video => {
      totalVideos++;
      if (video.inferredCareers?.some(c => c.toLowerCase().includes(careerLower))) {
        alignedVideos++;
      }
    });
    
    // Calculate alignment percentage
    const pathAlignment = totalPaths > 0 ? (alignedPaths / totalPaths) * 100 : 50;
    const videoAlignment = totalVideos > 0 ? (alignedVideos / totalVideos) * 100 : 50;
    
    // Weight paths more heavily
    return (pathAlignment * 0.6) + (videoAlignment * 0.4);
  }
  
  /**
   * Calculate videos completed component (0-100)
   */
  static _calculateVideosCompleted(paths) {
    // Count completed videos across all paths
    let totalVideos = 0;
    let completedVideos = 0;
    
    paths.forEach(path => {
      if (path.structureGraph?.nodes) {
        path.structureGraph.nodes.forEach(node => {
          totalVideos++;
          if (node.isCompleted) completedVideos++;
        });
      }
    });
    
    if (totalVideos === 0) return 0;
    return (completedVideos / totalVideos) * 100;
  }
  
  /**
   * Get expected skills count for a career
   */
  static _getExpectedSkillsCount(career) {
    // In production, this would fetch from CareerDomain collection
    const careerSkillsMap = {
      'frontend developer': 15,
      'backend developer': 15,
      'full stack developer': 25,
      'data scientist': 20,
      'devops engineer': 18,
      'mobile developer': 15,
      'ui/ux designer': 12,
      'machine learning engineer': 22,
      'cloud architect': 20,
      'cybersecurity analyst': 18
    };
    
    const careerLower = career?.toLowerCase() || '';
    
    // Find matching career
    for (const [key, value] of Object.entries(careerSkillsMap)) {
      if (careerLower.includes(key) || key.includes(careerLower)) {
        return value;
      }
    }
    
    return 15; // Default
  }
  
  /**
   * Get readiness level description
   */
  static _getReadinessLevel(score) {
    if (score >= 90) return { name: 'Expert', color: 'emerald', description: 'You\'re job-ready!' };
    if (score >= 75) return { name: 'Advanced', color: 'green', description: 'Nearly there, keep going!' };
    if (score >= 50) return { name: 'Intermediate', color: 'yellow', description: 'Good progress, continue learning' };
    if (score >= 25) return { name: 'Beginner', color: 'orange', description: 'Building foundation' };
    return { name: 'Getting Started', color: 'gray', description: 'Start your learning journey' };
  }
  
  /**
   * Generate personalized recommendations
   */
  static _generateRecommendations(breakdown) {
    const recommendations = [];
    
    if (breakdown.pathProgress < 30) {
      recommendations.push({
        type: 'progress',
        priority: 'high',
        message: 'Focus on completing your active learning path',
        action: 'Continue learning in your current path'
      });
    }
    
    if (breakdown.skillsCoverage < 50) {
      recommendations.push({
        type: 'skills',
        priority: 'high',
        message: 'Expand your skills by adding more diverse content',
        action: 'Add videos covering new skill areas'
      });
    }
    
    if (breakdown.careerAlignment < 60) {
      recommendations.push({
        type: 'alignment',
        priority: 'medium',
        message: `Add more ${breakdown.targetCareer}-focused content`,
        action: 'Search for videos aligned with your career goal'
      });
    }
    
    if (breakdown.videosCompleted < 40) {
      recommendations.push({
        type: 'completion',
        priority: 'medium',
        message: 'Mark videos as complete as you finish them',
        action: 'Update completion status for videos you\'ve watched'
      });
    }
    
    if (breakdown.pathProgress >= 80 && breakdown.skillsCoverage >= 70) {
      recommendations.push({
        type: 'next-step',
        priority: 'low',
        message: 'You\'re making great progress! Consider exploring advanced topics',
        action: 'Look for advanced or specialized content'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Update readiness score on a learning path
   */
  static async updatePathReadiness(pathId, userId) {
    try {
      const readiness = await this.calculateReadiness(userId);
      
      await UserLearningPath.findByIdAndUpdate(pathId, {
        readinessScore: readiness.score
      });
      
      return readiness;
    } catch (error) {
      console.error('Update path readiness error:', error);
      throw error;
    }
  }
  
  /**
   * Get skills gap analysis
   */
  static async getSkillsGap(userId, careerId = null) {
    try {
      const user = await User.findById(userId);
      const targetCareer = careerId || user?.activeCareerId;
      
      if (!targetCareer) {
        return { 
          covered: [], 
          missing: [], 
          suggested: [] 
        };
      }
      
      // Get user's acquired skills
      const paths = await UserLearningPath.find({ userId, deletedAt: null });
      const savedVideos = await SavedVideo.find({ userId, deletedAt: null, isCompleted: true });
      
      const coveredSkills = new Set();
      
      paths.forEach(path => {
        path.inferredSkills?.forEach(skill => coveredSkills.add(skill.toLowerCase()));
      });
      
      savedVideos.forEach(video => {
        video.inferredSkills?.forEach(skill => coveredSkills.add(skill.toLowerCase()));
      });
      
      // Get expected skills for career (in production, fetch from database)
      const expectedSkills = this._getExpectedSkills(targetCareer);
      
      const covered = [];
      const missing = [];
      
      expectedSkills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        if (coveredSkills.has(skillLower) || 
            Array.from(coveredSkills).some(s => s.includes(skillLower) || skillLower.includes(s))) {
          covered.push(skill);
        } else {
          missing.push(skill);
        }
      });
      
      return {
        careerId: targetCareer,
        covered,
        missing,
        coveragePercentage: Math.round((covered.length / expectedSkills.length) * 100),
        suggested: missing.slice(0, 5) // Top 5 missing skills to learn
      };
      
    } catch (error) {
      console.error('Get skills gap error:', error);
      throw error;
    }
  }
  
  /**
   * Get expected skills for a career
   */
  static _getExpectedSkills(career) {
    // In production, fetch from CareerDomain collection
    const careerSkillsMap = {
      'frontend developer': [
        'HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Responsive Design',
        'Git', 'REST APIs', 'Testing', 'Performance Optimization', 'Accessibility',
        'State Management', 'Build Tools', 'CSS Frameworks', 'Browser DevTools'
      ],
      'backend developer': [
        'Node.js', 'Python', 'Databases', 'REST APIs', 'SQL', 'NoSQL',
        'Authentication', 'Git', 'Testing', 'Linux', 'Docker', 'Caching',
        'Message Queues', 'Security', 'Microservices'
      ],
      'full stack developer': [
        'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Databases',
        'REST APIs', 'Git', 'Authentication', 'TypeScript', 'Testing',
        'Docker', 'Deployment', 'Security', 'Performance', 'State Management',
        'GraphQL', 'Linux', 'Cloud Services', 'CI/CD', 'Agile', 'SQL', 'NoSQL'
      ],
      'data scientist': [
        'Python', 'Statistics', 'Machine Learning', 'Data Visualization',
        'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'Deep Learning', 'TensorFlow',
        'Data Cleaning', 'Feature Engineering', 'Model Evaluation', 'Jupyter',
        'Data Storytelling', 'A/B Testing', 'Big Data', 'ETL', 'Cloud Platforms'
      ]
    };
    
    const careerLower = career?.toLowerCase() || '';
    
    for (const [key, skills] of Object.entries(careerSkillsMap)) {
      if (careerLower.includes(key) || key.includes(careerLower)) {
        return skills;
      }
    }
    
    // Default skills for unknown careers
    return ['Problem Solving', 'Communication', 'Version Control', 'Documentation', 
            'Testing', 'Debugging', 'Learning', 'Collaboration'];
  }
}

module.exports = CareerReadinessService;
