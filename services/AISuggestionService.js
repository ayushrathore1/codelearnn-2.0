const AISuggestion = require('../models/AISuggestion');
const UserLearningPath = require('../models/UserLearningPath');
const SavedVideo = require('../models/SavedVideo');
const User = require('../models/User');

/**
 * AI Suggestion Service
 * 
 * Generates explainable AI suggestions for learning paths based on:
 * - User actions (trigger events)
 * - Path structure analysis
 * - Skill gap analysis
 * - Career alignment
 * 
 * All suggestions include clear reasoning for transparency.
 */

class AISuggestionService {
  
  /**
   * Generate suggestions based on a trigger event
   */
  static async generateSuggestions(pathId, userId, trigger, context = {}) {
    const suggestions = [];
    
    try {
      // Get the path
      const path = await UserLearningPath.findById(pathId);
      if (!path) return suggestions;
      
      // Get user's saved videos
      const savedVideos = await SavedVideo.find({
        userId,
        deletedAt: null,
        addedToPathId: null // Unassigned videos
      }).limit(20);
      
      // Get user for career info
      const user = await User.findById(userId);
      
      // Generate suggestions based on trigger and context
      switch (trigger) {
        case 'video_added':
          suggestions.push(...await this._suggestAfterVideoAdded(path, savedVideos, context));
          break;
          
        case 'path_created':
          suggestions.push(...await this._suggestForNewPath(path, savedVideos, user));
          break;
          
        case 'node_completed':
          suggestions.push(...await this._suggestNextSteps(path, savedVideos, context));
          break;
          
        case 'career_changed':
          suggestions.push(...await this._suggestCareerAlignment(path, user, savedVideos));
          break;
          
        case 'skill_gap_detected':
          suggestions.push(...await this._suggestForSkillGaps(path, context.missingSkills, savedVideos));
          break;
          
        case 'user_requested':
          suggestions.push(...await this._suggestGeneral(path, savedVideos, user));
          break;
          
        default:
          break;
      }
      
      // Save suggestions to database
      const savedSuggestions = await Promise.all(
        suggestions.map(s => AISuggestion.create({
          pathId,
          userId,
          trigger,
          ...s,
          context: {
            pathProgress: path.progressPercentage,
            completedNodes: path.completedNodesCount,
            totalNodes: path.totalNodesCount,
            activeCareerId: user?.activeCareerId,
            recentActivity: context.recentActivity || []
          },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }))
      );
      
      return savedSuggestions;
      
    } catch (error) {
      console.error('AI Suggestion generation error:', error);
      return [];
    }
  }
  
