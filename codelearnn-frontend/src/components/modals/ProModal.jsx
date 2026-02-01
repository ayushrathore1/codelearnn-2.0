import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faCrown,
  faRocket,
  faChartLine,
  faBrain,
  faCode,
} from "@fortawesome/free-solid-svg-icons";

const ProModal = ({ isOpen, onClose }) => {
  const features = [
    {
      icon: faBrain,
      title: "Advanced AI Analysis",
      description:
        "Get deep insights into any coding tutorial with our advanced AI model.",
    },
    {
      icon: faChartLine,
      title: "Unlimited Career Paths",
      description:
        "Generate unlimited personalized learning paths for any tech role.",
    },
    {
      icon: faCode,
      title: "Interactive Code Reviews",
      description: "Get instant feedback on your code from our AI mentor.",
    },
    {
      icon: faRocket,
      title: "Priority Access",
      description: "Early access to new features and priority support.",
    },
  ];

  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg bg-bg-surface border border-primary/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <AnimatePresence mode="wait">
              {!showComingSoon ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Header */}
                  <div className="relative p-6 pb-0 text-center">
                    <button
                      onClick={onClose}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-elevated/80 transition-all z-20"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>

                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_30px_rgba(var(--color-primary-glow),0.3)]">
                      <FontAwesomeIcon
                        icon={faCrown}
                        className="text-3xl text-gradient-primary"
                      />
                    </div>

                    <h2 className="text-2xl font-heading font-bold mb-2">
                      Upgrade to{" "}
                      <span className="text-gradient-primary">Pro</span>
                    </h2>
                    <p className="text-text-muted text-sm max-w-sm mx-auto">
                      Supercharge your learning journey with advanced AI
                      features and unlimited access.
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="p-6 space-y-4">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-bg-elevated/50 transition-colors border border-transparent hover:border-border/50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center flex-shrink-0 text-primary">
                          <FontAwesomeIcon icon={feature.icon} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-main text-sm mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-text-muted leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer / CTA */}
                  <div className="p-6 pt-2 bg-gradient-to-b from-transparent to-bg-elevated/50">
                    <div className="flex items-center justify-between mb-6 px-2">
                      <div>
                        <span className="text-sm text-text-muted line-through mr-2">
                          ₹499
                        </span>
                        <span className="text-2xl font-bold text-text-main">
                          ₹149
                        </span>
                        <span className="text-sm text-text-muted">/month</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                        Limited Offer
                      </div>
                    </div>

                    <button
                      onClick={() => setShowComingSoon(true)}
                      className="w-full btn-primary py-4 text-sm uppercase tracking-wide shadow-[0_0_20px_rgba(var(--color-primary-glow),0.4)] hover:shadow-[0_0_30px_rgba(var(--color-primary-glow),0.6)] group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faRocket} />
                        Unlock Pro Access
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>

                    <p className="text-center text-[10px] text-text-dim mt-4">
                      Secure payment via Razorpay • Cancel anytime
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="coming-soon"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center min-h-[400px] flex flex-col items-center justify-center"
                >
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-elevated/80 transition-all z-20"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>

                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 animate-pulse">
                    <FontAwesomeIcon
                      icon={faRocket}
                      className="text-4xl text-primary"
                    />
                  </div>

                  <h3 className="text-2xl font-heading font-bold mb-4">
                    Coming Soon!
                  </h3>
                  <p className="text-text-muted mb-8 max-w-xs mx-auto leading-relaxed">
                    We're currently strictly integrating{" "}
                    <span className="text-text-main font-semibold">
                      Razorpay
                    </span>{" "}
                    to ensure 100% secure transactions.
                  </p>

                  <div className="w-full bg-bg-elevated/50 rounded-xl p-4 border border-border mb-6">
                    <p className="text-sm text-text-main font-medium mb-1">
                      Get Notified
                    </p>
                    <p className="text-xs text-text-muted">
                      We'll alert you silently when payments are live.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowComingSoon(false)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-2"
                  >
                    Back to Features
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProModal;
