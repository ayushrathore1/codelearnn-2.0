import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faArrowRight,
  faFire,
  faBookOpen,
  faBrain,
  faRocket,
  faTrophy,
  faChartLine,
  faSpinner,
  faBookmark,
  faStar,
  faRoute,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';
import { learningPathsAPI, progressAPI, freeResourcesAPI } from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [paths, setPaths] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);

  // Fetch learning paths
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await learningPathsAPI.getAll({ limit: 3 });
        setPaths(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch paths:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch saved videos from user progress
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const response = await progressAPI.getSaved({ limit: 6 });
        setSavedVideos(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch saved videos:', err);
      } finally {
        setSavedLoading(false);
      }
    };
    fetchSaved();
  }, []);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await freeResourcesAPI.getCourses({ limit: 3 });
        setCourses(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    };
    fetchCourses();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-12 flex items-end justify-between"
        >
          <div>
            <h1 className="text-h2 text-text-main mb-2">
              Welcome back, <span className="text-gradient-primary">{user?.name || 'Developer'}</span>
            </h1>
            <p className="text-text-muted">Ready to continue your engineering journey?</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-mono text-text-muted bg-bg-surface px-4 py-2 rounded-lg border border-border/50">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faFire} className="text-primary" />
              0 Day Streak
            </span>
            <span className="w-px h-4 bg-border/50"></span>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTrophy} className="text-secondary" />
              0 XP
            </span>
          </div>
        </motion.div>

        {/* My Library Section - Saved Videos */}
        {!savedLoading && savedVideos.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-heading font-semibold text-text-main flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <FontAwesomeIcon icon={faBookmark} className="text-primary text-xs" />
                </span>
                My Library
              </h3>
              <span className="text-sm text-text-dim font-mono">{savedVideos.length} saved</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVideos.slice(0, 6).map((item) => {
                const resource = item.resource || item;
                return (
                  <div
                    key={resource._id}
                    className="card-bento p-4 hover:border-primary/50 group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-bg-elevated mb-3">
                      {resource.thumbnail ? (
                        <img 
                          src={resource.thumbnail} 
                          alt={resource.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faYoutube} className="text-3xl text-text-dim" />
                        </div>
                      )}
                      
                      {/* Play Button Overlay */}
                      <a 
                        href={`https://www.youtube.com/watch?v=${resource.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-bg-base/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                          <FontAwesomeIcon icon={faPlay} className="text-white ml-1" />
                        </div>
                      </a>

                      {/* CodeLearnn Score Badge */}
                      {resource.codeLearnnScore > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-bg-base/80 backdrop-blur-sm rounded-lg border border-border flex items-center gap-1">
                          <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-xs" />
                          <span className={`text-sm font-bold ${getScoreColor(resource.codeLearnnScore)}`}>
                            {resource.codeLearnnScore}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <h4 className="font-medium text-text-main text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h4>
                    
                    <div className="flex items-center justify-between text-xs text-text-dim">
                      <span>{resource.channelName}</span>
                      <span className="font-mono">{resource.duration}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create Learning Plan CTA */}
            {savedVideos.length >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FontAwesomeIcon icon={faRoute} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-main">Create a Learning Plan</h4>
                      <p className="text-sm text-text-muted">Turn your saved videos into a structured learning path</p>
                    </div>
                  </div>
                  <Link 
                    to="/vault"
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Create Plan
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Featured Courses */}
        {courses.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-heading font-semibold text-text-main flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20">
                  <FontAwesomeIcon icon={faPlay} className="text-secondary text-xs" />
                </span>
                Featured Courses
              </h3>
              <Link to="/vault" className="text-sm text-text-muted hover:text-primary flex items-center gap-2 group">
                View all <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Link
                  key={course._id}
                  to={`/vault/course/${course.slug}`}
                  className="card-bento p-0 overflow-hidden hover:border-primary/50 group"
                >
                  <div className="relative aspect-video bg-bg-elevated">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faPlay} className="text-3xl text-text-dim" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-base to-transparent" />
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-primary/20 backdrop-blur-sm rounded-lg border border-primary/30">
                      <span className="text-xs font-medium text-primary">{course.provider}</span>
                    </div>
                    {course.averageScore > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-bg-base/80 backdrop-blur-sm rounded-lg border border-border">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-xs" />
                        <span className="text-xs font-bold text-text-main">{course.averageScore}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-text-main group-hover:text-primary transition-colors line-clamp-1 mb-1">
                      {course.name}
                    </h4>
                    <p className="text-xs text-text-dim">
                      {course.lectureCount || 0} lectures • {course.level}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Active Path - Welcome Card */}
        {savedVideos.length === 0 && !savedLoading && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="card-bento p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-2xl mx-auto mb-6">
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                
                <h2 className="text-h3 text-text-main mb-3">Start Your Learning Journey</h2>
                <p className="text-text-muted max-w-md mx-auto mb-6">
                  Analyze YouTube tutorials and save them to your library to build your personalized learning plan.
                </p>
                
                <div className="flex gap-4 justify-center">
                  <Link to="/analyzer" className="btn-primary inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faChartLine} />
                    Analyze Videos
                  </Link>
                  <Link to="/vault" className="btn-secondary inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faBookOpen} />
                    Explore Vault
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Suggested Paths */}
        {!loading && paths.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-heading font-semibold text-text-main flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center border border-border">
                  <FontAwesomeIcon icon={faBookOpen} className="text-primary text-xs" />
                </span>
                Suggested Paths
              </h3>
              <Link to="/vault" className="text-sm text-text-muted hover:text-primary flex items-center gap-2 group">
                View all <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paths.map((path, index) => (
                <Link
                  key={path._id || index}
                  to={`/vault/${path.slug || path._id}`}
                  className="card-bento p-5 hover:border-primary/50 group block h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-text-main group-hover:text-primary transition-colors line-clamp-1">
                      {path.title}
                    </h4>
                    <span className="text-xs font-mono text-text-dim">{path.level}</span>
                  </div>
                  
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">
                    {path.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(path.tags || []).slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider text-text-dim bg-bg-base/50 px-2 py-1 rounded border border-border/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faSpinner} className="text-2xl text-primary animate-spin" />
          </div>
        )}

        {/* Quick Links */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <Link
            to="/visualizations"
            className="card-bento p-6 hover:border-secondary/50 group block"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4">
              <FontAwesomeIcon icon={faBrain} />
            </div>
            <h4 className="font-medium text-text-main group-hover:text-secondary transition-colors mb-2">
              Visual Learning
            </h4>
            <p className="text-sm text-text-muted">
              Complex concepts explained through interactive animations.
            </p>
          </Link>

          <Link
            to="/analyzer"
            className="card-bento p-6 hover:border-primary/50 group block"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <h4 className="font-medium text-text-main group-hover:text-primary transition-colors mb-2">
              YouTube Analyzer
            </h4>
            <p className="text-sm text-text-muted">
              Evaluate any tutorial and get its CodeLearnn Score.
            </p>
          </Link>

          <Link
            to="/career"
            className="card-bento p-6 hover:border-accent/50 group block"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
              <FontAwesomeIcon icon={faRocket} />
            </div>
            <h4 className="font-medium text-text-main group-hover:text-accent transition-colors mb-2">
              Career Explorer
            </h4>
            <p className="text-sm text-text-muted">
              Discover career paths based on your skills.
            </p>
          </Link>
        </motion.div>
      </div>
    </main>
  );
};

export default DashboardPage;

