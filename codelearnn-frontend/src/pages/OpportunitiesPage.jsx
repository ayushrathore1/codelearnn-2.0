import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faMapMarkerAlt,
  faClock,
  faExternalLinkAlt,
  faStar,
  faArrowRight,
  faFire,
  faBookOpen,
  faEnvelope,
  faFileAlt,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { opportunitiesAPI } from "../services/api";
import CreateOpportunityModal from "../components/opportunities/CreateOpportunityModal";

const typeIcons = {
  hackathon: faCode,
  fellowship: faGraduationCap,
  internship: faBriefcase,
  job: faBriefcase,
  scholarship: faGift,
  competition: faTrophy,
  other: faRocket,
};

const typeColors = {
  hackathon: "from-cyan-500 to-blue-500",
  fellowship: "from-purple-500 to-indigo-500",
  internship: "from-green-500 to-emerald-500",
  job: "from-orange-500 to-amber-500",
  scholarship: "from-pink-500 to-rose-500",
  competition: "from-yellow-500 to-orange-500",
  other: "from-gray-500 to-slate-500",
};

const statusColors = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const OpportunityCard = ({ opportunity, index = 0 }) => {
  const typeColor = typeColors[opportunity.type] || "from-primary to-secondary";
  const typeIcon = typeIcons[opportunity.type] || faRocket;

  const getDeadlineText = () => {
    if (!opportunity.deadline) return null;
    const now = new Date();
    const deadline = new Date(opportunity.deadline);
    const diff = deadline - now;

    if (diff < 0) return "Expired";

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today!";
    if (days === 1) return "1 day left";
    if (days <= 7) return `${days} days left`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks left`;
    return deadline.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const deadlineText = getDeadlineText();
  const isUrgent =
    opportunity.deadline &&
    new Date(opportunity.deadline) - new Date() < 7 * 24 * 60 * 60 * 1000;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative bg-bg-elevated rounded-2xl border border-border overflow-hidden backdrop-blur-sm">
        {opportunity.featured && (
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg">
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
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${typeColor} opacity-30`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-elevated via-bg-elevated/50 to-transparent" />

            {/* Type Badge */}
            <div className="absolute bottom-4 left-4">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r ${typeColor} text-white uppercase tracking-wide shadow-lg`}
              >
                <FontAwesomeIcon icon={typeIcon} />
                {opportunity.type}
              </span>
            </div>

            {/* Deadline Badge - Urgent */}
            {isUrgent && deadlineText && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
                  <FontAwesomeIcon icon={faFire} />
                  {deadlineText}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Organization */}
            {opportunity.organization && (
              <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                {opportunity.organization}
              </p>
            )}

            {/* Title */}
            <h3 className="font-heading font-bold text-text-main text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {opportunity.title}
            </h3>

            {/* Excerpt */}
            <p className="text-text-muted text-sm line-clamp-2 mb-5 leading-relaxed">
              {opportunity.excerpt}
            </p>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {/* Location */}
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  className="text-primary"
                />
                {opportunity.location || "Remote"}
              </div>

              {/* Stipend */}
              {opportunity.stipend && (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <FontAwesomeIcon icon={faGift} />
                  {opportunity.stipend}
                </div>
              )}

              {/* Deadline (if not urgent - shown differently) */}
              {deadlineText && !isUrgent && (
                <div className="flex items-center gap-2 text-text-dim text-sm">
                  <FontAwesomeIcon icon={faClock} className="text-secondary" />
                  {deadlineText}
                </div>
              )}

              {/* Status */}
              <div className="flex items-center">
                <span
                  className={`text-xs px-3 py-1 rounded-full border font-medium ${statusColors[opportunity.status] || statusColors.active}`}
                >
                  {opportunity.status}
                </span>
              </div>
            </div>

            {/* Tags */}
            {opportunity.tags && opportunity.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {opportunity.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-bg-base/80 rounded-lg text-xs text-text-dim font-medium border border-border/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* View more indicator */}
            <div className="flex items-center gap-2 text-secondary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span>View details</span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-xs group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        </Link>

        {/* Quick Apply Button */}
        <div className="px-6 pb-6">
          <a
            href={opportunity.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block w-full py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-bg-base font-semibold text-sm text-center hover:shadow-[0_0_30px_-5px_var(--secondary-glow)] transition-all"
          >
            Apply Now
            <FontAwesomeIcon
              icon={faExternalLinkAlt}
              className="ml-2 text-xs"
            />
          </a>
        </div>
      </div>
    </motion.article>
  );
};

const OpportunitiesPage = () => {
  const { isAuthenticated } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [featuredOpps, setFeaturedOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const types = [
    { id: "all", label: "All", icon: faBolt },
    { id: "hackathon", label: "Hackathons", icon: faCode },
    { id: "fellowship", label: "Fellowships", icon: faGraduationCap },
    { id: "internship", label: "Internships", icon: faBriefcase },
    { id: "job", label: "Jobs", icon: faBriefcase },
    { id: "scholarship", label: "Scholarships", icon: faGift },
    { id: "competition", label: "Competitions", icon: faTrophy },
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
      console.error("Error fetching featured:", error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 12,
        status: selectedStatus,
      };

      if (selectedType !== "all") {
        params.type = selectedType;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await opportunitiesAPI.getAll(params);

      if (response.data.success) {
        setOpportunities(response.data.data);
        setPagination((prev) => ({
          ...prev,
          pages: response.data.pagination.pages,
          total: response.data.pagination.total,
        }));
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchOpportunities();
  };

  const handleCreated = () => {
    setShowCreateModal(false);
    fetchOpportunities();
    fetchFeatured();
  };

  return (
    <main className="min-h-screen bg-bg-base selection:bg-secondary selection:text-black">
      {/* Hero Section with premium glow effects */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Glow Effects - matching HomePage */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-mono font-medium">
                <FontAwesomeIcon icon={faRocket} />
                <span className="text-metallic">Career Accelerator</span>
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-heading text-5xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              <span className="text-gradient-secondary">Opportunities</span>
              <span className="text-text-main"> Hub</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-text-muted text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Discover hackathons, fellowships, internships, and more. Never
              miss an opportunity to accelerate your engineering career.
            </motion.p>

            {/* Search Bar - Premium Style */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/50 to-primary/50 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search hackathons, internships, fellowships..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-14 rounded-2xl bg-bg-elevated border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 transition-all text-base"
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-5 text-text-dim group-focus-within:text-secondary transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-primary text-bg-base font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-secondary/25"
                  >
                    Search
                  </button>
                </div>
              </div>
            </motion.form>

            {/* Post Opportunity Button */}
            {isAuthenticated && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-secondary to-primary text-bg-base font-semibold text-base hover:shadow-[0_0_40px_-5px_var(--secondary-glow)] transition-all"
              >
                <FontAwesomeIcon icon={faPlus} />
                Post an Opportunity
              </motion.button>
            )}

            {!isAuthenticated && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-text-dim text-sm"
              >
                <Link to="/login" className="text-secondary hover:underline">
                  Sign in
                </Link>{" "}
                to post opportunities for the community
              </motion.p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Type Tabs - Premium Style */}
      <section className="container mx-auto px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-6"
        >
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                selectedType === type.id
                  ? "bg-gradient-to-r from-secondary to-primary text-bg-base shadow-lg shadow-secondary/25"
                  : "bg-bg-elevated border border-border text-text-muted hover:text-secondary hover:border-secondary/50 hover:bg-bg-elevated/80"
              }`}
            >
              <FontAwesomeIcon icon={type.icon} />
              {type.label}
            </button>
          ))}
        </motion.div>

        {/* Status Filter */}
        <div className="flex justify-center gap-3">
          {["active", "upcoming", "all"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                selectedStatus === status
                  ? "bg-bg-elevated border-2 border-secondary text-secondary"
                  : "text-text-dim hover:text-text-muted border-2 border-transparent"
              }`}
            >
              {status === "all" ? "All Status" : status}
            </button>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="container mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-8 md:gap-16 py-6 border-y border-border/30"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-text-main">
              {pagination.total || opportunities.length}
            </div>
            <div className="text-xs text-text-dim uppercase tracking-wide">
              Opportunities
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-main">
              {types.length - 1}
            </div>
            <div className="text-xs text-text-dim uppercase tracking-wide">
              Categories
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">Free</div>
            <div className="text-xs text-text-dim uppercase tracking-wide">
              Always
            </div>
          </div>
        </motion.div>
      </section>

      {/* Featured Section */}
      {featuredOpps.length > 0 &&
        selectedType === "all" &&
        selectedStatus === "active" && (
          <section className="container mx-auto px-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center">
                  <FontAwesomeIcon icon={faStar} className="text-black" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-text-main">
                  Featured Opportunities
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredOpps.map((opp, index) => (
                  <OpportunityCard
                    key={opp._id}
                    opportunity={opp}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          </section>
        )}

      {/* Featured Internship Guide - Shows when internship filter is selected or on all */}
      {(selectedType === "internship" || selectedType === "all") && (
        <section className="container mx-auto px-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <Link
              to="/resources/jaipur-internships-guide"
              className="group block relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-teal-500/10"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

              <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                  <FontAwesomeIcon
                    icon={faBookOpen}
                    className="text-2xl text-white"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                      <FontAwesomeIcon
                        icon={faBriefcase}
                        className="text-[10px]"
                      />
                      Internship Guide
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                      Featured Resource
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2 group-hover:text-green-400 transition-colors">
                    Internship & Training Opportunities in Jaipur
                  </h3>
                  <p className="text-text-secondary text-sm md:text-base mb-4">
                    A curated list of 19 companies with ready-to-use email
                    templates, resume tips, and application strategies for 1st &
                    2nd year students.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faBuilding}
                        className="text-green-400"
                      />
                      19 Companies
                    </span>
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-green-400"
                      />
                      19 Email Templates
                    </span>
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon
                        icon={faFileAlt}
                        className="text-green-400"
                      />
                      Resume Tips
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-all shrink-0">
                  Read Guide
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
            </Link>
          </motion.div>
        </section>
      )}

      {/* Opportunities Grid */}
      <section className="container mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-text-main">
              {selectedType === "all"
                ? "All Opportunities"
                : types.find((t) => t.id === selectedType)?.label}
              <span className="text-text-dim text-base font-normal ml-3">
                ({pagination.total})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <FontAwesomeIcon
                icon={faSpinner}
                className="text-5xl text-secondary animate-spin mb-4"
              />
              <p className="text-text-muted">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faRocket}
                  className="text-4xl text-text-dim"
                />
              </div>
              <p className="text-text-muted text-xl mb-4">
                No opportunities found
              </p>
              <p className="text-text-dim mb-6">
                Be the first to share an opportunity!
              </p>
              {isAuthenticated && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-secondary px-6 py-3"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Post First Opportunity
                </button>
              )}
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {opportunities.map((opp, index) => (
                    <OpportunityCard
                      key={opp._id}
                      opportunity={opp}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center gap-2 mt-16"
                >
                  {Array.from(
                    { length: pagination.pages },
                    (_, i) => i + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page }))
                      }
                      className={`w-12 h-12 rounded-xl font-medium transition-all duration-300 ${
                        pagination.page === page
                          ? "bg-gradient-to-r from-secondary to-primary text-bg-base shadow-lg shadow-secondary/25"
                          : "bg-bg-elevated border border-border text-text-muted hover:border-secondary hover:text-secondary"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
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
