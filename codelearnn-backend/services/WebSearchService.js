const BaseService = require('./BaseService');
const axios = require('axios');
const WebSearchCache = require('../models/WebSearchCache');

/**
 * WebSearchService - Integration with Google Custom Search JSON API
 * Uses Google Programmable Search Engine for real-time web data
 * All results are stored permanently in MongoDB
 * 
 * Setup:
 * 1. Create a Programmable Search Engine at https://programmablesearchengine.google.com/
 * 2. Enable "Search the entire web" option
 * 3. Get your Search Engine ID (cx)
 * 4. Get an API key from Google Cloud Console
 * 5. Add to .env: GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID
 */
class WebSearchService extends BaseService {
  constructor() {
    super('WebSearchService');
    this.apiKey = process.env.GOOGLE_CSE_API_KEY;
    this.searchEngineId = process.env.GOOGLE_CSE_ID;
    this.baseUrl = 'https://www.googleapis.com/customsearch/v1';
  }

  /**
   * Check if Google Custom Search is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.searchEngineId);
  }

  /**
   * Search for technology information (latest version, use cases, market)
   * @param {string} keyword - Technology or field to search
   * @returns {Promise<Object>} Technology insights
   */
  async searchTechnologyInfo(keyword) {
    const searchType = 'technology';
    
    // Check database first
    try {
      const cached = await WebSearchCache.findByQuery(keyword, searchType);
      if (cached) {
        this.log('info', `DB hit for technology info: ${keyword}`);
        return {
          ...cached.toObject(),
          fromDatabase: true
        };
      }
    } catch (dbError) {
      this.log('warn', `DB check failed: ${dbError.message}`);
    }

    // Perform web search
    const query = `${keyword} latest version features use cases 2025 2026`;
    const results = await this.performSearch(query);
    
    // Extract insights from results
    const insights = this.extractTechnologyInsights(results, keyword);
    
    // Save to database
    try {
      await WebSearchCache.saveSearch(keyword, searchType, results, insights);
      this.log('info', `Saved technology info to DB: ${keyword}`);
    } catch (saveError) {
      this.log('warn', `Failed to save to DB: ${saveError.message}`);
    }

    return { query: keyword, searchType, results, insights, fromDatabase: false };
  }

  /**
   * Search for market trends and job demand
   * @param {string} keyword - Technology or field to search
   * @returns {Promise<Object>} Market insights
   */
  async searchMarketTrends(keyword) {
    const searchType = 'market_trends';
    
    // Check database first
    try {
      const cached = await WebSearchCache.findByQuery(keyword, searchType);
      if (cached) {
        this.log('info', `DB hit for market trends: ${keyword}`);
        return {
          ...cached.toObject(),
          fromDatabase: true
        };
      }
    } catch (dbError) {
      this.log('warn', `DB check failed: ${dbError.message}`);
    }

    // Perform web search
    const query = `${keyword} job market demand salary trends 2025 India`;
    const results = await this.performSearch(query);
    
    // Extract insights
    const insights = this.extractMarketInsights(results, keyword);
    
    // Save to database
    try {
      await WebSearchCache.saveSearch(keyword, searchType, results, insights);
      this.log('info', `Saved market trends to DB: ${keyword}`);
    } catch (saveError) {
      this.log('warn', `Failed to save to DB: ${saveError.message}`);
    }

    return { query: keyword, searchType, results, insights, fromDatabase: false };
  }

  /**
   * Search for latest news about a technology
   * @param {string} keyword - Technology to search
   * @returns {Promise<Object>} News results
   */
  async searchNews(keyword) {
    const searchType = 'news';
    
    // Check database first - news cache valid for 24 hours only
    try {
      const cached = await WebSearchCache.findByQuery(keyword, searchType);
      if (cached && (Date.now() - cached.lastAccessedAt.getTime()) < 24 * 60 * 60 * 1000) {
        this.log('info', `DB hit for news: ${keyword}`);
        return {
          ...cached.toObject(),
          fromDatabase: true
        };
      }
    } catch (dbError) {
      this.log('warn', `DB check failed: ${dbError.message}`);
    }

    // Perform news search using date restriction
    const results = await this.performSearch(`${keyword} news updates`, { dateRestrict: 'm1' });
    
    // Save to database
    try {
      await WebSearchCache.saveSearch(keyword, searchType, results, {});
      this.log('info', `Saved news to DB: ${keyword}`);
    } catch (saveError) {
      this.log('warn', `Failed to save to DB: ${saveError.message}`);
    }

    return { query: keyword, searchType, results, fromDatabase: false };
  }

  /**
   * Perform actual web search via Google Custom Search JSON API
   * @param {string} query - Search query
   * @param {Object} options - Additional search options
   * @returns {Promise<Object>} Search results
   */
  async performSearch(query, options = {}) {
    // Check if configured
    if (!this.isConfigured()) {
      this.log('info', 'Google Custom Search not configured, using AI-only mode');
      return this.getSimulatedResults(query);
    }

    try {
      const params = {
        key: this.apiKey,
        cx: this.searchEngineId,
        q: query,
        num: 10, // Max results per request
        ...options
      };

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 15000
      });

      const items = response.data.items || [];
      
