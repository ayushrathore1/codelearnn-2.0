import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faHeart as faHeartSolid,
  faEye,
  faClock,
  faShare,
  faSpinner,
  faCode,
  faGraduationCap,
  faNewspaper,
  faLightbulb,
  faCalendar,
  faEdit,
  faTrash,
  faBookOpen,
  faArrowUp,
  faQuoteLeft,
  faCheck,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartOutline } from "@fortawesome/free-regular-svg-icons";
import {
  faTwitter,
  faLinkedin,
  faFacebook,
} from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "../context/AuthContext";
import { blogsAPI } from "../services/api";

const categoryIcons = {
  technology: faCode,
  tutorial: faGraduationCap,
  news: faNewspaper,
  opinion: faLightbulb,
};

const categoryColors = {
  technology: "from-blue-500 to-cyan-500",
  tutorial: "from-green-500 to-emerald-500",
  news: "from-purple-500 to-pink-500",
  opinion: "from-orange-500 to-yellow-500",
};

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [readProgress, setReadProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  // Reading progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadProgress(Math.min(progress, 100));
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await blogsAPI.getBySlug(slug);

      if (response.data.success) {
        const blogData = response.data.data;
        setBlog(blogData);
        setLikeCount(blogData.likeCount || 0);
        setLiked(blogData.likes?.includes(user?._id));
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
      navigate("/blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await blogsAPI.like(blog._id);
      if (response.data.success) {
        setLiked(response.data.data.liked);
        setLikeCount(response.data.data.likeCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      await blogsAPI.delete(blog._id);
      navigate("/blogs");
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  const shareUrl = window.location.href;
  const shareText = blog?.title;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-5xl text-primary animate-spin"
          />
          <p className="text-text-muted">Loading article...</p>
        </div>
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
            <FontAwesomeIcon
              icon={faBookOpen}
              className="text-4xl text-text-dim"
            />
          </div>
          <p className="text-text-muted text-xl mb-4">Article not found</p>
          <Link to="/blogs" className="text-primary hover:underline">
            ← Back to all articles
          </Link>
        </motion.div>
      </main>
    );
  }

  const categoryColor =
    categoryColors[blog.category] || "from-primary to-secondary";
  const categoryIcon = categoryIcons[blog.category] || faCode;
  const isAuthor = user?._id === blog.author?._id;

  return (
    <main className="min-h-screen bg-bg-base selection:bg-primary selection:text-black">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-bg-elevated">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary"
          style={{ width: `${readProgress}%` }}
          initial={{ width: 0 }}
        />
      </div>

      {/* Floating Sidebar - Share & Actions */}
      <aside className="hidden xl:block fixed left-8 top-1/2 -translate-y-1/2 z-40">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 p-3 bg-bg-elevated/80 backdrop-blur-sm rounded-2xl border border-border shadow-xl"
        >
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              liked
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                : "bg-bg-base text-text-muted hover:text-pink-400 hover:bg-pink-500/10"
            } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
            title={liked ? "Unlike" : "Like"}
          >
            <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartOutline} />
          </button>

          <div className="text-center text-xs text-text-dim font-medium">
            {likeCount}
          </div>

          <div className="w-full h-px bg-border" />

          {/* Twitter */}
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-xl bg-bg-base flex items-center justify-center text-text-muted hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-all"
            title="Share on Twitter"
          >
            <FontAwesomeIcon icon={faTwitter} />
          </a>

          {/* LinkedIn */}
          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-xl bg-bg-base flex items-center justify-center text-text-muted hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-all"
            title="Share on LinkedIn"
          >
            <FontAwesomeIcon icon={faLinkedin} />
          </a>

          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="w-12 h-12 rounded-xl bg-bg-base flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
            title="Copy link"
          >
            <FontAwesomeIcon
              icon={copied ? faCheck : faCopy}
              className={copied ? "text-green-500" : ""}
            />
          </button>
        </motion.div>
      </aside>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollTop ? 1 : 0 }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary text-bg-base shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-110 transition-transform"
      >
        <FontAwesomeIcon icon={faArrowUp} />
      </motion.button>

      <article className="relative pt-28 pb-20">
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-10"
          >
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-all text-sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Articles
            </Link>
          </motion.div>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            {/* Category Badge */}
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r ${categoryColor} text-white shadow-lg mb-6`}
            >
              <FontAwesomeIcon icon={categoryIcon} />
              {blog.category}
            </span>

            {/* Title */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-main mb-8 leading-[1.1] tracking-tight">
              {blog.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-text-muted">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-base font-bold text-bg-base ring-4 ring-bg-elevated">
                  {blog.author?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <p className="text-text-main font-semibold text-base">
                    {blog.author?.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-text-dim">Author</p>
                </div>
              </div>

              <div className="hidden md:block w-px h-10 bg-border/50" />

              {/* Date */}
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faCalendar} className="text-primary" />
                {new Date(
                  blog.publishedAt || blog.createdAt,
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              {/* Read Time */}
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faClock} className="text-secondary" />
                {blog.readTime} min read
              </div>

              {/* Views */}
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faEye} className="text-purple-400" />
                {blog.views} views
              </div>
            </div>

            {/* Author Actions */}
            {isAuthor && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => navigate(`/blogs/edit/${blog.slug}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-all text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Edit Article
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Delete
                </button>
              </div>
            )}
          </motion.header>

          {/* Cover Image */}
          {blog.coverImage && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10"
            >
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full aspect-video object-cover"
              />
            </motion.div>
          )}

          {/* Excerpt/Hook - Premium Style */}
          {blog.excerpt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-12 relative"
            >
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary rounded-full" />
              <p className="text-xl md:text-2xl text-text-muted leading-relaxed italic pl-6">
                <FontAwesomeIcon
                  icon={faQuoteLeft}
                  className="text-primary/30 mr-3"
                />
                {blog.excerpt}
              </p>
            </motion.div>
          )}

          {/* Content - Premium Typography */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert prose-lg max-w-none mb-12
              prose-headings:font-heading prose-headings:font-bold prose-headings:text-text-main
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4
              prose-p:text-text-muted prose-p:leading-relaxed prose-p:text-lg
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-text-main prose-strong:font-semibold
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-2 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-bg-elevated prose-pre:border prose-pre:border-border prose-pre:rounded-xl
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-2
              prose-ul:text-text-muted prose-ol:text-text-muted
              prose-li:marker:text-primary"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2 mb-12"
            >
              {blog.tags.map((tag, i) => (
                <Link
                  key={i}
                  to={`/blogs?tag=${tag}`}
                  className="px-4 py-2 bg-bg-elevated rounded-xl text-sm text-text-muted hover:text-primary hover:bg-primary/10 border border-border hover:border-primary/50 transition-all font-medium"
                >
                  #{tag}
                </Link>
              ))}
            </motion.div>
          )}

          {/* Mobile Actions Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="xl:hidden flex flex-wrap items-center justify-between gap-4 py-6 px-6 -mx-6 bg-bg-elevated/50 backdrop-blur-sm border-y border-border rounded-2xl"
          >
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!isAuthenticated}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                liked
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25"
                  : "bg-bg-base border border-border text-text-muted hover:text-pink-400 hover:border-pink-500/50"
              } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartOutline} />
              {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </button>

            {/* Share Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-text-dim text-sm mr-1">
                <FontAwesomeIcon icon={faShare} />
              </span>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-muted hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all"
              >
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-muted hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-all"
              >
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-muted hover:text-[#1877F2] hover:border-[#1877F2]/50 transition-all"
              >
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <button
                onClick={copyLink}
                className="w-11 h-11 rounded-xl bg-bg-base border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/50 transition-all"
              >
                <FontAwesomeIcon
                  icon={copied ? faCheck : faCopy}
                  className={copied ? "text-green-500" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Author Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-8 bg-bg-elevated rounded-2xl border border-border"
          >
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xl font-bold text-bg-base ring-4 ring-bg-base">
                {blog.author?.name?.charAt(0) || "A"}
              </div>
              <div className="flex-1">
                <p className="text-text-dim text-sm uppercase tracking-wide mb-1">
                  Written by
                </p>
                <h3 className="text-text-main font-heading font-bold text-xl mb-2">
                  {blog.author?.name || "Anonymous"}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Thanks for reading! If you found this article helpful,
                  consider sharing it with others who might benefit.
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center"
          >
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-bg-base font-semibold text-base hover:shadow-[0_0_40px_-5px_var(--primary-glow)] transition-all"
            >
              <FontAwesomeIcon icon={faBookOpen} />
              Explore More Articles
            </Link>
          </motion.div>
        </div>
      </article>
    </main>
  );
};

export default BlogDetailPage;
