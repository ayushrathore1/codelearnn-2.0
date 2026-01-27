import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faClock,
  faGraduationCap,
  faSignal,
  faCheckCircle,
  faPlayCircle,
  faLock,
  faStar,
  faUsers,
  faShareAlt,
  faRocket,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import LockedContent from '../components/common/LockedContent';
import { useAuth } from '../context/AuthContext';
import { learningPathsAPI } from '../services/api';

const VaultDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('syllabus');
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch course data from API
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await learningPathsAPI.getById(id);
        setCourse(response.data.data);
      } catch (err) {
        console.error('Failed to fetch learning path:', err);
        setError('Failed to load this learning path. It may not exist or has been removed.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourse();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-6 bg-bg-base flex flex-col items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-primary animate-spin mb-4" />
        <div className="text-primary font-mono text-lg">Loading path details...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-6 bg-bg-base flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-text-main mb-4">Path Not Found</h2>
          <p className="text-text-muted mb-6">{error || 'This learning path could not be found.'}</p>
          <Link to="/vault" className="btn-primary">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Vault
          </Link>
        </div>
      </div>
    );
  }

  const isUserPro = false; // TODO: Check user subscription status

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="container mx-auto max-w-7xl">
        {/* Breadcrumb / Back */}
        <Link to="/vault" className="inline-flex items-center text-text-muted hover:text-primary transition-colors mb-8 group">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Vault
        </Link>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex gap-2 mb-4 flex-wrap">
                {(course.tags || []).map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-bg-elevated border border-border text-xs rounded text-text-dim font-mono">
                    {tag}
                  </span>
                ))}
                {course.isPro && (
                  <span className="px-2 py-1 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-xs rounded text-primary font-bold font-mono">
                    PRO ACCESS
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-main mb-6 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-lg text-text-muted mb-8 leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-text-muted font-mono">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSignal} className="text-secondary" />
                  {course.level}
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="text-primary" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                  {course.rating || 0} ({course.ratingCount || 0} reviews)
                </div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-text-dim" />
                  {course.enrolledCount || 0}+ Enrolled
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 hidden lg:block">
            <div className="h-full rounded-2xl bg-bg-surface border border-border relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <FontAwesomeIcon icon={faCheckCircle} className="text-6xl text-bg-elevated" />
               </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Main Content (Left/Center) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-border mb-6">
               <button 
                 onClick={() => setActiveTab('syllabus')}
                 className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'syllabus' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
               >
                 Syllabus
               </button>
               <button 
                 onClick={() => setActiveTab('about')}
                 className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'about' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
               >
                 About Path
               </button>
            </div>

            {/* Syllabus */}
            {activeTab === 'syllabus' && (
              <div className="space-y-4">
                {(course.modules || []).length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    <p>No modules available for this path yet.</p>
                  </div>
                ) : (
                  course.modules.map((module, idx) => (
                    <div key={idx} className="group">
                      <LockedContent isLocked={module.isLocked && !isUserPro} title="Pro Module Locked">
                        <div className="p-4 rounded-xl bg-bg-surface border border-border group-hover:border-primary/50 transition-colors flex items-center justify-between">
                           <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center ${module.isLocked && !isUserPro ? 'bg-bg-elevated text-text-dim' : 'bg-primary/10 text-primary'}`}>
                               <FontAwesomeIcon icon={module.isLocked && !isUserPro ? faLock : faPlayCircle} />
                             </div>
                             <div>
                               <h4 className="text-text-main font-medium">{module.title}</h4>
                               <p className="text-xs text-text-muted font-mono">{module.duration}</p>
                             </div>
                           </div>
                           <button className="text-sm text-secondary hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                             Start Module &rarr;
                           </button>
                        </div>
                      </LockedContent>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* About */}
            {activeTab === 'about' && (
              <div className="space-y-6 animate-fadeIn">
                 <div className="prose prose-invert max-w-none">
                   <p className="text-text-muted leading-relaxed">{course.longDescription || course.description}</p>
                 </div>
                 
                 {(course.outcomes || []).length > 0 && (
                   <div className="bg-bg-surface rounded-xl p-6 border border-border">
                     <h3 className="text-lg font-bold text-text-main mb-4">What you will achieve</h3>
                     <div className="grid md:grid-cols-2 gap-4">
                       {course.outcomes.map((item, idx) => (
                         <div key={idx} className="flex items-start gap-3">
                           <FontAwesomeIcon icon={faCheckCircle} className="text-primary mt-1 flex-shrink-0" />
                           <span className="text-sm text-text-muted">{item}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Sidebar CTA (Right) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-28 space-y-6">
              <div className="p-6 rounded-2xl bg-bg-elevated border border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Start Learning</h3>
                <div className="text-lg text-text-dim mb-6 line-through decoration-red-500 decoration-2 opacity-50">$49.99</div>
                
                <div className="flex items-end gap-2 mb-6">
                   <span className="text-4xl font-bold text-primary">Free</span>
                   <span className="text-sm text-text-muted mb-1">with Pro account</span>
                </div>

                <button className="w-full py-4 bg-primary hover:bg-primary/90 text-bg-base font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-1 mb-4 flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faRocket} />
                  Subscribe Now
                </button>
                
                <p className="text-center text-xs text-text-dim mb-4">
                  7-day money-back guarantee
                </p>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between text-sm text-text-muted mb-2">
                    <span>Access</span>
                    <span className="text-text-main">Lifetime</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-muted mb-2">
                    <span>Certificate</span>
                    <span className="text-text-main">Included</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-muted">
                    <span>Support</span>
                    <span className="text-text-main">Instructor Access</span>
                  </div>
                </div>
              </div>

              {course.instructor && (
                <div className="p-6 rounded-2xl bg-bg-surface border border-border">
                  <h4 className="font-bold text-text-main mb-4">Instructor</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                    <div>
                      <div className="text-sm font-bold text-white">{course.instructor.name}</div>
                      <div className="text-xs text-text-muted">{course.instructor.title}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default VaultDetailPage;
