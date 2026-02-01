import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faArrowRight,
  faBriefcase,
  faRoute,
  faChartLine,
  faSpinner,
  faBookmark,
  faExchange,
  faLightbulb,
  faCheckCircle,
  faClock,
  faPlus,
  faVideo,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";

/**
 * DashboardPage - Daily Control Surface
 *
 * Sections (per implementation plan):
 * 1. Active Career Snapshot - Career name, readiness %, CTAs
 * 2. Continue Where You Left Off - Active path, last node, resume
 * 3. Learning Path Health - Missing skills, AI suggestions
 * 4. Recent Activity - Progress events
 * 5. Vault Highlights - Last 2-3 saved items
 *
 * Rules:
 * - No heavy charts
 * - No editing tools (just CTAs to edit pages)
 * - Respect activeCareerId/activeLearningPathId
 * - Meaningful empty states
 */

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    activeCareer: null,
    activePath: null,
    pathHealth: null,
    recentActivity: [],
    vaultHighlights: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // TODO: Replace with actual /api/dashboard/summary call
        // For now, simulate loading and set empty state
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check for activeCareerId in user object
        const hasActiveCareer = user?.activeCareerId;
        const hasActivePath = user?.activeLearningPathId;

        setDashboardData({
          activeCareer: hasActiveCareer
            ? {
                id: user.activeCareerId,
                name: user.careerGoal?.name || "Software Developer",
                description:
                  user.careerGoal?.description || "Full-stack web development",
                readinessScore: 0,
                skillsCovered: 0,
                skillsRequired: 10,
              }
            : null,
          activePath: hasActivePath
            ? {
                id: user.activeLearningPathId,
                name: "Learning Path",
                progress: 0,
                lastCompletedNode: null,
                nextNode: null,
              }
            : null,
          pathHealth: null,
          recentActivity: [],
          vaultHighlights: [],
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Empty state component for consistent styling
  const EmptyState = ({
    icon,
    title,
    description,
    actionLabel,
    actionPath,
    secondary = false,
  }) => (
    <div className="text-center py-8 px-6">
      <div
        className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
          secondary
            ? "bg-bg-elevated border border-border"
            : "bg-primary/10 border border-primary/20"
        }`}
      >
        <FontAwesomeIcon
          icon={icon}
          className={`text-xl ${secondary ? "text-text-dim" : "text-primary"}`}
        />
      </div>
      <h3 className="text-base font-medium text-text-main mb-2">{title}</h3>
      <p className="text-text-muted text-sm mb-4 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && (
        <Link
          to={actionPath}
          className={
            secondary ? "btn-secondary text-sm" : "btn-primary text-sm"
          }
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );

  // Section header component
  const SectionHeader = ({ icon, title, link, linkText }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center border border-border">
          <FontAwesomeIcon icon={icon} className="text-primary text-sm" />
        </span>
        <span className="text-sm font-mono text-text-muted uppercase tracking-wider">
          {title}
        </span>
      </h2>
      {link && (
        <Link
          to={link}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {linkText}
          <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
        </Link>
      )}
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
        <div className="container mx-auto max-w-5xl flex items-center justify-center min-h-[60vh]">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-3xl text-primary animate-spin"
          />
        </div>
      </main>
    );
  }

  const {
    activeCareer,
    activePath,
    pathHealth,
    recentActivity,
    vaultHighlights,
  } = dashboardData;

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-10"
        >
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-main mb-2">
            Welcome back,{" "}
            <span className="text-gradient-primary">
              {user?.name || "Developer"}
            </span>
          </h1>
          <p className="text-text-muted">Your learning command center</p>
        </motion.div>

        {/* Active Career Snapshot */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <SectionHeader icon={faBriefcase} title="Active Career" />

          {activeCareer ? (
            <div className="card-bento p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text-main mb-1">
                    {activeCareer.name}
                  </h3>
                  <p className="text-text-muted text-sm mb-4">
                    {activeCareer.description}
                  </p>

                  {/* Readiness indicator */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">
                          Career Readiness
                        </span>
                        <span className="font-mono text-primary">
                          {activeCareer.readinessScore}%
                        </span>
                      </div>
                      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${activeCareer.readinessScore}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-text-dim">
                      {activeCareer.skillsCovered}/{activeCareer.skillsRequired}{" "}
                      skills
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {activePath && (
                    <Link to="/learning-paths" className="btn-primary">
                      <FontAwesomeIcon icon={faPlay} className="mr-2" />
                      Continue Learning
                    </Link>
                  )}
                  <Link to="/career" className="btn-secondary">
                    <FontAwesomeIcon icon={faExchange} className="mr-2" />
                    Switch
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-bento border-dashed border-2 border-border">
              <EmptyState
                icon={faBriefcase}
                title="Choose Your Career Path"
                description="Select a career to focus on. This helps us personalize your learning experience and track your readiness."
                actionLabel="Explore Careers"
                actionPath="/career"
              />
            </div>
          )}
        </motion.section>

        {/* Continue Where You Left Off */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <SectionHeader
            icon={faRoute}
            title="Continue Learning"
            link="/learning-paths"
            linkText="All Paths"
          />

          {activePath ? (
            <div className="card-bento p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faRoute}
                      className="text-secondary text-lg"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-text-main">
                      {activePath.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="text-green-400 text-xs"
                        />
                        {activePath.progress}% complete
                      </span>
                      {activePath.lastCompletedNode && (
                        <span className="text-text-dim">
                          Last: {activePath.lastCompletedNode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link to="/learning-paths" className="btn-primary">
                  <FontAwesomeIcon icon={faPlay} className="mr-2" />
                  Resume
                </Link>
              </div>

              {/* AI recommended next step */}
              {activePath.nextNode && (
                <div className="mt-4 p-3 bg-bg-elevated/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                    <FontAwesomeIcon
                      icon={faLightbulb}
                      className="text-yellow-400"
                    />
                    AI Recommended Next
                  </div>
                  <p className="text-sm text-text-main">
                    {activePath.nextNode}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card-bento border-dashed border-2 border-border">
              <EmptyState
                icon={faRoute}
                title="No Active Learning Path"
                description="Start building your learning path by saving videos from the Analyzer or creating a custom path."
                actionLabel="Create Path"
                actionPath="/learning-paths"
                secondary
              />
            </div>
          )}
        </motion.section>

        {/* Two Column Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Learning Path Health */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <SectionHeader icon={faChartLine} title="Path Health" />

            {pathHealth ? (
              <div className="card-bento p-5">
                {/* Missing skills */}
                <div className="mb-4">
                  <h4 className="text-xs font-mono text-text-dim uppercase mb-2">
                    Skills to Add
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {pathHealth.missingSkills?.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 rounded border border-orange-500/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI suggestion summary */}
                {pathHealth.suggestion && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-xs text-primary mb-1">
                      <FontAwesomeIcon icon={faLightbulb} />
                      AI Suggestion
                    </div>
                    <p className="text-sm text-text-main">
                      {pathHealth.suggestion}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card-bento p-5 text-center">
                <p className="text-text-muted text-sm">
                  {activePath
                    ? "Path health analysis will appear here"
                    : "Start a learning path to see health insights"}
                </p>
              </div>
            )}
          </motion.section>

          {/* Recent Activity */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.25 }}
          >
            <SectionHeader icon={faClock} title="Recent Activity" />

            {recentActivity.length > 0 ? (
              <div className="card-bento p-4">
                <div className="space-y-3">
                  {recentActivity.slice(0, 4).map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          activity.type === "video_saved"
                            ? "bg-green-500/10 text-green-400"
                            : activity.type === "path_edited"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-bg-elevated text-text-dim"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={
                            activity.type === "video_saved"
                              ? faVideo
                              : activity.type === "path_edited"
                                ? faEdit
                                : faCheckCircle
                          }
                          className="text-xs"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-text-main truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-text-dim">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card-bento p-5 text-center">
                <p className="text-text-muted text-sm">
                  No recent activity yet. Start learning!
                </p>
              </div>
            )}
          </motion.section>
        </div>

        {/* Vault Highlights */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <SectionHeader
            icon={faBookmark}
            title="Vault Highlights"
            link="/vault"
            linkText="Open Vault"
          />

          {vaultHighlights.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {vaultHighlights.slice(0, 3).map((item, i) => (
                <Link
                  key={i}
                  to={`/vault/${item.id}`}
                  className="card-bento p-4 hover:border-primary/50 group"
                >
                  <div className="aspect-video rounded-lg bg-bg-elevated mb-3 overflow-hidden">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <h4 className="font-medium text-text-main text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-bento p-5 text-center">
              <p className="text-text-muted text-sm mb-3">
                Your saved resources will appear here.
              </p>
              <Link
                to="/vault"
                className="text-sm text-primary hover:underline"
              >
                Explore the Vault →
              </Link>
            </div>
          )}
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.35 }}
        >
          <h2 className="text-sm font-mono text-text-dim uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/analyzer"
              className="card-bento p-5 hover:border-primary/50 group block"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                <FontAwesomeIcon icon={faPlus} />
              </div>
              <h4 className="font-medium text-text-main group-hover:text-primary transition-colors mb-1">
                Analyze Video
              </h4>
              <p className="text-xs text-text-muted">
                Get AI insights on any YouTube tutorial
              </p>
            </Link>

            <Link
              to="/learning-paths"
              className="card-bento p-5 hover:border-secondary/50 group block"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-3">
                <FontAwesomeIcon icon={faRoute} />
              </div>
              <h4 className="font-medium text-text-main group-hover:text-secondary transition-colors mb-1">
                Manage Paths
              </h4>
              <p className="text-xs text-text-muted">
                Create or edit your learning paths
              </p>
            </Link>

            <Link
              to="/career"
              className="card-bento p-5 hover:border-accent/50 group block"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-3">
                <FontAwesomeIcon icon={faBriefcase} />
              </div>
              <h4 className="font-medium text-text-main group-hover:text-accent transition-colors mb-1">
                Explore Careers
              </h4>
              <p className="text-xs text-text-muted">
                Discover paths aligned with your goals
              </p>
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default DashboardPage;
