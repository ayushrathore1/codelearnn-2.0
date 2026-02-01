import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faTags,
  faCode,
  faGraduationCap,
  faNewspaper,
  faLightbulb,
  faBold,
  faItalic,
  faListUl,
  faListOl,
  faHeading,
  faLink,
  faQuoteLeft,
  faSpinner,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import { blogsAPI } from "../../services/api";

const categories = [
  { id: "technology", label: "Technology", icon: faCode },
  { id: "tutorial", label: "Tutorial", icon: faGraduationCap },
  { id: "news", label: "News", icon: faNewspaper },
  { id: "opinion", label: "Opinion", icon: faLightbulb },
];

const CreateBlogModal = ({ onClose, onCreated, editBlog = null }) => {
  const [title, setTitle] = useState(editBlog?.title || "");
  const [content, setContent] = useState(editBlog?.content || "");
  const [category, setCategory] = useState(editBlog?.category || "technology");
  const [coverImage, setCoverImage] = useState(editBlog?.coverImage || "");
  const [tags, setTags] = useState(editBlog?.tags?.join(", ") || "");
  const [status, setStatus] = useState(editBlog?.status || "published");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please add a title");
      return;
    }

    if (!content.trim()) {
      setError("Please add content");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const blogData = {
        title: title.trim(),
        content: content.trim(),
        category,
        coverImage: coverImage.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status,
      };

      if (editBlog) {
        await blogsAPI.update(editBlog._id, blogData);
      } else {
        await blogsAPI.create(blogData);
      }

      onCreated();
    } catch (err) {
      console.error("Blog submit error:", err);
      setError(err.response?.data?.message || "Failed to save blog");
    } finally {
      setLoading(false);
    }
  };

  const insertFormatting = (tag) => {
    const textarea = document.getElementById("blog-content");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let newText = "";

    switch (tag) {
      case "bold":
        newText = `<strong>${selectedText || "text"}</strong>`;
        break;
      case "italic":
        newText = `<em>${selectedText || "text"}</em>`;
        break;
      case "h2":
        newText = `<h2>${selectedText || "Heading"}</h2>`;
        break;
      case "ul":
        newText = `<ul>\n<li>${selectedText || "Item 1"}</li>\n<li>Item 2</li>\n</ul>`;
        break;
      case "ol":
        newText = `<ol>\n<li>${selectedText || "Item 1"}</li>\n<li>Item 2</li>\n</ol>`;
        break;
      case "link":
        newText = `<a href="url">${selectedText || "link text"}</a>`;
        break;
      case "quote":
        newText = `<blockquote>${selectedText || "Quote"}</blockquote>`;
        break;
      case "code":
        newText = `<pre><code>${selectedText || "code here"}</code></pre>`;
        break;
      default:
        return;
    }

    const newContent =
      content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-bg-elevated rounded-2xl border border-border shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-bg-elevated border-b border-border">
            <h2 className="font-heading text-xl font-semibold text-text-main">
              {editBlog ? "Edit Blog" : "Write a Blog"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-base transition-all"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter blog title..."
                className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      category === cat.id
                        ? "bg-gradient-to-r from-primary to-secondary text-bg-base"
                        : "bg-bg-base border border-border text-text-muted hover:text-primary hover:border-primary/50"
                    }`}
                  >
                    <FontAwesomeIcon icon={cat.icon} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                <FontAwesomeIcon icon={faImage} className="mr-2" />
                Cover Image URL
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                Content *
              </label>

              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 p-2 rounded-t-xl bg-bg-base border border-border border-b-0">
                <button
                  type="button"
                  onClick={() => insertFormatting("bold")}
                  className="p-2 rounded hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                  title="Bold"
                >
                  <FontAwesomeIcon icon={faBold} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("italic")}
                  className="p-2 rounded hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                  title="Italic"
                >
                  <FontAwesomeIcon icon={faItalic} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("h2")}
                  className="p-2 rounded hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                  title="Heading"
                >
                  <FontAwesomeIcon icon={faHeading} />
                </button>
                <div className="w-px h-6 bg-border mx-1 self-center" />
                <button
                  type="button"
                  onClick={() => insertFormatting("ul")}
                  className="p-2 rounded hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                  title="Bullet List"
                >
                  <FontAwesomeIcon icon={faListUl} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("ol")}
                  className="p-2 rounded hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                  title="Numbered List"
                >
                  <FontAwesomeIcon icon={faListOl} />
                </button>
                <div className="w-px h-6 bg-border mx-1 self-center" />
                <button
                  type="button"
                  onClick={() => insertFormatting("link")}
                  className="p-2 rounded hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                  title="Link"
                >
                  <FontAwesomeIcon icon={faLink} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("quote")}
                  className="p-2 rounded hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                  title="Quote"
                >
                  <FontAwesomeIcon icon={faQuoteLeft} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("code")}
                  className="p-2 rounded hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                  title="Code"
                >
                  <FontAwesomeIcon icon={faCode} />
                </button>
              </div>

              <textarea
                id="blog-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog content here... (HTML supported)"
                rows={12}
                className="w-full px-4 py-3 rounded-b-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                <FontAwesomeIcon icon={faTags} className="mr-2" />
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="react, javascript, webdev"
                className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                Status
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("published")}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    status === "published"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "bg-bg-base border border-border text-text-muted hover:border-green-500"
                  }`}
                >
                  Publish Now
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("draft")}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    status === "draft"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                      : "bg-bg-base border border-border text-text-muted hover:border-yellow-500"
                  }`}
                >
                  Save as Draft
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-bg-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin mr-2"
                  />
                  {editBlog ? "Updating..." : "Publishing..."}
                </>
              ) : editBlog ? (
                "Update Blog"
              ) : status === "draft" ? (
                "Save Draft"
              ) : (
                "Publish Blog"
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateBlogModal;
