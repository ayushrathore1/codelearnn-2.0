/**
 * API Compatibility Middleware
 * 
 * Ensures backward compatibility for older API clients:
 * - Transforms responses to legacy format
 * - Maps old routes to new ones
 * - Handles deprecated fields
 */

/**
 * Add legacy field mappings to response
 */
const addLegacyFields = (data, type) => {
  if (!data) return data;

  switch (type) {
    case 'user':
      // Legacy clients expect 'selectedCareer' instead of 'activeCareerId'
      if (data.activeCareerId && !data.selectedCareer) {
        data.selectedCareer = data.activeCareerId;
      }
      break;

    case 'learningPath':
      // Legacy clients expect flat video array
      if (data.structureGraph?.nodes && !data.videos) {
        data.videos = data.structureGraph.nodes.map(n => ({
          videoId: n.videoId,
          title: n.title,
          thumbnailUrl: n.thumbnailUrl,
          order: n.order,
          completed: n.isCompleted
        }));
      }
      // Legacy progress calculation
      if (typeof data.progressPercentage === 'undefined' && data.structureGraph) {
        const nodes = data.structureGraph.nodes || [];
        const completed = nodes.filter(n => n.isCompleted).length;
        data.progressPercentage = nodes.length > 0 
          ? Math.round((completed / nodes.length) * 100) 
          : 0;
      }
      break;

    case 'savedVideo':
      // Legacy clients expect 'isAnalyzed' boolean
      if (!data.hasOwnProperty('isAnalyzed')) {
        data.isAnalyzed = !!(data.inferredSkills?.length || data.inferredCareers?.length);
      }
      // Legacy score naming
      if (data.codelearnnScore && !data.score) {
        data.score = data.codelearnnScore;
      }
      break;

    default:
      break;
  }

  return data;
};

/**
 * Middleware to transform responses for legacy clients
 */
const legacyResponseTransformer = (type) => {
  return (req, res, next) => {
    // Check for legacy client header
    const clientVersion = req.headers['x-client-version'];
    const isLegacy = !clientVersion || parseInt(clientVersion) < 2;

    if (!isLegacy) {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function(body) {
      if (body && body.data) {
        if (Array.isArray(body.data)) {
          body.data = body.data.map(item => addLegacyFields(item, type));
        } else {
          body.data = addLegacyFields(body.data, type);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Route aliasing for deprecated endpoints
 */
const routeAliases = {
  // Old route -> New route
  '/api/analyzed-videos': '/api/saved-videos',
  '/api/user/paths': '/api/user/learning-paths',
  '/api/career-paths': '/api/user/learning-paths/public/browse'
};

/**
 * Middleware to redirect deprecated routes
 */
const handleDeprecatedRoutes = (req, res, next) => {
  const newRoute = routeAliases[req.path];
  
  if (newRoute) {
    // Log deprecation warning
    console.warn(`Deprecated route accessed: ${req.path} -> ${newRoute}`);
    
    // Add deprecation header
    res.setHeader('X-Deprecated-Route', 'true');
    res.setHeader('X-New-Route', newRoute);
    
    // Rewrite the URL internally
    req.url = newRoute + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '');
  }
  
  next();
};

/**
 * Parse legacy request body formats
 */
const parseLegacyBody = (req, res, next) => {
  if (!req.body) {
    return next();
  }

  // Convert legacy video save format
  if (req.body.videoData && !req.body.videoId) {
    Object.assign(req.body, req.body.videoData);
    delete req.body.videoData;
  }

  // Convert legacy path update format
  if (req.body.pathData && !req.body.nodes) {
    Object.assign(req.body, req.body.pathData);
    delete req.body.pathData;
  }

  // Convert legacy career field
  if (req.body.selectedCareer && !req.body.careerId) {
    req.body.careerId = req.body.selectedCareer;
  }

  next();
};

/**
 * API version negotiation
 */
const versionNegotiation = (req, res, next) => {
  const requestedVersion = req.headers['accept-version'] || 
                           req.query.api_version || 
                           'v2';
  
  req.apiVersion = requestedVersion;
  res.setHeader('X-API-Version', 'v2');
  
  // Warn about old versions
  if (requestedVersion === 'v1') {
    res.setHeader('X-API-Deprecation-Warning', 'API v1 is deprecated, please upgrade to v2');
  }
  
  next();
};

module.exports = {
  legacyResponseTransformer,
  handleDeprecatedRoutes,
  parseLegacyBody,
  versionNegotiation,
  addLegacyFields
};
