import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faCheckCircle,
  faArrowUp,
  faCopy,
  faCheck,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faLinkedin,
  faFacebook,
} from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../context/AuthContext";
import { opportunitiesAPI } from "../services/api";

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

const OpportunityDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchOpportunity();
  }, [slug]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const response = await opportunitiesAPI.getBySlug(slug);

      if (response.data.success) {
        setOpportunity(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      navigate("/opportunities");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this opportunity?"))
      return;

    try {
      await opportunitiesAPI.delete(opportunity._id);
      navigate("/opportunities");
    } catch (error) {
      console.error("Error deleting opportunity:", error);
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDeadlineInfo = () => {
    if (!opportunity?.deadline) return null;
    const now = new Date();
    const deadline = new Date(opportunity.deadline);
    const diff = deadline - now;

    if (diff < 0) return { text: "Expired", urgent: false, expired: true };

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return { text: "Deadline Today!", urgent: true };
    if (days === 1) return { text: "1 day left", urgent: true };
    if (days <= 7) return { text: `${days} days left`, urgent: true };
    return { text: `${days} days left`, urgent: false };
  };

  const shareUrl = window.location.href;
  const shareText = opportunity?.title;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-5xl text-secondary animate-spin"
          />
          <p className="text-text-muted">Loading opportunity...</p>
        </div>
      </main>
    );
  }

  if (!opportunity) {
    return (
      <main className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
            <FontAwesomeIcon
              icon={faRocket}
              className="text-4xl text-text-dim"
            />
          </div>
          <p className="text-text-muted text-xl mb-4">Opportunity not found</p>
          <Link to="/opportunities" className="text-secondary hover:underline">
            ← Back to all opportunities
          </Link>
        </motion.div>
      </main>
    );
  }

  const typeColor = typeColors[opportunity.type] || "from-primary to-secondary";
  const typeIcon = typeIcons[opportunity.type] || faRocket;
  const isAuthor = user?._id === opportunity.author?._id;
  const deadlineInfo = getDeadlineInfo();

  return (
    <main className="min-h-screen bg-bg-base selection:bg-secondary selection:text-black">
      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollTop ? 1 : 0 }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-secondary to-primary text-bg-base shadow-lg shadow-secondary/25 flex items-center justify-center hover:scale-110 transition-transform"
      >
        <FontAwesomeIcon icon={faArrowUp} />
      </motion.button>

      <article className="relative pt-28 pb-20">
        {/* Glow Effects */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-10"
          >
            <Link
              to="/opportunities"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border text-text-muted hover:text-secondary hover:border-secondary/50 transition-all text-sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Opportunities
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r ${typeColor} text-white uppercase tracking-wide shadow-lg`}
                  >
                    <FontAwesomeIcon icon={typeIcon} />
                    {opportunity.type}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${statusColors[opportunity.status]}`}
                  >
                    {opportunity.status}
                  </span>
                  {opportunity.featured && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg">
                      <FontAwesomeIcon icon={faStar} />
                      Featured
                    </span>
                  )}
                  {deadlineInfo?.urgent && !deadlineInfo?.expired && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
                      <FontAwesomeIcon icon={faBolt} />
                      {deadlineInfo.text}
                    </span>
                  )}
                </div>

                {/* Organization */}
                {opportunity.organization && (
                  <div className="flex items-center gap-2 text-secondary text-sm font-semibold uppercase tracking-wider mb-4">
                    <FontAwesomeIcon icon={faBuilding} />
                    {opportunity.organization}
                  </div>
                )}

                {/* Title */}
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-main mb-6 leading-[1.1] tracking-tight">
                  {opportunity.title}
                </h1>

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-6 text-text-muted">
                  <span className="flex items-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faEye} className="text-secondary" />
                    {opportunity.views} views
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-primary"
                    />
                    Posted {formatDate(opportunity.createdAt)}
                  </span>
                </div>

                {/* Author Actions */}
                {isAuthor && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() =>
                        navigate(`/opportunities/edit/${opportunity.slug}`)
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-muted hover:text-secondary hover:border-secondary/50 transition-all text-sm font-medium"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
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
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-10 rounded-3xl overflow-hidden shadow-2xl shadow-secondary/10"
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
                className="bg-bg-elevated rounded-2xl border border-border p-8 mb-8"
              >
                <h2 className="font-heading text-2xl font-bold text-text-main mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-secondary to-primary flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faRocket}
                      className="text-bg-base text-sm"
                    />
                  </div>
                  About This Opportunity
                </h2>
                <div
                  className="prose prose-invert prose-lg max-w-none
                    prose-headings:font-heading prose-headings:font-bold prose-headings:text-text-main
                    prose-p:text-text-muted prose-p:leading-relaxed
                    prose-a:text-secondary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-text-main
                    prose-ul:text-text-muted prose-ol:text-text-muted
                    prose-li:marker:text-secondary"
                  dangerouslySetInnerHTML={{ __html: opportunity.description }}
                />
              </motion.div>

              {/* Eligibility */}
              {opportunity.eligibility &&
                opportunity.eligibility.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-bg-elevated rounded-2xl border border-border p-8 mb-8"
                  >
                    <h2 className="font-heading text-2xl font-bold text-text-main mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faUserGraduate}
                          className="text-green-400"
                        />
                      </div>
                      Eligibility Requirements
                    </h2>
                    <ul className="space-y-4">
                      {opportunity.eligibility.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-text-muted text-lg"
                        >
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className="text-green-400 mt-1.5 flex-shrink-0"
                          />
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
                  className="flex flex-wrap gap-2 mb-10"
                >
                  {opportunity.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-bg-elevated rounded-xl text-sm text-text-muted border border-border hover:border-secondary/50 hover:text-secondary transition-all cursor-default font-medium"
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
                className="flex flex-wrap items-center gap-4 py-8 px-6 -mx-6 bg-bg-elevated/50 backdrop-blur-sm border-y border-border rounded-2xl"
              >
                <span className="text-text-muted text-sm font-medium">
                  <FontAwesomeIcon icon={faShare} className="mr-2" />
                  Share this opportunity:
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-muted hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all"
                  >
                    <FontAwesomeIcon icon={faTwitter} />
                  </a>
                  <a
                    href={shareLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-muted hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-all"
                  >
                    <FontAwesomeIcon icon={faLinkedin} />
                  </a>
                  <a
                    href={shareLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-muted hover:text-[#1877F2] hover:border-[#1877F2]/50 transition-all"
                  >
                    <FontAwesomeIcon icon={faFacebook} />
                  </a>
                  <button
                    onClick={copyLink}
                    className="w-11 h-11 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-muted hover:text-secondary hover:border-secondary/50 transition-all"
                  >
                    <FontAwesomeIcon
                      icon={copied ? faCheck : faCopy}
                      className={copied ? "text-green-500" : ""}
                    />
                  </button>
                </div>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-10 text-center"
              >
                <Link
                  to="/opportunities"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-secondary to-primary text-bg-base font-semibold text-base hover:shadow-[0_0_40px_-5px_var(--secondary-glow)] transition-all"
                >
                  <FontAwesomeIcon icon={faRocket} />
                  Explore More Opportunities
                </Link>
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
                <div className="bg-bg-elevated rounded-2xl border border-border p-6 shadow-lg">
                  {/* Deadline Alert */}
                  {deadlineInfo && (
                    <div
                      className={`mb-5 px-5 py-4 rounded-xl text-center font-semibold ${
                        deadlineInfo.expired
                          ? "bg-gray-500/10 text-gray-400"
                          : deadlineInfo.urgent
                            ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      <FontAwesomeIcon icon={faClock} className="mr-2" />
                      {deadlineInfo.text}
                    </div>
                  )}

                  {/* Apply Button */}
                  <a
                    href={opportunity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full py-4 rounded-xl font-bold text-center text-lg transition-all ${
                      deadlineInfo?.expired
                        ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-secondary to-primary text-bg-base hover:shadow-[0_0_40px_-5px_var(--secondary-glow)]"
                    }`}
                  >
                    {deadlineInfo?.expired
                      ? "Applications Closed"
                      : "Apply Now"}
                    {!deadlineInfo?.expired && (
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        className="ml-2 text-sm"
                      />
                    )}
                  </a>
                </div>

                {/* Details Card */}
                <div className="bg-bg-elevated rounded-2xl border border-border p-6 space-y-4">
                  <h3 className="font-heading font-semibold text-text-main">
                    Details
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className="text-primary"
                      />
                    </div>
                    <div>
                      <p className="text-text-dim text-xs">Location</p>
                      <p className="text-text-main font-medium">
                        {opportunity.location || "Remote"}
                      </p>
                    </div>
                  </div>

                  {/* Stipend */}
                  {opportunity.stipend && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faMoneyBill}
                          className="text-green-400"
                        />
                      </div>
                      <div>
                        <p className="text-text-dim text-xs">Stipend/Prize</p>
                        <p className="text-text-main font-medium">
                          {opportunity.stipend}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Deadline */}
                  {opportunity.deadline && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faCalendar}
                          className="text-orange-400"
                        />
                      </div>
                      <div>
                        <p className="text-text-dim text-xs">Deadline</p>
                        <p className="text-text-main font-medium">
                          {formatDate(opportunity.deadline)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Start Date */}
                  {opportunity.startDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faCalendar}
                          className="text-blue-400"
                        />
                      </div>
                      <div>
                        <p className="text-text-dim text-xs">Starts</p>
                        <p className="text-text-main font-medium">
                          {formatDate(opportunity.startDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* End Date */}
                  {opportunity.endDate && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faCalendar}
                          className="text-purple-400"
                        />
                      </div>
                      <div>
                        <p className="text-text-dim text-xs">Ends</p>
                        <p className="text-text-main font-medium">
                          {formatDate(opportunity.endDate)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Posted By */}
                <div className="bg-bg-elevated rounded-2xl border border-border p-6">
                  <h3 className="font-heading font-semibold text-text-main mb-3">
                    Posted By
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-sm font-bold text-bg-base">
                      {opportunity.author?.name?.charAt(0) || "A"}
                    </div>
                    <div>
                      <p className="text-text-main font-medium">
                        {opportunity.author?.name || "Anonymous"}
                      </p>
                      <p className="text-text-dim text-xs">
                        {formatDate(opportunity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </article>
    </main>
  );
};

export default OpportunityDetailPage;
