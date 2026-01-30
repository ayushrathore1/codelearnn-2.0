import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faSpinner,
  faChevronDown,
  faArrowLeft,
  faBriefcase,
  faMapMarkerAlt,
  faExternalLinkAlt,
  faDollarSign,
  faFire,
  faLightbulb,
  faChartLine,
  faCode,
  faTerminal,
  faCodeBranch,
  faLaptopCode,
  faServer,
  faMicrochip,
  faRocket,
  faBug,
  faLayerGroup,
  faNetworkWired
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';

// API
import { careerAPI } from '../services/api';

// Components
import StartJourneyModal from '../components/StartJourneyModal';

// Context
import { useCareerJourney } from '../context/CareerJourneyContext';

/**
 * CareerExplorerPage - Premium Developer Theme
 * "Command Center" for career initialization
 */
const CareerExplorerPage = () => {
  const navigate = useNavigate();
  const { journey, hasActiveJourney } = useCareerJourney();
  
  // Data states
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('India');
  const [analysisData, setAnalysisData] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [domainDetails, setDomainDetails] = useState(null);
  const [expandedJobRole, setExpandedJobRole] = useState(null);
  const [jobRoleDetails, setJobRoleDetails] = useState(null);
  
  // Trending domains for dashboard view
  const [trendingDomains, setTrendingDomains] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingDomain, setLoadingDomain] = useState(false);
  const [loadingJobRole, setLoadingJobRole] = useState(false);
  
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Journey modal state
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(null);

  // Load dashboard data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingTrending(true);
      try {
        const [trendingRes, popularRes] = await Promise.all([
          careerAPI.getTrending().catch(() => ({ data: { data: null } })),
          careerAPI.getPopular(12).catch(() => ({ data: { data: [] } }))
        ]);
        
        setTrendingDomains({
          ...trendingRes.data.data,
          popularSearches: popularRes.data.data || []
        });
      } catch (err) {
        console.error('Failed to load system data:', err);
      } finally {
        setLoadingTrending(false);
      }
    };
    loadData();
  }, []);

  // Location options
  const locationOptions = [
    { value: 'India', label: '🇮🇳 IN' },
    { value: 'United States', label: '🇺🇸 US' },
    { value: 'Remote', label: '🌐 Remote' },
    { value: '', label: '🌍 Global' }
  ];

  // Handle keyword search
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!keyword.trim() || keyword.trim().length < 2) {
      setError('Input error: Minimum 2 characters required');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisData(null);
    setExpandedCategory(null);
    setExpandedDomain(null);
    setDomainDetails(null);
    setExpandedJobRole(null);
    setJobRoleDetails(null);

    try {
      const response = await careerAPI.exploreKeyword(keyword.trim(), location);
      setAnalysisData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'System Error: Failed to analyze keyword.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, location]);

  // Toggles
  const toggleCategory = (category) => {
    const isSame = expandedCategory?.id === category.id;
    setExpandedCategory(isSame ? null : category);
    setExpandedDomain(null);
    setDomainDetails(null);
    setExpandedJobRole(null);
    setJobRoleDetails(null);
  };

  const toggleDomain = async (domain) => {
    if (expandedDomain?.id === domain.id) {
      setExpandedDomain(null);
      setDomainDetails(null);
      setExpandedJobRole(null);
      setJobRoleDetails(null);
    } else {
      setExpandedDomain(domain);
      setExpandedJobRole(null);
      setJobRoleDetails(null);
      setLoadingDomain(true);
      
      try {
        const response = await careerAPI.getDomainDetails(domain.name, keyword);
        setDomainDetails(response.data.data);
      } catch (err) {
        console.error('Domain fetch error:', err);
      } finally {
        setLoadingDomain(false);
      }
    }
  };

  const toggleJobRole = async (jobRole) => {
    if (expandedJobRole?.title === jobRole.title) {
      setExpandedJobRole(null);
      setJobRoleDetails(null);
    } else {
      setExpandedJobRole(jobRole);
      setLoadingJobRole(true);
      
      try {
        const response = await careerAPI.getJobRoleDetails(
          jobRole.title, 
          expandedDomain?.name || expandedCategory?.name
        );
        setJobRoleDetails(response.data.data);
      } catch (err) {
        console.error('Role details fetch error:', err);
      } finally {
        setLoadingJobRole(false);
      }
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    setExpandedCategory(null);
    setExpandedDomain(null);
    setDomainDetails(null);
    setExpandedJobRole(null);
    setJobRoleDetails(null);
    setKeyword('');
  };

  // Git Graph Connector
  const CircuitConnector = ({ height = '30px', className = '' }) => (
    <div className={`relative flex justify-center items-center ${className}`} style={{ height }}>
      <div className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-secondary/50"></div>
      <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10"></div>
    </div>
  );

  return (
    <main className="min-h-screen pt-28 pb-16 bg-bg-base relative overflow-hidden text-text-main">
      
      <div className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-40 z-0"></div>

      {/* Command Center Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 mb-6 font-mono text-xs text-primary">
            <FontAwesomeIcon icon={faTerminal} className="text-[10px]" />
            <span>SYSTEM_READY</span>
          </div>
          
          <h1 className="text-h1 md:text-6xl font-heading font-bold text-text-main mb-6 leading-tight">
            Initialize <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">Career Protocol</span>
          </h1>
          
          <p className="text-text-muted text-lg max-w-2xl mx-auto mb-10 font-light">
            Input target skill. System will compile optimal career paths, salary metrics, and required dependencies.
          </p>

          {/* Command Palette Input */}
          <motion.form 
            onSubmit={handleSearch}
            className={`relative max-w-2xl mx-auto transition-all duration-300 ${isFocused ? 'scale-105' : ''}`}
          >
            <div className={`
              flex items-center p-1 rounded-xl bg-bg-surface border transition-all duration-300
              ${isFocused ? 'border-primary shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-primary' : 'border-border shadow-xl'}
            `}>
              <div className="pl-4 pr-3 text-text-dim">
                <FontAwesomeIcon icon={faSearch} />
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="> Enter stack or skill (e.g., Python, DevOps, AWS)..."
                className="flex-1 bg-transparent border-none text-text-main font-mono placeholder:text-text-dim focus:ring-0 py-4 text-lg"
              />
              
              <div className="border-l border-border pl-3 pr-2">
                 <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-transparent border-none text-text-muted font-mono text-sm focus:ring-0 cursor-pointer hover:text-text-main transition-colors"
                >
                  {locationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ml-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-bg-base font-mono text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
              >
                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'RUN'}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs font-mono mt-2 text-left animate-pulse">! Error: {error}</p>}
          </motion.form>
        </motion.div>
      </section>

      {/* Main Content Area */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 mt-8 pb-20">
        <AnimatePresence mode="wait">
          
          {/* Loading State */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="font-mono text-primary mb-4 animate-pulse">
                {`> Analyzing "${keyword}"...`}
              </div>
              <div className="w-64 h-2 bg-bg-elevated rounded-full mx-auto overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="mt-4 text-xs text-text-muted font-mono">
                [Fetching market data]... [Parsing job roles]... [Compiling roadmap]
              </div>
            </motion.div>
          )}

          {/* Analysis Results (Mind Map) */}
          {!loading && analysisData && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <motion.button
                onClick={handleReset}
                className="self-start mb-8 flex items-center gap-2 text-text-muted hover:text-text-main transition-colors font-mono text-xs"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>BACK_TO_DASHBOARD</span>
              </motion.button>

              {/* Root Node */}
              <motion.div 
                className="relative z-10 mb-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="px-8 py-5 bg-bg-surface border-2 border-primary/50 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.1)] flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    <FontAwesomeIcon icon={faLayerGroup} className="text-2xl" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-mono text-primary mb-1">TARGET_PROTOCOL</div>
                    <div className="text-2xl font-bold text-text-main tracking-tight">{keyword}</div>
                  </div>
                  <div className="ml-6 pl-6 border-l border-border text-right">
                    <div className="text-xs font-mono text-text-muted">DOMAINS</div>
                    <div className="text-xl font-mono text-text-main">{analysisData.analysis?.totalDomainsFound || 0}</div>
                  </div>
                </div>
              </motion.div>

              <CircuitConnector height="40px" />

              <div className="text-center max-w-2xl px-6 py-3 bg-bg-surface/50 rounded-lg border border-border backdrop-blur-sm mb-8">
                 <p className="text-sm text-text-muted font-mono leading-relaxed">
                   {`// ${analysisData.analysis?.summary}`}
                 </p>
              </div>

              {/* Categories Grid */}
              <div className="w-full">
                <div className="text-center mb-6">
                  <span className="px-3 py-1 bg-bg-elevated rounded border border-border text-xs font-mono text-text-muted">
                    AVAILABLE_PATHS
                  </span>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                  {analysisData.analysis?.categories?.map((category, idx) => (
                    <motion.div
                      key={category.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center max-w-[300px]"
                    >
                      <button
                        onClick={() => toggleCategory(category)}
                        className={`
                          w-full p-4 rounded-lg border transition-all duration-300 text-left group relative overflow-hidden
                          ${expandedCategory?.id === category.id 
                            ? 'bg-bg-elevated border-primary shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                            : 'bg-bg-surface border-border hover:border-primary/50 hover:bg-bg-elevated'}
                        `}
                      >
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                           <FontAwesomeIcon icon={faCodeBranch} className="text-4xl text-primary" />
                         </div>
                         
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-2xl text-text-main">{category.icon}</span>
                           <FontAwesomeIcon 
                             icon={faChevronDown} 
                             className={`text-xs text-text-dim transition-transform ${expandedCategory?.id === category.id ? 'rotate-180 text-primary' : ''}`} 
                           />
                         </div>
                         <h3 className={`font-bold mb-1 ${expandedCategory?.id === category.id ? 'text-primary' : 'text-text-main'}`}>
                           {category.name}
                         </h3>
                         <div className="text-xs font-mono text-text-muted flex items-center gap-2">
                           <FontAwesomeIcon icon={faBriefcase} />
                           {category.jobCount?.toLocaleString()}+ positions
                         </div>
                      </button>

                      {/* Expanded Domains List */}
                      <AnimatePresence>
                        {expandedCategory?.id === category.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full flex flex-col items-center"
                          >
                            <CircuitConnector height="20px" />
                            
                            <div className="w-full bg-bg-elevated border border-border rounded-lg p-3 space-y-2">
                              {category.domains?.map((domain, dIdx) => (
                                <motion.div key={domain.id || dIdx}>
                                  <button
                                    onClick={() => toggleDomain(domain)}
                                    className={`
                                      w-full p-3 rounded border text-left flex items-center justify-between transition-all
                                      ${expandedDomain?.id === domain.id 
                                        ? 'bg-secondary/10 border-secondary/50 text-secondary' 
                                        : 'bg-bg-base border-border text-text-muted hover:border-text-muted hover:text-text-main'}
                                    `}
                                  >
                                    <div className="flex items-center gap-3">
                                      <FontAwesomeIcon icon={faLightbulb} className="text-xs" />
                                      <span className="text-sm font-medium">{domain.name}</span>
                                    </div>
                                    {expandedDomain?.id === domain.id && <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>}
                                  </button>
                                  
                                  {/* Expanded Job Roles */}
                                  <AnimatePresence>
                                    {expandedDomain?.id === domain.id && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pl-4 mt-2 border-l-2 border-border ml-4 space-y-2"
                                      >
                                        {loadingDomain ? (
                                           <div className="py-2 text-center text-secondary font-mono text-xs">
                                             <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                             Loading_Manifest...
                                           </div>
                                        ) : (
                                          (domainDetails?.domain?.jobRoles || domain.relatedJobTitles?.map(t => ({ title: t })))?.slice(0, 5).map((role, rIdx) => (
                                            <div key={rIdx}>
                                              <button
                                                onClick={() => toggleJobRole(role)}
                                                className={`
                                                  w-full py-2 px-3 rounded text-left text-xs font-mono transition-colors
                                                  ${expandedJobRole?.title === role.title 
                                                    ? 'bg-accent/20 text-accent border border-accent/30' 
                                                    : 'text-text-muted hover:text-text-main hover:bg-bg-surface'}
                                                `}
                                              >
                                                {`> ${role.title}`}
                                              </button>
                                              
                                              {/* Job Role Details */}
                                              <AnimatePresence>
                                                {expandedJobRole?.title === role.title && (
                                                  <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-2 mb-2 bg-bg-base rounded border border-border p-3"
                                                  >
                                                     {loadingJobRole ? (
                                                       <div className="text-center text-xs text-accent">
                                                         <FontAwesomeIcon icon={faSpinner} spin /> Fetching_Instances...
                                                       </div>
                                                     ) : (
                                                       <div className="space-y-3">
                                                         {/* Salary */}
                                                         {jobRoleDetails?.role?.salaryInsights && (
                                                           <div className="flex items-center gap-2 text-primary text-xs font-mono p-2 bg-primary/10 rounded border border-primary/30">
                                                             <FontAwesomeIcon icon={faDollarSign} />
                                                             <span>
                                                               {`$${jobRoleDetails.role.salaryInsights.entry?.min?.toLocaleString()} - $${jobRoleDetails.role.salaryInsights.senior?.max?.toLocaleString()}`}
                                                             </span>
                                                           </div>
                                                         )}
                                                         
                                                         {/* Jobs */}
                                                         {(jobRoleDetails?.jobListings || []).slice(0, 3).map((job, jIdx) => (
                                                           <a
                                                             key={jIdx}
                                                             href={job.applyUrl}
                                                             target="_blank"
                                                             rel="noopener noreferrer"
                                                             className="block p-2 bg-bg-surface rounded border border-border hover:border-secondary/50 transition-all group"
                                                           >
                                                             <div className="flex justify-between items-start">
                                                               <span className="text-xs text-text-main font-medium group-hover:text-secondary truncate w-32">
                                                                 {job.company?.name}
                                                               </span>
                                                               <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px] text-text-dim" />
                                                             </div>
                                                             <div className="flex gap-1 text-[10px] text-text-muted mt-1">
                                                               <FontAwesomeIcon icon={faMapMarkerAlt} /> {job.location}
                                                             </div>
                                                           </a>
                                                         ))}

                                                         <a
                                                           href={jobRoleDetails?.linkedinSearchUrl}
                                                           target="_blank"
                                                           rel="noopener noreferrer"
                                                           className="block w-full py-2 text-center bg-[#0077b5] hover:bg-[#006396] text-white text-xs rounded transition-colors"
                                                         >
                                                           <FontAwesomeIcon icon={faLinkedin} className="mr-2" />
                                                           View All on LinkedIn
                                                         </a>
                                                       </div>
                                                     )}
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          ))
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Dashboard (Trending + Popular) */}
          {!loading && !analysisData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded text-primary">
                    <FontAwesomeIcon icon={faChartLine} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-main">Market Intelligence</h2>
                    <p className="text-xs text-text-muted font-mono">Live Data: 2025-2026 Cycle</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-bg-surface rounded text-xs font-mono text-text-muted flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                     System Online
                   </div>
                </div>
              </div>

              {loadingTrending ? (
                 <div className="text-center py-20 text-text-muted font-mono text-sm">
                   <FontAwesomeIcon icon={faSpinner} spin className="text-primary mr-3" />
                   Streaming_Market_Data...
                 </div>
              ) : (
                <>
                  {/* Trending Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {trendingDomains?.domains?.map((domain, idx) => (
                      <motion.div
                        key={domain.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-bg-surface hover:bg-bg-elevated border border-border hover:border-secondary/50 rounded-xl p-5 text-left transition-all group relative overflow-hidden"
                      >
                         <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-secondary/10 transition-colors"></div>
                         
                         <div className="flex justify-between items-start mb-4">
                           <div className="text-3xl">{domain.icon}</div>
                           <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                             domain.demandLevel === 'Extreme' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                             domain.demandLevel === 'Very High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                             'bg-secondary/10 text-secondary border border-secondary/20'
                           }`}>
                             {domain.demandLevel} Demand
                           </span>
                         </div>
                         
                         <h3 
                           className="text-lg font-bold text-text-main mb-2 group-hover:text-secondary transition-colors cursor-pointer"
                           onClick={() => {
                             setKeyword(domain.name);
                             setTimeout(() => {
                               const searchBtn = document.querySelector('form button[type="submit"]');
                               searchBtn?.click();
                             }, 100);
                           }}
                         >
                           {domain.name}
                         </h3>
                         <p className="text-sm text-text-muted mb-4 line-clamp-2 leading-relaxed">
                           {domain.description}
                         </p>
                         
                         <div className="flex items-center justify-between pt-4 border-t border-border mb-4">
                           <div className="font-mono text-xs text-text-muted">
                             <div className="text-[10px] text-text-dim mb-0.5">COMPENSATION</div>
                             <span className="text-text-main">${domain.avgSalaryUSD?.toLocaleString()}</span>
                           </div>
                           <div className="font-mono text-xs text-right text-text-muted">
                             <div className="text-[10px] text-text-dim mb-0.5">GROWTH</div>
                             <span className="text-secondary">+{domain.growthRate}</span>
                           </div>
                         </div>
                         
                         {/* Start Journey Button */}
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             setSelectedCareer(domain);
                             setShowJourneyModal(true);
                           }}
                           className="w-full py-2.5 bg-primary hover:bg-primary/90 text-bg-base text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                         >
                           <FontAwesomeIcon icon={faRocket} />
                           Start {domain.name} Journey
                         </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recently Explored */}
                  {trendingDomains?.popularSearches?.length > 0 && (
                     <div className="bg-bg-elevated rounded-2xl p-8 border border-border">
                       <div className="flex items-center gap-3 mb-6">
                         <FontAwesomeIcon icon={faMicrochip} className="text-secondary" />
                         <h3 className="text-lg font-bold text-text-main">Recent System Activities</h3>
                         <span className="text-xs font-mono text-text-dim">// Recently processed queries</span>
                       </div>
                       
                       <div className="flex flex-wrap gap-3">
                         {trendingDomains.popularSearches.map((item, idx) => (
                           <motion.button
                               key={item.keyword}
                               initial={{ opacity: 0, scale: 0.9 }}
                               animate={{ opacity: 1, scale: 1 }}
                               transition={{ delay: idx * 0.05 }}
                               onClick={() => {
                                 setKeyword(item.keyword);
                                 setTimeout(() => {
                                   const searchBtn = document.querySelector('form button[type="submit"]');
                                   searchBtn?.click();
                                 }, 100);
                               }}
                               className="group flex items-center gap-3 px-4 py-2 bg-text-surface border border-border rounded-lg hover:border-secondary hover:bg-bg-surface transition-all"
                           >
                             <div className="w-1.5 h-1.5 rounded-full bg-text-dim group-hover:bg-secondary transition-colors"></div>
                             <span className="text-sm font-medium text-text-muted group-hover:text-text-main capitalize">
                               {item.keyword}
                             </span>
                             <span className="text-[10px] font-mono text-text-dim bg-bg-base px-1.5 rounded group-hover:text-secondary">
                               {item.usageCount}
                             </span>
                           </motion.button>
                         ))}
                       </div>
                     </div>
                  )}
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </section>
      
      {/* Start Journey Modal */}
      <StartJourneyModal 
        isOpen={showJourneyModal}
        onClose={() => {
          setShowJourneyModal(false);
          setSelectedCareer(null);
        }}
        career={selectedCareer}
      />
      
      {/* Active Journey Banner */}
      {hasActiveJourney() && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            to="/my-career-journey"
            className="flex items-center gap-3 px-4 py-3 bg-primary text-bg-base rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-bg-base/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faRocket} className="text-lg" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">Continue Journey</div>
              <div className="text-xs opacity-80">{journey?.career?.title}</div>
            </div>
            <FontAwesomeIcon icon={faChevronDown} className="transform -rotate-90 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </main>
  );
};

export default CareerExplorerPage;
