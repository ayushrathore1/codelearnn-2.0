import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBrain,
  faRocket,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

const VisualizationsPage = () => {
  // No visualizations yet - coming soon feature
  const [loading] = useState(false);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-mono uppercase tracking-wider mb-4">
            <FontAwesomeIcon icon={faBrain} className="mr-2" />
            Deep Understanding
          </span>
          <h1 className="text-h1 text-text-main mb-4">Visual Learning</h1>
          <p className="text-body-lg text-text-muted max-w-2xl mx-auto">
            Complex concepts explained through interactive animations and visual stories.
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-24">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-secondary animate-spin mb-4" />
            <p className="text-text-muted font-mono">Loading visualizations...</p>
          </div>
        )}

        {/* Coming Soon State */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-24"
          >
            <div className="w-24 h-24 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-8">
              <FontAwesomeIcon icon={faRocket} className="text-4xl text-secondary" />
            </div>
            
            <h3 className="text-h3 text-text-main mb-4">Visualizations Coming Soon</h3>
            <p className="text-text-muted max-w-lg mx-auto mb-8">
              We're building interactive visual lessons to help you understand complex programming concepts. 
              This feature will be available soon with progress tracking.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-dim">
                🎯 React Rendering
              </span>
              <span className="px-4 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-dim">
                🔄 Event Loop
              </span>
              <span className="px-4 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-dim">
                📊 Sorting Algorithms
              </span>
              <span className="px-4 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-dim">
                🧠 Neural Networks
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default VisualizationsPage;
