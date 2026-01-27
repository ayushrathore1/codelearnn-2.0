const BaseService = require('./BaseService');
const axios = require('axios');

/**
 * JobApiService - Integration with multiple job APIs
 * Supports automatic fallback when one API hits rate limits
 * 
 * Supported APIs:
 * 1. JSearch (jsearch.p.rapidapi.com) - Aggregates LinkedIn, Indeed, Glassdoor
 * 2. Indeed Jobs (indeed12.p.rapidapi.com) - Indeed listings
 * 3. LinkedIn Jobs Search (linkedin-jobs-search.p.rapidapi.com) - LinkedIn data
 * 4. Active Jobs DB (active-jobs-db.p.rapidapi.com) - Multiple sources
 */
class JobApiService extends BaseService {
  constructor() {
    super('JobApiService');
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    // Configure API sources
    this.apiSources = this.initializeAPISources();
  }

  /**
   * Initialize all configured API sources
   */
  initializeAPISources() {
    const sources = [];
    
    // API 1: Primary (JSearch)
    if (process.env.RAPIDAPI_KEY) {
      const host = process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com';
      sources.push({
        name: 'JSearch',
        key: process.env.RAPIDAPI_KEY,
        host: host,
        type: this.detectApiType(host),
        rateLimited: false,
        lastError: null
      });
    }
    
    // API 2: Secondary
    if (process.env.RAPIDAPI_KEY_2) {
      const host = process.env.RAPIDAPI_HOST_2;
      sources.push({
        name: 'API 2',
        key: process.env.RAPIDAPI_KEY_2,
        host: host,
        type: this.detectApiType(host),
        rateLimited: false,
        lastError: null
      });
    }
    
    // API 3: Tertiary
    if (process.env.RAPIDAPI_KEY_3) {
      const host = process.env.RAPIDAPI_HOST_3;
      sources.push({
        name: 'API 3',
        key: process.env.RAPIDAPI_KEY_3,
        host: host,
        type: this.detectApiType(host),
        rateLimited: false,
        lastError: null
      });
    }
    
    // API 4: Quaternary
    if (process.env.RAPIDAPI_KEY_4) {
      const host = process.env.RAPIDAPI_HOST_4;
      sources.push({
        name: 'API 4',
        key: process.env.RAPIDAPI_KEY_4,
        host: host,
        type: this.detectApiType(host),
        rateLimited: false,
        lastError: null
      });
    }
    
    if (sources.length === 0) {
      this.log('warn', '⚠️ No RapidAPI keys configured! Add RAPIDAPI_KEY to .env');
    } else {
      this.log('info', `✅ Configured ${sources.length} job API(s): ${sources.map(s => s.name).join(', ')}`);
    }
    
    return sources;
  }

  /**
   * Auto-detect API type from hostname
   */
  detectApiType(host) {
    if (!host) return 'unknown';
    if (host.includes('jsearch')) return 'jsearch';
    if (host.includes('indeed')) return 'indeed';
    if (host.includes('linkedin-jobs-search')) return 'linkedin-jobs-search';
    if (host.includes('active-jobs')) return 'active-jobs';
    if (host.includes('job-search4')) return 'job-search4';
    return 'generic';
  }

  /**
   * Get next available API (skip rate-limited)
   */
  getAvailableApiSource() {
    const available = this.apiSources.filter(s => !s.rateLimited);
    if (available.length === 0) {
      // Reset all and try again
      this.apiSources.forEach(s => s.rateLimited = false);
      return this.apiSources[0] || null;
    }
    return available[0];
  }

