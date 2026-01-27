import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, 
  faBookOpen, 
  faChartLine, 
  faBrain,
  faRocket,
  faPlay,
  faCode,
  faGraduationCap,
  faLayerGroup,
  faCheck,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube, faLinkedin, faReact, faNodeJs, faPython } from '@fortawesome/free-brands-svg-icons';
import FeatureCard from '../components/cards/FeatureCard';
import { waitlistAPI } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle'); // idle, loading, success, error
  const [waitlistMessage, setWaitlistMessage] = useState('');

  // Handle redirect from OAuth rejection - scroll to waitlist
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('waitlist_redirect') === 'true' || location.hash === '#waitlist') {
      setTimeout(() => {
        document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      // Clean up URL
      if (params.get('waitlist_redirect')) {
        navigate('/', { replace: true });
      }
    }
  }, [location, navigate]);

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!email || waitlistStatus === 'loading') return;

    setWaitlistStatus('loading');
    try {
      const response = await waitlistAPI.join(email, 'homepage');
      setWaitlistStatus('success');
      setWaitlistMessage(response.data.message);
      setEmail('');
    } catch (error) {
      setWaitlistStatus('error');
      setWaitlistMessage(error.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const features = [
    {
      icon: faBookOpen,
      title: 'Learning Vault',
      description: 'Structured learning paths that transform scattered tutorials into a clear roadmap.',
      to: '/vault',
      color: 'primary'
    },
    {
      icon: faBrain,
      title: 'Visualizations',
      description: 'Complex concepts explained through interactive animations and visual stories.',
      to: '/visualizations',
      color: 'secondary'
    },
    {
      icon: faYoutube,
      title: 'YouTube Analyzer',
      description: 'Evaluate any tutorial before you watch. Know exactly what you\'ll learn.',
      to: '/analyzer',
      color: 'warning'
    },
    {
      icon: faChartLine,
      title: 'Career Guidance',
      description: 'Discover career paths, roles, and jobs based on your skills.',
      to: '/career',
      color: 'success'
    }
  ];

  const stats = [
    { value: '120+', label: 'Learning Paths' },
    { value: '10k+', label: 'Curated Resources' },
    { value: '50+', label: 'Visual Lessons' },
  ];

  return (
    <main className="min-h-screen selection:bg-primary selection:text-black">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="min-h-screen flex items-center pt-28 pb-20 px-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] pointer-events-none" />

        {/* Static Tilted Logos Background - Centered on Glow Spots */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          {/* LinkedIn - Center/Right (Heading to Lime Glow) */}
          <motion.div
            initial={{ opacity: 0, rotate: -12 }}
            animate={{ opacity: 0.4, rotate: -12 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute bottom-[35%] right-[55%] lg:auto lg:top-[40%] lg:left-[45%] p-5 bg-bg-elevated/10 backdrop-blur-[2px] rounded-2xl border border-white/5 shadow-xl"
          >
            <div className="absolute inset-0 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine-slow" />
            </div>
            <div className="flex gap-1 items-center font-heading font-bold text-white/80 tracking-wider">
                <FontAwesomeIcon icon={faLinkedin} className="text-3xl text-blue-500/80 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
                <span className="text-xs opacity-60">LinkedIn</span>
            </div>
          </motion.div>

          {/* YouTube - Top Right (Above Card) */}
          <motion.div
            initial={{ opacity: 0, rotate: 12 }}
            animate={{ opacity: 0.4, rotate: 12 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            className="absolute top-[8%] right-[2%] lg:top-[10%] lg:right-[5%] p-4 bg-bg-elevated/10 backdrop-blur-[2px] rounded-2xl border border-white/5 shadow-xl"
          >
            <div className="absolute inset-0 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine-slow" style={{ animationDelay: '2s' }} />
            </div>
            <FontAwesomeIcon icon={faYoutube} className="text-4xl text-red-500/80 drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
          </motion.div>

          {/* edX - Bottom Left (Below Text) */}
          <motion.div
            initial={{ opacity: 0, rotate: -6 }}
            animate={{ opacity: 0.4, rotate: -6 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
            className="absolute bottom-[5%] left-[2%] lg:bottom-[15%] lg:left-[5%] p-4 bg-bg-elevated/10 backdrop-blur-[2px] rounded-2xl border border-white/5 shadow-xl hidden lg:block"
          >
              <div className="absolute inset-0 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine-slow" style={{ animationDelay: '4s' }} />
            </div>
            <div className="font-heading font-bold italic text-2xl text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              ed<span className="text-primary/80">X</span>
            </div>
          </motion.div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Tag */}
              <motion.div variants={fadeInUp} className="mb-8 relative z-10">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-metallic">CodeLearnn OS 2.0</span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1 
                variants={fadeInUp}
                className="text-hero mb-6 tracking-tight"
              >
                The Smartest Way<br />
                <span className="text-gradient-primary">To Learn Reality.</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p 
                variants={fadeInUp}
                className="text-body-lg text-text-muted max-w-xl mb-10 font-light"
              >
                Structure the entire internet into clear learning paths. 
                Evaluate tutorials with AI. visualize complex concepts.
              </motion.p>

              {/* CTAs */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap gap-4"
              >
                <button 
                  onClick={() => navigate('/vault')}
                  className="btn-primary"
                >
                  <FontAwesomeIcon icon={faBookOpen} className="text-sm mr-2" />
                  Explore Vault
                </button>
                <button 
                  onClick={() => navigate('/analyzer')}
                  className="btn-secondary group"
                >
                  <FontAwesomeIcon icon={faYoutube} className="text-sm mr-2 group-hover:text-red-500 transition-colors" />
                  Analyze Video
                </button>
              </motion.div>

              {/* Stats - Mobile only */}
              <motion.div 
                variants={fadeInUp}
                className="flex gap-8 mt-12 lg:hidden"
              >
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-2xl font-heading font-bold text-text-main">{stat.value}</div>
                    <div className="text-sm text-text-dim">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - Animated Dashboard Mockup (Bento Style) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative card-bento p-1 bg-bg-surface/50 backdrop-blur-sm border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50 pointer-events-none" />
                
                <div className="bg-bg-elevated/50 rounded-xl p-6 relative overflow-hidden">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-border" />
                        <div className="w-2.5 h-2.5 rounded-full bg-border" />
                      </div>
                      <span className="text-xs text-text-dim font-mono">user_dashboard.tsx</span>
                    </div>
                    <div className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">v2.4.0</div>
                  </div>

                  {/* Bento Grid Mockup */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Path Card */}
                    <div className="card-bento p-5 bg-bg-surface border-border/40 hover:border-primary/50 transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FontAwesomeIcon icon={faCode} />
                        </div>
                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Current</div>
                      </div>
                      <div className="text-sm font-medium text-text-main mb-1">Full Stack Dev</div>
                      <div className="h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3 group-hover:animate-pulse" />
                      </div>
                    </div>

                    {/* Stats Card */}
                    <div className="card-bento p-5 bg-bg-surface border-border/40 hover:border-secondary/50 transition-colors">
                      <div className="text-xs text-text-dim font-mono mb-2">XP GAINED</div>
                      <div className="text-3xl font-heading font-bold text-text-main mb-1">
                        2,450
                      </div>
                      <div className="text-xs text-secondary flex items-center gap-1">
                        <FontAwesomeIcon icon={faChartLine} />
                        <span>+12% this week</span>
                      </div>
                    </div>

                    {/* Visual Card - Wide */}
                    <div className="col-span-2 card-bento p-4 flex items-center gap-4 bg-bg-surface border-border/40 hover:border-primary/50 transition-colors">
                      <div className="w-16 h-12 rounded bg-gradient-to-br from-secondary/20 to-primary/5 border border-white/5 flex items-center justify-center">
                        <FontAwesomeIcon icon={faPlay} className="text-text-main/70 text-sm" />
                      </div>
                      <div>
                        <div className="text-xs text-secondary font-mono mb-0.5">RESUME LESSON</div>
                        <div className="text-sm font-medium text-text-main">System Design Patterns</div>
                      </div>
                      <div className="ml-auto">
                        <FontAwesomeIcon icon={faArrowRight} className="text-text-dim text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Float Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-primary to-secondary opacity-20 blur-2xl rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES SECTION (Bento Grid)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="section px-6 relative">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-h2 mb-4">
              Everything You Need<br />
              <span className="text-gradient-primary">To Master The Craft</span>
            </h2>
            <p className="text-body text-text-muted max-w-2xl mx-auto">
              A complete system designed for high-performance learning. 
              No fluff, just raw engineering growth.
            </p>
          </div>

          {/* Features Grid */}
          <div className="spotlight-group grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-bento p-6 h-full hover:-translate-y-1 transition-transform duration-300"
              >
                <div className={`w-12 h-12 rounded-xl mb-6 flex items-center justify-center bg-${feature.color}/10 border border-${feature.color}/20 text-${feature.color}`}>
                  <FontAwesomeIcon icon={feature.icon} className="text-xl" />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-3">{feature.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-6">
                  <span className="text-xs font-mono text-text-dim group-hover:text-primary transition-colors flex items-center gap-2 cursor-pointer" onClick={() => navigate(feature.to)}>
                    EXPLORE <FontAwesomeIcon icon={faArrowRight} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="section px-6 border-t border-border/50 bg-bg-surface/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h2">
              Systemic <span className="text-primary">Growth</span>
            </h2>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-20 right-20 h-px bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20" />

            <div className="grid md:grid-cols-3 gap-12 relative">
              {[
                { step: '01', title: 'Input', desc: 'Select a structured path or valid resource', icon: faLayerGroup },
                { step: '02', title: 'Process', desc: 'Deep dive with visualizations & AI analysis', icon: faBrain },
                { step: '03', title: 'Output', desc: 'Build projects & confirm mastery', icon: faRocket },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="text-center relative group"
                >
                  {/* Step Circle */}
                  <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-bg-base border border-border group-hover:border-primary/50 transition-colors flex items-center justify-center relative z-10 shadow-surface">
                    <FontAwesomeIcon icon={item.icon} className="text-3xl text-text-muted group-hover:text-primary transition-colors" />
                  </div>

                  <div className="font-mono text-xs text-primary mb-3 uppercase tracking-wider">Step {item.step}</div>
                  <h3 className="text-h3 text-text-main mb-3">{item.title}</h3>
                  <p className="text-text-muted text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          DETAILS / STATS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 border-y border-border/50 bg-bg-elevated/20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
            {stats.map((stat, index) => (
              <div key={index} className="py-8 md:py-0 text-center">
                <div className="text-5xl md:text-6xl font-heading font-bold text-text-main mb-2 tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-sm font-mono text-text-muted uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA - WAITLIST
          ═══════════════════════════════════════════════════════════════════ */}
      <section id="waitlist" className="section px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-primary/5 radial-gradient" />
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-bento max-w-4xl mx-auto p-12 md:p-20 bg-bg-surface/50 backdrop-blur-md border-primary/20"
          >
            <h2 className="text-h1 mb-6">
              Ready to <span className="text-primary">Upgrade Your Mind?</span>
            </h2>
            <p className="text-body-lg text-text-muted max-w-2xl mx-auto mb-10">
              Join the waitlist. Be the first to experience the future of developer education.
            </p>
            
            {waitlistStatus === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="text-2xl text-primary" />
                </div>
                <p className="text-lg text-text-main font-medium">{waitlistMessage}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-lg bg-bg-elevated border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="submit"
                  disabled={waitlistStatus === 'loading'}
                  className="btn-primary px-6 py-3 shadow-[0_0_40px_-5px_var(--primary-glow)] hover:shadow-[0_0_60px_-10px_var(--primary-glow)] disabled:opacity-50"
                >
                  {waitlistStatus === 'loading' ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    'Join Waitlist'
                  )}
                </button>
              </form>
            )}
            
            {waitlistStatus === 'error' && (
              <p className="text-red-500 text-sm mt-4">{waitlistMessage}</p>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
