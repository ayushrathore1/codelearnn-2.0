import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPaperPlane,
  faSpinner,
  faUserSecret,
} from "@fortawesome/free-solid-svg-icons";
import {
  POST_TYPES,
  POST_TAGS,
  charchaPostsAPI,
} from "../../services/charchaApi";

const CreatePostModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("POST");
  const [tag, setTag] = useState("off-topic");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await charchaPostsAPI.createPost({
        title: title.trim(),
        content: content.trim(),
        type: postType,
        tag,
        isAnonymous,
      });

      setTitle("");
      setContent("");
      setPostType("POST");
      setTag("off-topic");
      setIsAnonymous(false);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError("");
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] bg-bg-surface border border-border rounded-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-heading font-semibold text-lg text-text-main">
                Create Post
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-main transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-4"
            >
              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Type & Tag Selection */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-text-dim uppercase tracking-wider mb-2">
                    Post Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(POST_TYPES).map(
                      ([key, { label, color }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPostType(key)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                            postType === key
                              ? color
                              : "text-text-muted border-border hover:border-text-dim"
                          }`}
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-text-dim uppercase tracking-wider mb-2">
                    Tag
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POST_TAGS.map(({ id, label, icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTag(id)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          tag === id
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-text-muted border-border hover:border-text-dim"
                        }`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-xs text-text-dim uppercase tracking-wider mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="An interesting title..."
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-main placeholder-text-dim focus:outline-none focus:border-primary transition-colors"
                  maxLength={200}
                />
              </div>

              {/* Content */}
              <div className="mb-4">
                <label className="block text-xs text-text-dim uppercase tracking-wider mb-2">
                  Content (supports Markdown)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts, code, or resources..."
                  rows={8}
                  className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-main placeholder-text-dim focus:outline-none focus:border-primary transition-colors resize-none font-mono text-sm"
                />
              </div>

              {/* Options */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isAnonymous
                      ? "bg-secondary/10 text-secondary border-secondary/30"
                      : "text-text-muted border-border hover:border-text-dim"
                  }`}
                >
                  <FontAwesomeIcon icon={faUserSecret} />
                  <span className="text-sm">Post Anonymously</span>
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !title.trim()}
                className="btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Posting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Post
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
