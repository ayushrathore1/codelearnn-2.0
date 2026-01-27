const Opportunity = require('../models/Opportunity');

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Public
exports.getOpportunities = async (req, res) => {
  try {
    const { 
      type, 
      status = 'active',
      search, 
      tag, 
      location,
      page = 1, 
      limit = 12,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = {};

    // Default to active opportunities unless 'all' is specified
    if (status !== 'all') {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort by featured first, then deadline (closest first)
    let sortQuery = sort;
    if (sort === 'deadline') {
      sortQuery = { featured: -1, deadline: 1 };
    } else if (typeof sort === 'string') {
      sortQuery = sort;
    }

    const opportunities = await Opportunity.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatarUrl avatarIndex');

    const total = await Opportunity.countDocuments(query);

    res.status(200).json({
      success: true,
      data: opportunities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching opportunities'
    });
  }
};

// @desc    Get featured opportunities
// @route   GET /api/opportunities/featured
// @access  Public
exports.getFeatured = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const opportunities = await Opportunity.find({ 
      featured: true,
      status: { $in: ['active', 'upcoming'] }
    })
    .sort({ deadline: 1 })
    .limit(parseInt(limit))
    .populate('author', 'name avatarUrl avatarIndex');

    res.status(200).json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('Get featured opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching featured opportunities'
    });
  }
};

// @desc    Get single opportunity by slug or ID
// @route   GET /api/opportunities/:slug
// @access  Public
exports.getOpportunityBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Try to find by slug first, then by ID
    let opportunity = await Opportunity.findOne({ slug })
      .populate('author', 'name avatarUrl avatarIndex');
    
    if (!opportunity && slug.match(/^[0-9a-fA-F]{24}$/)) {
      opportunity = await Opportunity.findById(slug)
        .populate('author', 'name avatarUrl avatarIndex');
    }

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Increment view count
    opportunity.views += 1;
    await opportunity.save();

    res.status(200).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching opportunity'
    });
  }
};

// @desc    Create a new opportunity
// @route   POST /api/opportunities
// @access  Private
exports.createOpportunity = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      organization, 
      link, 
      deadline, 
      startDate,
      endDate,
      stipend, 
      location, 
      eligibility, 
      tags, 
      coverImage,
      featured 
    } = req.body;

    const opportunity = await Opportunity.create({
      title,
      description,
      type: type || 'other',
      organization: organization || '',
      link,
      deadline: deadline ? new Date(deadline) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      stipend: stipend || '',
      location: location || 'Remote',
      eligibility: eligibility || [],
      tags: tags || [],
      coverImage: coverImage || '',
      featured: featured || false,
      author: req.user.id
    });

    await opportunity.populate('author', 'name avatarUrl avatarIndex');

    res.status(201).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating opportunity'
    });
  }
};

// @desc    Update an opportunity
// @route   PUT /api/opportunities/:id
// @access  Private (author only)
exports.updateOpportunity = async (req, res) => {
  try {
    let opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check ownership
    if (opportunity.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this opportunity'
      });
    }

    const allowedFields = [
      'title', 'description', 'type', 'organization', 'link', 
      'deadline', 'startDate', 'endDate', 'stipend', 'location', 
      'eligibility', 'tags', 'coverImage', 'status', 'featured'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (['deadline', 'startDate', 'endDate'].includes(field) && req.body[field]) {
          opportunity[field] = new Date(req.body[field]);
        } else {
          opportunity[field] = req.body[field];
        }
      }
    });

    await opportunity.save();
    await opportunity.populate('author', 'name avatarUrl avatarIndex');

    res.status(200).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating opportunity'
    });
  }
};

// @desc    Delete an opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private (author only)
exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found'
      });
    }

    // Check ownership
    if (opportunity.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this opportunity'
      });
    }

    await opportunity.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting opportunity'
    });
  }
};

// @desc    Get user's own opportunities
// @route   GET /api/opportunities/my-opportunities
// @access  Private
exports.getMyOpportunities = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { author: req.user.id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const opportunities = await Opportunity.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatarUrl avatarIndex');

    const total = await Opportunity.countDocuments(query);

    res.status(200).json({
      success: true,
      data: opportunities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get my opportunities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching opportunities'
    });
  }
};

// @desc    Get all types with counts
// @route   GET /api/opportunities/types
// @access  Public
exports.getTypes = async (req, res) => {
  try {
    const types = await Opportunity.aggregate([
      { $match: { status: { $in: ['active', 'upcoming'] } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: types.map(t => ({
        name: t._id,
        count: t.count
      }))
    });
  } catch (error) {
    console.error('Get types error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching types'
    });
  }
};
