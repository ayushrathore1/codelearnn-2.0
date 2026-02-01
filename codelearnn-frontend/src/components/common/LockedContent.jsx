import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faRocket } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const LockedContent = ({
  children,
  isLocked = false,
  title = "Premium Content",
  blurAmount = "blur-md",
}) => {
  if (!isLocked) return children;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Blurred Content */}
      <div
        className={`filter ${blurAmount} select-none pointer-events-none opacity-50`}
      >
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-transparent via-bg-base/80 to-bg-base">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md p-6 bg-bg-elevated/90 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)]"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <FontAwesomeIcon icon={faLock} className="text-bg-base text-xl" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-text-muted mb-6">
            Unlock this advanced module to access premium resources, source
            code, and expert insights.
          </p>

          <Link
            to="/pricing"
            className="block w-full py-3 px-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-bg-base font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:-translate-y-1"
          >
            <FontAwesomeIcon icon={faRocket} className="mr-2" />
            Upgrade to Pro
          </Link>

          <p className="mt-4 text-xs text-text-dim">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-secondary underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LockedContent;