  /**
   * Suggest after a video is added to path
   */
  static async _suggestAfterVideoAdded(path, unassignedVideos, context) {
    const suggestions = [];
    const nodes = path.structureGraph.nodes;
    
    // If path has few nodes, suggest adding more
    if (nodes.length < 3 && unassignedVideos.length > 0) {
      const relevantVideos = this._findRelatedVideos(
        nodes[nodes.length - 1],
        unassignedVideos
      );
      
      if (relevantVideos.length > 0) {
        suggestions.push({
          suggestionType: 'add_video',
          proposedChange: {
            videoId: relevantVideos[0].videoId,
            videoTitle: relevantVideos[0].title,
            suggestedVideos: relevantVideos.slice(0, 3).map(v => ({
              videoId: v.videoId,
              title: v.title,
              relevanceScore: 0.8
            }))
          },
          reasoning: {
            summary: 'Add related videos to build a complete learning sequence',
            details: [
              'Your path is just getting started',
              `Found ${relevantVideos.length} related videos in your library`,
              'Building a sequence helps with consistent learning'
            ],
            dataPoints: [
              { label: 'Current videos', value: nodes.length },
              { label: 'Available related', value: relevantVideos.length }
            ]
          },
          confidence: 0.75,
          priority: 'medium'
        });
      }
    }
    
    // Check for potential prerequisites
    if (nodes.length >= 2) {
      const lastNode = nodes[nodes.length - 1];
      const potentialPrereqs = this._findPrerequisites(lastNode, unassignedVideos);
      
      if (potentialPrereqs.length > 0) {
        suggestions.push({
          suggestionType: 'add_prerequisite',
          proposedChange: {
            videoId: potentialPrereqs[0].videoId,
            videoTitle: potentialPrereqs[0].title,
            suggestedVideos: potentialPrereqs.map(v => ({
              videoId: v.videoId,
              title: v.title,
              relevanceScore: 0.7
            }))
          },
          reasoning: {
            summary: 'Consider adding foundational content before advanced topics',
            details: [
              'The last added video may require prerequisite knowledge',
              'Adding fundamentals first can improve understanding',
              'You have potential prerequisite videos in your library'
            ],
            dataPoints: [
              { label: 'Video added', value: lastNode.title },
              { label: 'Potential prerequisites', value: potentialPrereqs.length }
            ]
          },
          confidence: 0.65,
          priority: 'low'
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Suggest for a newly created path
   */
  static async _suggestForNewPath(path, unassignedVideos, user) {
    const suggestions = [];
    
    // If path is empty or has only one video
    if (path.structureGraph.nodes.length <= 1 && unassignedVideos.length > 0) {
      // Suggest adding more videos
      const topVideos = unassignedVideos.slice(0, 5);
      
      suggestions.push({
        suggestionType: 'improve_coverage',
        proposedChange: {
          suggestedVideos: topVideos.map(v => ({
            videoId: v.videoId,
            title: v.title,
            relevanceScore: 0.8
          }))
        },
        reasoning: {
          summary: 'Start building your learning path with more content',
          details: [
            'A good learning path typically has 5-10 videos',
            `You have ${unassignedVideos.length} saved videos available`,
            'Adding structure now will help you track progress'
          ],
          dataPoints: [
            { label: 'Current videos in path', value: path.structureGraph.nodes.length },
            { label: 'Videos available', value: unassignedVideos.length }
          ]
        },
        confidence: 0.85,
        priority: 'high'
      });
    }
    
    // If user has active career, suggest career-aligned videos
    if (user?.activeCareerId && unassignedVideos.length > 0) {
      const careerVideos = unassignedVideos.filter(v => 
        v.inferredCareers?.includes(user.activeCareerId)
      );
      
      if (careerVideos.length > 0) {
        suggestions.push({
          suggestionType: 'career_alignment',
          proposedChange: {
            suggestedVideos: careerVideos.slice(0, 3).map(v => ({
              videoId: v.videoId,
              title: v.title,
              relevanceScore: 0.9
            }))
          },
          reasoning: {
            summary: `Add videos aligned with your ${user.activeCareerId} career goal`,
            details: [
              `Found ${careerVideos.length} videos matching your career focus`,
              'Career-aligned content accelerates your readiness',
              'These videos cover relevant skills for your goal'
            ],
            dataPoints: [
              { label: 'Your career', value: user.activeCareerId },
              { label: 'Matching videos', value: careerVideos.length }
            ]
          },
          confidence: 0.9,
          priority: 'high'
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Suggest next steps after completing a node
   */
  static async _suggestNextSteps(path, unassignedVideos, context) {
    const suggestions = [];
    const nodes = path.structureGraph.nodes;
    const completedCount = nodes.filter(n => n.isCompleted).length;
    
    // If all nodes complete, suggest adding more content
    if (completedCount === nodes.length && nodes.length > 0) {
      if (unassignedVideos.length > 0) {
        suggestions.push({
          suggestionType: 'next_step',
          proposedChange: {
            suggestedVideos: unassignedVideos.slice(0, 3).map(v => ({
              videoId: v.videoId,
              title: v.title,
              relevanceScore: 0.75
            }))
          },
          reasoning: {
            summary: 'Congratulations! Consider expanding your path with new content',
            details: [
              'You\'ve completed all videos in this path!',
              `${unassignedVideos.length} saved videos are ready to add`,
              'Keep the momentum going with new learning'
            ],
            dataPoints: [
              { label: 'Completed', value: completedCount },
              { label: 'Path progress', value: '100%' }
            ]
          },
          confidence: 0.8,
          priority: 'medium'
        });
      }
    }
    
    // Get next available nodes
    const nextNodes = path.getNextAvailableNodes ? path.getNextAvailableNodes() : [];
    
    if (nextNodes.length > 1) {
      // Multiple paths available - suggest which to take
      suggestions.push({
        suggestionType: 'next_step',
        proposedChange: {
          suggestedVideos: nextNodes.map(n => ({
            videoId: n.videoId,
            title: n.title,
            relevanceScore: 0.85
          }))
        },
        reasoning: {
          summary: 'Multiple learning paths available - here\'s a recommendation',
          details: [
            `You can continue with ${nextNodes.length} different videos`,
            'Consider starting with the one most relevant to your current focus',
            'All options are valid based on your progress'
          ],
          dataPoints: [
            { label: 'Available next', value: nextNodes.length },
            { label: 'Current progress', value: `${path.progressPercentage}%` }
          ]
        },
        confidence: 0.7,
        priority: 'low'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Suggest when career changes
   */
  static async _suggestCareerAlignment(path, user, unassignedVideos) {
    const suggestions = [];
    
    if (!user?.activeCareerId) return suggestions;
    
    // Find videos in path that don't match new career
    const nodes = path.structureGraph.nodes;
    const pathSkills = path.inferredSkills || [];
    
    // Find career-aligned videos not in path
    const careerVideos = unassignedVideos.filter(v => 
      v.inferredCareers?.includes(user.activeCareerId)
    );
    
    if (careerVideos.length > 0) {
      suggestions.push({
        suggestionType: 'career_alignment',
        proposedChange: {
          suggestedVideos: careerVideos.slice(0, 5).map(v => ({
            videoId: v.videoId,
            title: v.title,
            relevanceScore: 0.85
          }))
        },
        reasoning: {
          summary: `Align your path with your new ${user.activeCareerId} career focus`,
          details: [
            'Your career goal has changed',
            `Found ${careerVideos.length} videos that match your new direction`,
            'Consider adding these to build relevant skills faster'
          ],
          dataPoints: [
            { label: 'New career', value: user.activeCareerId },
            { label: 'Relevant videos available', value: careerVideos.length }
          ]
        },
        confidence: 0.8,
        priority: 'high'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Suggest for detected skill gaps
   */
  static async _suggestForSkillGaps(path, missingSkills, unassignedVideos) {
    const suggestions = [];
    
    if (!missingSkills || missingSkills.length === 0) return suggestions;
    
    for (const skill of missingSkills.slice(0, 3)) {
      // Find videos that teach this skill
      const skillVideos = unassignedVideos.filter(v =>
        v.inferredSkills?.some(s => 
          s.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(s.toLowerCase())
        )
      );
      
      if (skillVideos.length > 0) {
        suggestions.push({
          suggestionType: 'add_skill_video',
          proposedChange: {
            targetSkill: skill,
            suggestedVideos: skillVideos.slice(0, 3).map(v => ({
              videoId: v.videoId,
              title: v.title,
              relevanceScore: 0.85
            }))
          },
          reasoning: {
            summary: `Add videos to learn ${skill}`,
            details: [
              `"${skill}" was identified as a skill gap`,
              `Found ${skillVideos.length} videos covering this skill`,
              'Adding these will improve your career readiness'
            ],
            dataPoints: [
              { label: 'Missing skill', value: skill },
              { label: 'Matching videos', value: skillVideos.length }
            ]
          },
          confidence: 0.85,
          priority: 'high'
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * General suggestions on user request
   */
  static async _suggestGeneral(path, unassignedVideos, user) {
    const suggestions = [];
    
    // Combine all suggestion types
    suggestions.push(...await this._suggestNextSteps(path, unassignedVideos, {}));
    
    if (user?.activeCareerId) {
      suggestions.push(...await this._suggestCareerAlignment(path, user, unassignedVideos));
    }
    
    // Check path structure
    if (path.structureGraph.nodes.length > 5 && !path.hasBranching()) {
      suggestions.push({
        suggestionType: 'create_branch',
        proposedChange: {},
        reasoning: {
          summary: 'Consider creating optional branches for flexibility',
          details: [
            'Your path is growing - branches can add flexible learning options',
            'Optional content helps personalize your journey',
            'Advanced learners can skip basics via branches'
          ],
          dataPoints: [
            { label: 'Current videos', value: path.structureGraph.nodes.length }
          ]
        },
        confidence: 0.6,
        priority: 'low'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Helper: Find videos related to a node
   */
  static _findRelatedVideos(node, videos) {
    // Simple keyword matching - in production, use embeddings/ML
    const nodeWords = node.title.toLowerCase().split(/\s+/);
    
    return videos
      .map(v => {
        const videoWords = v.title.toLowerCase().split(/\s+/);
        const overlap = nodeWords.filter(w => videoWords.includes(w)).length;
        return { ...v.toObject(), relevance: overlap };
      })
      .filter(v => v.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);
  }
  
  /**
   * Helper: Find potential prerequisites
   */
  static _findPrerequisites(node, videos) {
    const prereqKeywords = ['intro', 'basics', 'fundamentals', 'beginner', '101', 'getting started'];
    const nodeTitle = node.title.toLowerCase();
    
    return videos.filter(v => {
      const title = v.title.toLowerCase();
      return prereqKeywords.some(k => title.includes(k)) &&
             !prereqKeywords.some(k => nodeTitle.includes(k));
    });
  }
}

module.exports = AISuggestionService;
