import { Link } from "react-router-dom";

/**
 * Minimal header for production landing page
 * Shows only logo and Join Waitlist button - no navigation
 */
const LandingHeader = () => {
  const scrollToWaitlist = () => {
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="font-heading font-bold text-xl sm:text-2xl text-text-main hover:text-primary transition-colors"
        >
          <span className="text-primary">&lt;</span>
          <span className="logo-text">
            <span className="text-metallic">Code</span>
            <span className="text-metallic">Learnn</span>
          </span>
          <span className="text-secondary">/&gt;</span>
        </Link>

        {/* Join Waitlist Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={scrollToWaitlist}
          className="btn-primary text-sm h-10 px-5 sm:px-6 shadow-[0_0_20px_-5px_var(--primary-glow)]"
        >
          Join Waitlist
        </motion.button>
      </div>
    </header>
  );
};

export default LandingHeader;