  /**
   * Main search method - auto-switches between APIs
   */
  async searchJobs(keyword, options = {}) {
    const { location = 'India', limit = 10 } = options;

    // Check cache first
    const cacheKey = `jobs_${keyword}_${location}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      this.log('info', `📦 Cache hit: ${keyword}`);
      return cached;
    }

    const apiSource = this.getAvailableApiSource();
    if (!apiSource) {
      throw new Error('No job API configured. Add RAPIDAPI_KEY to .env file.');
    }

    this.log('info', `🔍 Searching "${keyword}" in ${location} via ${apiSource.name}`);

    try {
      const result = await this.callApi(apiSource, keyword, location, limit);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      // Handle rate limiting
      if (error.response?.status === 403 || error.response?.status === 429) {
        this.log('warn', `⚠️ Rate limited by ${apiSource.name}`);
        apiSource.rateLimited = true;
        apiSource.lastError = new Date().toISOString();
        
        // Auto-reset after 1 hour
        setTimeout(() => { apiSource.rateLimited = false; }, 60 * 60 * 1000);
        
        // Try next API
        const nextApi = this.getAvailableApiSource();
        if (nextApi && nextApi.name !== apiSource.name) {
          this.log('info', `🔄 Switching to ${nextApi.name}`);
          return this.searchJobs(keyword, options);
        }
      }
      
      this.log('error', `❌ ${apiSource.name} error: ${error.message}`);
      throw new Error(`Job search failed: ${error.message}`);
    }
  }

  /**
   * Call the appropriate API based on type
   */
  async callApi(apiSource, keyword, location, limit) {
    const { type, key, host } = apiSource;
    
    switch (type) {
      case 'jsearch':
        return this.callJSearch(key, host, keyword, location);
      case 'indeed':
        return this.callIndeed(key, host, keyword, location);
      case 'linkedin-jobs-search':
        return this.callLinkedInJobsSearch(key, host, keyword, location);
      case 'active-jobs':
        return this.callActiveJobs(key, host, keyword, location);
      case 'job-search4':
        return this.callJobSearch4(key, host, keyword, location);
      default:
        return this.callGeneric(key, host, keyword, location);
    }
  }

  // ============================================
  // API-specific call methods
  // ============================================

  async callJSearch(key, host, keyword, location) {
    const response = await axios.get(`https://${host}/search`, {
      params: {
        query: `${keyword} in ${location}`,
        page: '1',
        num_pages: '1',
        date_posted: 'month'
      },
      headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host },
      timeout: 15000
    });

    const data = response.data?.data || [];
    return {
      jobs: data.slice(0, 10).map((job, i) => ({
        id: job.job_id || `js_${i}`,
        title: job.job_title,
        company: { name: job.employer_name, logo: job.employer_logo },
        location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country,
        salary: this.formatSalary(job.job_min_salary, job.job_max_salary, job.job_salary_currency),
        type: job.job_employment_type || 'Full-time',
        postedDaysAgo: this.calculateDaysAgo(job.job_posted_at_datetime_utc),
        applyUrl: job.job_apply_link,
        source: 'jsearch'
      })),
      totalCount: data.length,
      keyword, location,
      source: 'JSearch'
    };
  }

  async callIndeed(key, host, keyword, location) {
    const response = await axios.get(`https://${host}/jobs/search`, {
      params: {
        query: keyword,
        location: location,
        page_id: '1',
        locality: location.includes('India') ? 'in' : 'us',
        fromage: '30'
      },
      headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host },
      timeout: 15000
    });

    const data = response.data?.hits || [];
    return {
      jobs: data.slice(0, 10).map((job, i) => ({
        id: job.id || `indeed_${i}`,
        title: job.title,
        company: { name: job.company_name, logo: null },
        location: job.location,
        salary: job.salary?.min ? `$${job.salary.min} - $${job.salary.max}` : 'Not disclosed',
        type: job.job_type || 'Full-time',
        postedDaysAgo: job.days_ago || null,
        applyUrl: job.link,
        source: 'indeed'
      })),
      totalCount: response.data?.total || data.length,
      keyword, location,
      source: 'Indeed'
    };
  }

  async callLinkedInJobsSearch(key, host, keyword, location) {
    const response = await axios.get(`https://${host}/`, {
      params: {
        keywords: keyword,
        locationId: location.includes('India') ? '102713980' : '103644278',
        datePosted: 'pastMonth',
        sort: 'mostRelevant'
      },
      headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host },
      timeout: 15000
    });

    const data = response.data || [];
    return {
      jobs: data.slice(0, 10).map((job, i) => ({
        id: job.id || `li_${i}`,
        title: job.title,
        company: { name: job.company?.name, logo: job.company?.logo },
        location: job.location,
        salary: 'Not disclosed',
        type: job.workType || 'Full-time',
        postedDaysAgo: this.calculateDaysAgo(job.postedAt),
        applyUrl: job.url,
        source: 'linkedin'
      })),
      totalCount: data.length,
      keyword, location,
      source: 'LinkedIn Jobs'
    };
  }

  async callActiveJobs(key, host, keyword, location) {
    const response = await axios.get(`https://${host}/active-ats-7d`, {
      params: {
        title_filter: `"${keyword}"`,
        location_filter: `"${location}"`
      },
      headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host },
      timeout: 15000
    });

    const data = response.data || [];
    return {
      jobs: data.slice(0, 10).map((job, i) => ({
        id: job.id || `aj_${i}`,
        title: job.job_title || job.title,
        company: { name: job.organization || job.company, logo: null },
        location: job.locations_raw || job.location,
        salary: 'Not disclosed',
        type: 'Full-time',
        postedDaysAgo: this.calculateDaysAgo(job.date_posted),
        applyUrl: job.url,
        source: 'active-jobs'
      })),
      totalCount: data.length,
      keyword, location,
      source: 'Active Jobs DB'
    };
  }

  async callJobSearch4(key, host, keyword, location) {
    const response = await axios.get(`https://${host}/search`, {
      params: { query: `${keyword} ${location}` },
      headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host },
      timeout: 15000
    });

    const data = response.data?.jobs || response.data || [];
    return {
      jobs: data.slice(0, 10).map((job, i) => ({
        id: `js4_${i}`,
        title: job.title,
        company: { name: job.company, logo: null },
        location: job.location || location,
        salary: job.salary || 'Not disclosed',
        type: 'Full-time',
        postedDaysAgo: null,
        applyUrl: job.url || job.link,
        source: 'job-search4'
      })),
      totalCount: data.length,
      keyword, location,
      source: 'Job Search'
    };
  }

  async callGeneric(key, host, keyword, location) {
    const response = await axios.get(`https://${host}/search`, {
      params: { q: keyword, location: location },
      headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': host },
      timeout: 15000
    });

    const data = Array.isArray(response.data) ? response.data : (response.data?.jobs || []);
    return {
      jobs: data.slice(0, 10).map((job, i) => ({
        id: `gen_${i}`,
        title: job.title || job.job_title,
        company: { name: job.company || job.employer, logo: null },
        location: job.location || location,
        salary: job.salary || 'Not disclosed',
        type: 'Full-time',
        applyUrl: job.url || job.link,
        source: 'generic'
      })),
      totalCount: data.length,
      keyword, location,
      source: 'Generic API'
    };
  }

  // ============================================
  // Helper methods
  // ============================================

  async searchLinkedInJobs(keyword, options = {}) {
    return this.searchJobs(keyword, options);
  }

  async getJobCountsByCategory(keyword, categories) {
    const counts = {};
    for (const cat of categories) {
      try {
        const jobs = await this.searchJobs(`${keyword} ${cat}`, { limit: 1 });
        counts[cat] = jobs.totalCount || 0;
      } catch { counts[cat] = 0; }
    }
    return counts;
  }

  formatSalary(min, max, currency = '$') {
    if (!min && !max) return 'Not disclosed';
    return `${currency}${min?.toLocaleString() || '?'} - ${max?.toLocaleString() || '?'}`;
  }

  calculateDaysAgo(dateString) {
    if (!dateString) return null;
    const diff = Date.now() - new Date(dateString).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  generateLinkedInSearchUrl(keyword, location = 'India') {
    return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
  }

  // Cache
  getCached(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.ts > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  setCache(key, data) {
    this.cache.set(key, { data, ts: Date.now() });
  }

  // Health check
  getApiStatus() {
    return this.apiSources.map(s => ({
      name: s.name,
      type: s.type,
      rateLimited: s.rateLimited,
      lastError: s.lastError
    }));
  }
}

const jobApiService = new JobApiService();
module.exports = jobApiService;
