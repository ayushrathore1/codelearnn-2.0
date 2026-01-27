import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSpinner,
  faSearch,
  faBolt,
  faCode,
  faBriefcase,
  faGraduationCap,
  faTrophy,
  faRocket,
  faGift,
  faCalendar,
  faMapMarkerAlt,
  faClock,
  faExternalLinkAlt,
  faFilter,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { opportunitiesAPI } from '../services/api';
import CreateOpportunityModal from '../components/opportunities/CreateOpportunityModal';

const typeIcons = {
  hackathon: faCode,
  fellowship: faGraduationCap,
  internship: faBriefcase,
  job: faBriefcase,
  scholarship: faGift,
  competition: faTrophy,
  other: faRocket
};

const typeColors = {
  hackathon: 'from-cyan-500 to-blue-500',
  fellowship: 'from-purple-500 to-indigo-500',
  internship: 'from-green-500 to-emerald-500',
  job: 'from-orange-500 to-amber-500',
  scholarship: 'from-pink-500 to-rose-500',
  competition: 'from-yellow-500 to-orange-500',
  other: 'from-gray-500 to-slate-500'
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

const OpportunityCard = ({ opportunity }) => {
  const typeColor = typeColors[opportunity.type] || 'from-primary to-secondary';
  const typeIcon = typeIcons[opportunity.type] || faRocket;

  const getDeadlineText = () => {
    if (!opportunity.deadline) return null;
    const now = new Date();
    const deadline = new Date(opportunity.deadline);
    const diff = deadline - now;
    
    if (diff < 0) return 'Expired';
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today!';
    if (days === 1) return '1 day left';
    if (days <= 7) return `${days} days left`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks left`;
    return deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const deadlineText = getDeadlineText();
  const isUrgent = opportunity.deadline && new Date(opportunity.deadline) - new Date() < 7 * 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-bg-elevated rounded-2xl border border-border overflow-hidden group relative"
    >
      {opportunity.featured && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500 to-amber-500 text-black">
            <FontAwesomeIcon icon={faStar} />
            Featured
          </span>
        </div>
      )}

      <Link to={`/opportunities/${opportunity.slug}`}>
        {/* Header with Cover */}
        <div className="aspect-[2/1] bg-bg-base relative overflow-hidden">
          {opportunity.coverImage ? (
            <img
              src={opportunity.coverImage}
              alt={opportunity.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${typeColor} opacity-30`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated/90 to-transparent" />
          
          {/* Type Badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r ${typeColor} text-white uppercase tracking-wide`}>
              <FontAwesomeIcon icon={typeIcon} />
              {opportunity.type}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Organization */}
          {opportunity.organization && (
            <p className="text-text-dim text-xs font-medium uppercase tracking-wide mb-1">
              {opportunity.organization}
            </p>
          )}

          {/* Title */}
          <h3 className="font-heading font-semibold text-text-main text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {opportunity.title}
          </h3>

          {/* Excerpt */}
          <p className="text-text-muted text-sm line-clamp-2 mb-4">
            {opportunity.excerpt}
          </p>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {/* Location */}
            <div className="flex items-center gap-2 text-text-dim text-xs">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary/70" />
              {opportunity.location || 'Remote'}
            </div>

            {/* Stipend */}
            {opportunity.stipend && (
              <div className="flex items-center gap-2 text-text-dim text-xs">
                <FontAwesomeIcon icon={faGift} className="text-green-400/70" />
                {opportunity.stipend}
              </div>
            )}

            {/* Deadline */}
            {deadlineText && (
              <div className={`flex items-center gap-2 text-xs ${isUrgent ? 'text-orange-400' : 'text-text-dim'}`}>
                <FontAwesomeIcon icon={faClock} />
                {deadlineText}
              </div>
            )}

            {/* Status */}
            <div className="flex items-center">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[opportunity.status] || statusColors.active}`}>
                {opportunity.status}
              </span>
            </div>
          </div>

          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opportunity.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-bg-base rounded text-xs text-text-dim">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Quick Apply Button */}
      <div className="px-5 pb-5">
        <a
          href={opportunity.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-bg-base font-semibold text-sm text-center hover:opacity-90 transition-opacity"
        >
          Apply Now
          <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2 text-xs" />
        </a>
      </div>
    </motion.div>
  );
};

const OpportunitiesPage = () => {
  const { isAuthenticated } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [featuredOpps, setFeaturedOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const types = [
    { id: 'all', label: 'All', icon: faBolt },
    { id: 'hackathon', label: 'Hackathons', icon: faCode },
    { id: 'fellowship', label: 'Fellowships', icon: faGraduationCap },
    { id: 'internship', label: 'Internships', icon: faBriefcase },
    { id: 'job', label: 'Jobs', icon: faBriefcase },
    { id: 'scholarship', label: 'Scholarships', icon: faGift },
    { id: 'competition', label: 'Competitions', icon: faTrophy }
  ];

  useEffect(() => {
    fetchOpportunities();
    fetchFeatured();
  }, [selectedType, selectedStatus, pagination.page]);

  const fetchFeatured = async () => {
    try {
      const response = await opportunitiesAPI.getFeatured(3);
      if (response.data.success) {
        setFeaturedOpps(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching featured:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 12,
        status: selectedStatus
      };

      if (selectedType !== 'all') {
        params.type = selectedType;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await opportunitiesAPI.getAll(params);
      
      if (response.data.success) {
        setOpportunities(response.data.data);
        setPagination(prev => ({
          ...prev,
          pages: response.data.pagination.pages,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOpportunities();
  };

  const handleCreated = () => {
    setShowCreateModal(false);
    fetchOpportunities();
    fetchFeatured();
  };

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-main mb-4">
              <span className="text-gradient">Opportunities</span> Hub
            </h1>
            <p className="text-text-muted text-lg mb-8">
              Discover hackathons, fellowships, internships, and more. 
              Never miss an opportunity to grow your career.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3.5 pl-12 rounded-xl bg-bg-elevated border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary text-bg-base font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Post Opportunity Button */}
            {isAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-bg-base font-semibold hover:opacity-90 transition-opacity"
              >
                <FontAwesomeIcon icon={faPlus} />
                Post an Opportunity
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Type Tabs */}
      <section className="container mx-auto px-6 mb-6">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedType === type.id
                  ? 'bg-gradient-to-r from-secondary to-primary text-bg-base'
                  : 'bg-bg-elevated border border-border text-text-muted hover:text-secondary hover:border-secondary/50'
              }`}
            >
              <FontAwesomeIcon icon={type.icon} />
              {type.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex justify-center gap-2">
          {['active', 'upcoming', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                selectedStatus === status
                  ? 'bg-bg-elevated border border-primary text-primary'
                  : 'text-text-dim hover:text-text-muted'
              }`}
            >
              {status === 'all' ? 'All Status' : status}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      {featuredOpps.length > 0 && selectedType === 'all' && selectedStatus === 'active' && (
        <section className="container mx-auto px-6 mb-10">
          <h2 className="font-heading text-xl font-semibold text-text-main mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
            Featured Opportunities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredOpps.map((opp) => (
              <OpportunityCard key={opp._id} opportunity={opp} />
            ))}
          </div>
        </section>
      )}

      {/* Opportunities Grid */}
      <section className="container mx-auto px-6">
        <h2 className="font-heading text-xl font-semibold text-text-main mb-4">
          {selectedType === 'all' ? 'All Opportunities' : types.find(t => t.id === selectedType)?.label}
          <span className="text-text-dim text-sm font-normal ml-2">({pagination.total})</span>
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-secondary animate-spin" />
          </div>
        ) : opportunities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-text-muted text-lg mb-4">No opportunities found</p>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-secondary hover:underline"
              >
                Post one now!
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {opportunities.map((opp) => (
                  <OpportunityCard key={opp._id} opportunity={opp} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      pagination.page === page
                        ? 'bg-gradient-to-r from-secondary to-primary text-bg-base'
                        : 'bg-bg-elevated border border-border text-text-muted hover:border-secondary'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateOpportunityModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  );
};

export default OpportunitiesPage;
