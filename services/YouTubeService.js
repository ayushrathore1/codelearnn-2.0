const BaseService = require('./BaseService');
const axios = require('axios');

/**
 * YouTubeService - Service for interacting with YouTube Data API v3
 * Extends BaseService for common functionality
 */
class YouTubeService extends BaseService {
  constructor() {
    super('YouTubeService');
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes for YouTube data
  }

  /**
   * Extract video ID from various YouTube URL formats
   * @param {string} url - YouTube URL
   * @returns {string|null} Video ID or null if invalid
   */
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([^#&?\s]*)/,
      /^[a-zA-Z0-9_-]{11}$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
      if (pattern.test(url) && url.length === 11) {
        return url;
      }
    }
    
    return null;
  }

  /**
   * Extract playlist ID from various YouTube URL formats
   * @param {string} url - YouTube URL
   * @returns {string|null} Playlist ID or null if invalid
   */
  extractPlaylistId(url) {
    const patterns = [
      /[?&]list=([a-zA-Z0-9_-]+)/,
      /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Check if URL is a playlist URL
   * @param {string} url - URL to check
   * @returns {boolean} True if playlist URL
   */
  isPlaylistUrl(url) {
    return this.extractPlaylistId(url) !== null;
  }

  /**
   * Validate if a URL is a valid YouTube video URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid YouTube URL
   */
  isValidYouTubeUrl(url) {
    return this.extractVideoId(url) !== null || this.isPlaylistUrl(url);
  }

  /**
   * Get playlist details from YouTube API
   * @param {string} playlistId - YouTube playlist ID
   * @returns {Promise<Object>} Playlist details
   */
  async getPlaylistDetails(playlistId) {
    const cacheKey = `playlist_${playlistId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (!this.apiKey) {
      throw new Error('YouTube API key is not configured.');
    }

    try {
      const response = await this.withRetry(async () => {
        return axios.get(`${this.baseUrl}/playlists`, {
          params: {
            key: this.apiKey,
            id: playlistId,
            part: 'snippet,contentDetails'
          }
        });
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Playlist not found or is private');
      }

      const playlist = response.data.items[0];
      const result = {
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        channelTitle: playlist.snippet.channelTitle,
        channelId: playlist.snippet.channelId,
        thumbnail: playlist.snippet.thumbnails?.high?.url || playlist.snippet.thumbnails?.medium?.url,
        videoCount: playlist.contentDetails.itemCount,
        publishedAt: playlist.snippet.publishedAt
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('YouTube API access forbidden. Check your API key permissions.');
      }
      this.handleError(error, 'getPlaylistDetails');
    }
  }

  /**
   * Get videos from a playlist
   * @param {string} playlistId - YouTube playlist ID
   * @param {number} [maxVideos=20] - Maximum videos to fetch (for API efficiency)
   * @returns {Promise<Object[]>} Array of video items
   */
  async getPlaylistItems(playlistId, maxVideos = 20) {
    const cacheKey = `playlist_items_${playlistId}_${maxVideos}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    if (!this.apiKey) {
      throw new Error('YouTube API key is not configured.');
    }

    try {
      const response = await this.withRetry(async () => {
        return axios.get(`${this.baseUrl}/playlistItems`, {
          params: {
            key: this.apiKey,
            playlistId: playlistId,
            part: 'snippet,contentDetails',
            maxResults: Math.min(maxVideos, 50) // YouTube API max is 50
          }
        });
      });

      const items = (response.data.items || []).map(item => ({
        videoId: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description?.substring(0, 200),
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        position: item.snippet.position,
        publishedAt: item.contentDetails.videoPublishedAt
      }));

      this.setCache(cacheKey, items);
      return items;
    } catch (error) {
      this.handleError(error, 'getPlaylistItems');
    }
  }

  /**
   * Get full details for multiple videos efficiently (batch request)
   * @param {string[]} videoIds - Array of video IDs
   * @returns {Promise<Object[]>} Array of video details
   */
  async getMultipleVideoDetails(videoIds) {
    if (!videoIds || videoIds.length === 0) return [];
    
    // Batch up to 50 videos per request (YouTube API limit)
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < videoIds.length; i += batchSize) {
      batches.push(videoIds.slice(i, i + batchSize));
    }

    const allVideos = [];
    
    for (const batch of batches) {
      try {
        const response = await this.withRetry(async () => {
          return axios.get(`${this.baseUrl}/videos`, {
            params: {
              key: this.apiKey,
              id: batch.join(','),
              part: 'snippet,statistics,contentDetails'
            }
          });
        });

        const videos = (response.data.items || []).map(video => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          thumbnails: video.snippet.thumbnails,
          duration: this.parseDuration(video.contentDetails.duration),
          durationRaw: video.contentDetails.duration,
          tags: video.snippet.tags || [],
          categoryId: video.snippet.categoryId,
          statistics: {
            viewCount: parseInt(video.statistics.viewCount || 0),
            likeCount: parseInt(video.statistics.likeCount || 0),
            commentCount: parseInt(video.statistics.commentCount || 0)
          }
        }));

        allVideos.push(...videos);
      } catch (error) {
        this.log('warn', `Failed to fetch batch of videos: ${error.message}`);
      }
    }