      return {
        organic_results: items.map(item => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          displayLink: item.displayLink,
          pagemap: item.pagemap // Contains additional metadata like images
        })),
        searchInformation: response.data.searchInformation,
        spelling: response.data.spelling,
        source: 'google-custom-search'
      };
    } catch (error) {
      if (error.response?.status === 429) {
        this.log('warn', 'Google CSE quota exceeded, using AI-only mode');
      } else {
        this.log('error', `Google CSE error: ${error.message}`);
      }
      return this.getSimulatedResults(query);
    }
  }

  /**
   * Get simulated results when no API is available
   * The AI will still provide accurate info based on training
   */
  getSimulatedResults(query) {
    return {
      organic_results: [],
      note: 'Search API not configured or quota exceeded. AI will provide information from training data.',
      query,
      source: 'ai-only'
    };
  }

  /**
   * Extract technology insights from search results
   */
  extractTechnologyInsights(results, keyword) {
    const insights = {
      latestVersion: null,
      useCases: [],
      trendingTopics: [],
      description: null
    };

    if (!results.organic_results) return insights;

    for (const result of results.organic_results.slice(0, 5)) {
      const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
      
      // Try to extract version numbers (e.g., "Python 3.12", "React 18.2")
      const versionMatch = text.match(/(\d+\.?\d*\.?\d*)\s*(release|version|update)/i) ||
                          text.match(/version\s*(\d+\.?\d*\.?\d*)/i) ||
                          text.match(/v(\d+\.?\d*\.?\d*)/i);
      if (versionMatch && !insights.latestVersion) {
        insights.latestVersion = versionMatch[1];
      }

      // Extract potential use cases from snippets
      if (text.includes('use') || text.includes('application') || text.includes('build')) {
        insights.useCases.push(result.title?.substring(0, 80));
      }
    }

    // Remove duplicates from use cases
    insights.useCases = [...new Set(insights.useCases)].slice(0, 5);

    return insights;
  }

  /**
   * Extract market insights from search results
   */
  extractMarketInsights(results, keyword) {
    const insights = {
      marketDemand: 'Unknown',
      salaryRange: null,
      topCompanies: []
    };

    if (!results.organic_results) return insights;

    for (const result of results.organic_results.slice(0, 5)) {
      const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
      
      // Extract salary mentions (₹ or $ format)
      const salaryMatch = text.match(/(\$|₹|rs\.?|inr)\s*(\d+[\d,]*)\s*[-–to]+\s*(\$|₹|rs\.?|inr)?\s*(\d+[\d,]*)/i) ||
                         text.match(/(\d+[\d,]*)\s*[-–to]+\s*(\d+[\d,]*)\s*(lpa|lakh|k)/i);
      if (salaryMatch && !insights.salaryRange) {
        if (salaryMatch[3] && salaryMatch[3].toLowerCase().includes('lpa')) {
          // LPA format
          insights.salaryRange = {
            min: parseInt(salaryMatch[1].replace(/,/g, '')) * 100000,
            max: parseInt(salaryMatch[2].replace(/,/g, '')) * 100000,
            currency: 'INR'
          };
        } else if (salaryMatch[1]) {
          insights.salaryRange = {
            min: parseInt(salaryMatch[2].replace(/,/g, '')),
            max: parseInt(salaryMatch[4].replace(/,/g, '')),
            currency: salaryMatch[1].includes('$') ? 'USD' : 'INR'
          };
        }
      }

      // Detect demand level from text
      if (text.includes('high demand') || text.includes('most wanted') || text.includes('top skills')) {
        insights.marketDemand = 'High';
      } else if (text.includes('growing') || text.includes('increasing demand')) {
        insights.marketDemand = 'Growing';
      } else if (text.includes('shortage') || text.includes('hiring spree')) {
        insights.marketDemand = 'Very High';
      }
    }

    return insights;
  }

  /**
   * Get combined context for AI prompts
   * @param {string} keyword - Technology to get context for
   * @returns {Promise<string>} Formatted context string
   */
  async getAIContext(keyword) {
    try {
      const [techInfo, marketInfo] = await Promise.all([
        this.searchTechnologyInfo(keyword),
        this.searchMarketTrends(keyword)
      ]);

      let context = `\n=== REAL-TIME WEB CONTEXT FOR "${keyword.toUpperCase()}" ===\n`;
      
      if (techInfo.insights?.latestVersion) {
        context += `Latest Version: ${techInfo.insights.latestVersion}\n`;
      }
      
      if (techInfo.insights?.description) {
        context += `Description: ${techInfo.insights.description}\n`;
      }

      if (marketInfo.insights?.marketDemand && marketInfo.insights.marketDemand !== 'Unknown') {
        context += `Market Demand: ${marketInfo.insights.marketDemand}\n`;
      }

      if (marketInfo.insights?.salaryRange) {
        const { min, max, currency } = marketInfo.insights.salaryRange;
        const symbol = currency === 'USD' ? '$' : '₹';
        context += `Salary Range: ${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}\n`;
      }

      // Add top search results as context
      const allResults = [
        ...(techInfo.results?.organic_results || []),
        ...(marketInfo.results?.organic_results || [])
      ].slice(0, 5);

      if (allResults.length > 0) {
        context += `\nTop Web Results:\n`;
        allResults.forEach((r, i) => {
          if (r.title && r.snippet) {
            context += `${i + 1}. ${r.title}: ${r.snippet.substring(0, 150)}\n`;
          }
        });
      }

      context += `\n=== END CONTEXT ===\n`;
      
      return context;
    } catch (error) {
      this.log('error', `Failed to get AI context: ${error.message}`);
      return '';
    }
  }
}

const webSearchService = new WebSearchService();
module.exports = webSearchService;
