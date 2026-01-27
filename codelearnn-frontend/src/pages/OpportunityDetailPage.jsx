import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faExternalLinkAlt,
  faMapMarkerAlt,
  faCalendar,
  faClock,
  faBuilding,
  faMoneyBill,
  faUserGraduate,
  faEye,
  faShare,
  faSpinner,
  faCode,
  faGraduationCap,
  faBriefcase,
  faTrophy,
  faGift,
  faRocket,
  faEdit,
  faTrash,
  faStar,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faLinkedin, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';
import { opportunitiesAPI } from '../services/api';

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

const OpportunityDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunity();
  }, [slug]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const response = await opportunitiesAPI.getBySlug(slug);
      
      if (response.data.success) {
        setOpportunity(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      navigate('/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      await opportunitiesAPI.delete(opportunity._id);
      navigate('/opportunities');
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDeadlineInfo = () => {
    if (!opportunity?.deadline) return null;
    const now = new Date();
    const deadline = new Date(opportunity.deadline);
    const diff = deadline - now;
    
    if (diff < 0) return { text: 'Expired', urgent: false, expired: true };
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return { text: 'Deadline Today!', urgent: true };
    if (days === 1) return { text: '1 day left', urgent: true };
    if (days <= 7) return { text: `${days} days left`, urgent: true };
    return { text: `${days} days left`, urgent: false };
  };

  const shareUrl = window.location.href;
  const shareText = opportunity?.title;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-secondary animate-spin" />
      </main>
    );
  }

  if (!opportunity) {
    return (
      <main className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted text-lg mb-4">Opportunity not found</p>
          <Link to="/opportunities" className="text-secondary hover:underline">
            Back to opportunities
          </Link>
        </div>
      </main>
    );
  }

  const typeColor = typeColors[opportunity.type] || 'from-primary to-secondary';
  const typeIcon = typeIcons[opportunity.type] || faRocket;
  const isAuthor = user?._id === opportunity.author?._id;
  const deadlineInfo = getDeadlineInfo();

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 text-text-muted hover:text-secondary transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Opportunities
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r ${typeColor} text-white uppercase tracking-wide`}>
                  <FontAwesomeIcon icon={typeIcon} />
                  {opportunity.type}
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusColors[opportunity.status]}`}>
                  {opportunity.status}
                </span>
                {opportunity.featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-yellow-500 to-amber-500 text-black">
                    <FontAwesomeIcon icon={faStar} />
                    Featured
                  </span>
                )}
              </div>

              {/* Organization */}
              {opportunity.organization && (
                <p className="text-text-dim text-sm font-medium uppercase tracking-wide mb-2">
                  <FontAwesomeIcon icon={faBuilding} className="mr-2" />
                  {opportunity.organization}
                </p>
              )}

              {/* Title */}
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-main mb-4 leading-tight">
                {opportunity.title}
              </h1>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 text-text-muted text-sm">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faEye} />
                  {opportunity.views} views
                </span>
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} />
                  Posted {formatDate(opportunity.createdAt)}
                </span>
              </div>

              {/* Author Actions */}
              {isAuthor && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/opportunities/edit/${opportunity.slug}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated border border-border text-text-muted hover:text-secondary hover:border-secondary/50 transition-all text-sm"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete
                  </button>
                </div>
              )}
            </motion.header>

            {/* Cover Image */}
            {opportunity.coverImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 rounded-2xl overflow-hidden"
              >
                <img
                  src={opportunity.coverImage}
                  alt={opportunity.title}
                  className="w-full aspect-video object-cover"
                />
              </motion.div>
            )}

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bg-elevated rounded-2xl border border-border p-6 mb-8"
            >
              <h2 className="font-heading text-xl font-semibold text-text-main mb-4">
                About This Opportunity
              </h2>
              <div 
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: opportunity.description }}
              />
            </motion.div>

            {/* Eligibility */}
            {opportunity.eligibility && opportunity.eligibility.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-bg-elevated rounded-2xl border border-border p-6 mb-8"
              >
                <h2 className="font-heading text-xl font-semibold text-text-main mb-4">
                  <FontAwesomeIcon icon={faUserGraduate} className="mr-2 text-secondary" />
                  Eligibility
                </h2>
                <ul className="space-y-2">
                  {opportunity.eligibility.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-muted">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mt-1 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Tags */}
            {opportunity.tags && opportunity.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2 mb-8"
              >
                {opportunity.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-bg-elevated rounded-lg text-sm text-text-muted border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Share */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-4 py-6 border-t border-border"
            >
              <span className="text-text-muted text-sm">
                <FontAwesomeIcon icon={faShare} className="mr-2" />
                Share:
              </span>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all"
              >
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-all"
              >
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-[#1877F2] hover:border-[#1877F2]/50 transition-all"
              >
                <FontAwesomeIcon icon={faFacebook} />
              </a>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-28 space-y-6">
              {/* Apply Card */}
              <div className="bg-bg-elevated rounded-2xl border border-border p-6">
                {/* Deadline Alert */}
                {deadlineInfo && (
                  <div className={`mb-4 px-4 py-3 rounded-xl text-center font-medium ${
                    deadlineInfo.expired 
                      ? 'bg-gray-500/10 text-gray-400'
                      : deadlineInfo.urgent 
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                        : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    <FontAwesomeIcon icon={faClock} className="mr-2" />
                    {deadlineInfo.text}
                  </div>
                )}

                {/* Apply Button */}
                <a
                  href={opportunity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full py-4 rounded-xl font-semibold text-center transition-opacity ${
                    deadlineInfo?.expired
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-secondary to-primary text-bg-base hover:opacity-90'
                  }`}
                >
                  {deadlineInfo?.expired ? 'Applications Closed' : 'Apply Now'}
                  {!deadlineInfo?.expired && (
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2 text-sm" />
                  )}
                </a>
              </div>

              {/* Details Card */}
              <div className="bg-bg-elevated rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-heading font-semibold text-text-main">Details</h3>
                
                {/* Location */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-text-dim text-xs">Location</p>
                    <p className="text-text-main font-medium">{opportunity.location || 'Remote'}</p>
                  </div>
                </div>

                {/* Stipend */}
                {opportunity.stipend && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <FontAwesomeIcon icon={faMoneyBill} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-text-dim text-xs">Stipend/Prize</p>
                      <p className="text-text-main font-medium">{opportunity.stipend}</p>
                    </div>
                  </div>
                )}

                {/* Deadline */}
                {opportunity.deadline && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendar} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-text-dim text-xs">Deadline</p>
                      <p className="text-text-main font-medium">{formatDate(opportunity.deadline)}</p>
                    </div>
                  </div>
                )}

                {/* Start Date */}
                {opportunity.startDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendar} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-text-dim text-xs">Starts</p>
                      <p className="text-text-main font-medium">{formatDate(opportunity.startDate)}</p>
                    </div>
                  </div>
                )}

                {/* End Date */}
                {opportunity.endDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendar} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-text-dim text-xs">Ends</p>
                      <p className="text-text-main font-medium">{formatDate(opportunity.endDate)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Posted By */}
              <div className="bg-bg-elevated rounded-2xl border border-border p-6">
                <h3 className="font-heading font-semibold text-text-main mb-3">Posted By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-sm font-bold text-bg-base">
                    {opportunity.author?.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-text-main font-medium">{opportunity.author?.name || 'Anonymous'}</p>
                    <p className="text-text-dim text-xs">{formatDate(opportunity.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </main>
  );
};

export default OpportunityDetailPage;
