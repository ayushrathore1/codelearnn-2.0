/**
 * Premium Feature Middleware
 * Checks user's subscription tier and enforces feature limits
 */

/**
 * Require premium subscription (premium or pro tier)
 */
const requirePremium = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.user.isPremium()) {
    return res.status(403).json({
      success: false,
      error: 'This feature requires a Premium subscription',
      upgradeRequired: true,
      currentTier: req.user.subscription?.tier || 'free',
      upgradeUrl: '/pricing'
    });
  }

  next();
};

/**
 * Require pro subscription
 */
const requirePro = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.user.isPro()) {
    return res.status(403).json({
      success: false,
      error: 'This feature requires a Pro subscription',
      upgradeRequired: true,
      currentTier: req.user.subscription?.tier || 'free',
      upgradeUrl: '/pricing'
    });
  }

  next();
};

/**
 * Check specific feature access
 * Usage: checkFeature('ai_analysis'), checkFeature('coding_challenge')
 */
const checkFeature = (featureName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { allowed, reason, upgradeRequired } = req.user.canUseFeature(featureName);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: reason,
        upgradeRequired: upgradeRequired || false,
        feature: featureName,
        currentTier: req.user.subscription?.tier || 'free',
        upgradeUrl: '/pricing'
      });
    }

    next();
  };
};

/**
 * Track feature usage (increment counter after successful use)
 * Usage: router.post('/analyze', protect, checkFeature('ai_analysis'), trackUsage('ai_analysis'), analyzeController)
 */
const trackUsage = (featureName) => {
  return async (req, res, next) => {
    // Store reference to original json method
    const originalJson = res.json.bind(res);

    // Override json to track usage on success
    res.json = async function(data) {
      // Only track if request was successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300 && data.success !== false) {
        try {
          await req.user.incrementUsage(featureName);
        } catch (error) {
          console.error('Error tracking usage:', error.message);
        }
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Soft check - adds feature access info to request but doesn't block
 * Useful for showing upgrade prompts in UI
 */
const softCheckFeature = (featureName) => {
  return async (req, res, next) => {
    if (req.user) {
      const featureAccess = req.user.canUseFeature(featureName);
      req.featureAccess = req.featureAccess || {};
      req.featureAccess[featureName] = featureAccess;
    }
    next();
  };
};

/**
 * Get tier info middleware
 * Adds tier information to request for use in controllers
 */
const addTierInfo = async (req, res, next) => {
  if (req.user) {
    req.tierInfo = {
      tier: req.user.subscription?.tier || 'free',
      isPremium: req.user.isPremium(),
      isPro: req.user.isPro(),
      limits: req.user.getTierLimits(),
      usage: req.user.usageLimits
    };
  }
  next();
};

module.exports = {
  requirePremium,
  requirePro,
  checkFeature,
  trackUsage,
  softCheckFeature,
  addTierInfo
};