    return allVideos;
  }

  /**
   * Get video details from YouTube API
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Video details including statistics
   */
  async getVideoDetails(videoId) {
    const cacheKey = `video_${videoId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Check if API key is configured
    if (!this.apiKey) {
      throw new Error('YouTube API key is not configured. Please add YOUTUBE_API_KEY to your .env file.');
    }

    try {
      const response = await this.withRetry(async () => {
        return axios.get(`${this.baseUrl}/videos`, {
          params: {
            key: this.apiKey,
            id: videoId,
            part: 'snippet,statistics,contentDetails'
          }
        });
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found or is private/deleted');
      }

      const video = response.data.items[0];
      const result = {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails,
        duration: this.parseDuration(video.contentDetails.duration),
        durationRaw: video.contentDetails.duration,
        tags: video.snippet.tags || [],
        categoryId: video.snippet.categoryId,
        statistics: {
          viewCount: parseInt(video.statistics.viewCount || 0),
          likeCount: parseInt(video.statistics.likeCount || 0),
          commentCount: parseInt(video.statistics.commentCount || 0)
        }
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      // Handle specific API errors
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data?.error;
        
        if (status === 403) {
          if (errorData?.errors?.[0]?.reason === 'quotaExceeded') {
            throw new Error('YouTube API quota exceeded. Please try again tomorrow.');
          }
          throw new Error('YouTube API access forbidden. Please check your API key permissions in Google Cloud Console - ensure YouTube Data API v3 is allowed for this key.');
        }
        
        if (status === 400) {
          throw new Error('Invalid video ID or request. Please check the YouTube URL.');
        }
        
        if (status === 404) {
          throw new Error('Video not found. It may be private or deleted.');
        }
      }
      
      this.handleError(error, 'getVideoDetails');
    }
  }

  /**
   * Get top comments for a video
   * @param {string} videoId - YouTube video ID
   * @param {number} [maxResults=50] - Maximum number of comments to fetch
   * @returns {Promise<Object[]>} Array of comment objects
   */
  async getVideoComments(videoId, maxResults = 50) {
    const cacheKey = `comments_${videoId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.withRetry(async () => {
        return axios.get(`${this.baseUrl}/commentThreads`, {
          params: {
            key: this.apiKey,
            videoId: videoId,
            part: 'snippet',
            maxResults: maxResults,
            order: 'relevance',
            textFormat: 'plainText'
          }
        });
      });

      const comments = (response.data.items || []).map(item => ({
        id: item.id,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt
      }));

      this.setCache(cacheKey, comments);
      return comments;
    } catch (error) {
      // Comments might be disabled - return empty array instead of throwing
      this.log('warn', `Could not fetch comments for video ${videoId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get channel details
   * @param {string} channelId - YouTube channel ID
   * @returns {Promise<Object>} Channel details
   */
  async getChannelDetails(channelId) {
    const cacheKey = `channel_${channelId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.withRetry(async () => {
        return axios.get(`${this.baseUrl}/channels`, {
          params: {
            key: this.apiKey,
            id: channelId,
            part: 'snippet,statistics'
          }
        });
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      const channel = response.data.items[0];
      const result = {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails?.default?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount || 0),
        videoCount: parseInt(channel.statistics.videoCount || 0)
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.handleError(error, 'getChannelDetails');
    }
  }

  /**
   * Parse ISO 8601 duration to human readable format
   * @param {string} duration - ISO 8601 duration string
   * @returns {string} Human readable duration (e.g., "1:30:45")
   */
  parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate engagement metrics
   * @param {Object} statistics - Video statistics
   * @returns {Object} Engagement metrics
   */
  calculateEngagement(statistics) {
    const { viewCount, likeCount, commentCount } = statistics;
    
    return {
      likeRatio: viewCount > 0 ? (likeCount / viewCount) * 100 : 0,
      commentRatio: viewCount > 0 ? (commentCount / viewCount) * 100 : 0,
      engagementScore: viewCount > 0 
        ? ((likeCount + commentCount * 2) / viewCount) * 100 
        : 0
    };
  }
}

// Singleton instance
const youtubeService = new YouTubeService();

module.exports = youtubeService;
