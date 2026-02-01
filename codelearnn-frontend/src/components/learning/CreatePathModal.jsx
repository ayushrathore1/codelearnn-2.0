import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faRoute,
  faBriefcase,
  faPlus,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

/**
 * CreatePathModal - Modal for creating a new learning path
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onSubmit: (pathData) => Promise<void>
 * - careers: Array of career options for association
 * - activeCareerId: Currently active career ID
 */

const CreatePathModal = ({
  isOpen,
  onClose,
  onSubmit,
  careers = [],
  activeCareerId = null,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [careerId, setCareerId] = useState(activeCareerId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a title for your learning path");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        careerId: careerId || null,
      });

      // Reset form and close
      setTitle("");
      setDescription("");
      setCareerId(activeCareerId || "");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create learning path");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle("");
      setDescription("");
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FontAwesomeIcon icon={faRoute} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-main">
                      Create Learning Path
                    </h2>
                    <p className="text-sm text-text-muted">
                      Build your custom learning journey
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Error */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Path Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., React Fundamentals, Full Stack Journey"
                    className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none transition-colors"
                    maxLength={200}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    Description{" "}
                    <span className="text-text-dim">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will you learn in this path?"
                    rows={3}
                    className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none transition-colors resize-none"
                    maxLength={1000}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Career Association */}
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">
                    <FontAwesomeIcon
                      icon={faBriefcase}
                      className="mr-2 text-text-dim"
                    />
                    Associate with Career{" "}
                    <span className="text-text-dim">(optional)</span>
                  </label>
                  <select
                    value={careerId}
                    onChange={(e) => setCareerId(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-main focus:border-primary focus:outline-none transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="">No specific career</option>
                    {careers.map((career) => (
                      <option key={career.id} value={career.id}>
                        {career.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-text-dim mt-1">
                    Linking to a career helps track your readiness progress
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 btn-ghost py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                        />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPlus} />
                        Create Path
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePathModal;
