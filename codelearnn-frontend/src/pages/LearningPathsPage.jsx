import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRoute,
  faPlus,
  faArrowRight,
  faSearch,
  faLayerGroup,
  faVideo,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";

// Empty state component - extracted outside to prevent re-creation during render
const EmptyState = ({ icon, title, description, actionLabel, actionPath }) => (
  <div className="text-center py-16 px-8">
    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
      <FontAwesomeIcon icon={icon} className="text-2xl text-text-dim" />
    </div>
    <h3 className="text-lg font-medium text-text-main mb-2">{title}</h3>
    <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
      {description}
    </p>
    {actionLabel && (
      <Link
        to={actionPath}
        className="btn-primary inline-flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faPlus} />
        {actionLabel}
      </Link>
    )}
  </div>
);

EmptyState.propTypes = {
  icon: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  actionPath: PropTypes.string,
};

/**
 * LearningPathsPage - Central hub for learning progress
 *
 * Sections:
 * 1. Active / Draft Learning Path (hero)
 * 2. Official (System) Learning Paths
 * 3. My Custom Learning Paths
 * 4. Saved Videos Library
 */

const LearningPathsPage = () => {
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState(null);
  const [myPaths, setMyPaths] = useState([]);
  const [systemPaths, setSystemPaths] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // TODO: Fetch actual data from APIs
    // For now, simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
      // Suppress unused setter warnings - these will be used when API is implemented
      setActivePath(null);
      setMyPaths([]);
      setSystemPaths([]);
      setSavedVideos([]);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen pt-24 pb-16 px-6">
        <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-3xl text-primary animate-spin"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-main mb-2">
                Learning Paths
              </h1>
              <p className="text-text-muted">
                Your personalized roadmaps to career success
              </p>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
                />
                <input
                  type="text"
                  placeholder="Search paths, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary w-64"
                />
              </div>
              <button className="btn-primary">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create Path
              </button>
            </div>
          </div>
        </motion.div>

        {/* Active/Draft Learning Path - Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-sm font-mono text-primary uppercase tracking-wider mb-4">
            Active Learning Path
          </h2>

          {activePath ? (
            <div className="card-bento p-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              {/* TODO: Active path card */}
              <p className="text-text-muted">
                Active path will be displayed here
              </p>
            </div>
          ) : (
            <div className="card-bento border-dashed border-2 border-border">
              <EmptyState
                icon={faRoute}
                title="No Active Learning Path"
                description="Start by saving a video from the Analyzer, or create a custom learning path to begin your structured learning journey."
                actionLabel="Create Your First Path"
                actionPath="/analyzer"
              />
            </div>
          )}
        </motion.section>

        {/* Two Column Layout for Paths */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* My Custom Learning Paths */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider">
                My Learning Paths
              </h2>
              <span className="text-xs text-text-dim">
                {myPaths.length} paths
              </span>
            </div>

            {myPaths.length > 0 ? (
              <div className="space-y-4">
                {myPaths.map((path, index) => (
                  <div key={index} className="card-bento p-4">
                    {/* TODO: Path card component */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-bento">
                <EmptyState
                  icon={faLayerGroup}
                  title="No Custom Paths Yet"
                  description="Create personalized learning paths from saved videos or start from scratch."
                />
              </div>
            )}
          </motion.section>

          {/* Saved Videos Library */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider">
                Saved Videos
              </h2>
              <Link
                to="/analyzer"
                className="text-xs text-primary hover:underline"
              >
                + Add from Analyzer
              </Link>
            </div>

            {savedVideos.length > 0 ? (
              <div className="space-y-3">
                {savedVideos.map((video, index) => (
                  <div
                    key={index}
                    className="card-bento p-3 flex items-center gap-4"
                  >
                    {/* TODO: Saved video card */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-bento">
                <EmptyState
                  icon={faVideo}
                  title="No Saved Videos"
                  description="Analyze YouTube videos and save them to build your learning paths."
                  actionLabel="Go to Analyzer"
                  actionPath="/analyzer"
                />
              </div>
            )}
          </motion.section>
        </div>

        {/* Official System Learning Paths */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider">
              Official Learning Paths
            </h2>
            <Link
              to="/vault"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Browse Vault
              <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </Link>
          </div>

          {systemPaths.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemPaths.map((path, index) => (
                <div key={index} className="card-bento p-6">
                  {/* TODO: System path card */}
                </div>
              ))}
            </div>
          ) : (
            <div className="card-bento p-8 text-center">
              <p className="text-text-muted">
                Official learning paths coming soon. Explore the{" "}
                <Link to="/vault" className="text-primary hover:underline">
                  Vault
                </Link>{" "}
                for curated courses.
              </p>
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
};

export default LearningPathsPage;
