import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import { faTwitter, faLinkedin, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';
import { blogsAPI } from '../services/api';

const categoryIcons = {
  technology: faCode,
  tutorial: faGraduationCap,
  news: faNewspaper,
  opinion: faLightbulb
};

const categoryColors = {
  technology: 'from-blue-500 to-cyan-500',
  tutorial: 'from-green-500 to-emerald-500',
  news: 'from-purple-500 to-pink-500',
  opinion: 'from-orange-500 to-yellow-500'
};

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchBlog();
  }, [slug]);

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
      console.error('Error fetching blog:', error);
      navigate('/blogs');
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
      console.error('Error toggling like:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      await blogsAPI.delete(blog._id);
      navigate('/blogs');
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const shareUrl = window.location.href;
  const shareText = blog?.title;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-primary animate-spin" />
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="min-h-screen bg-bg-base pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted text-lg mb-4">Blog not found</p>
          <Link to="/blogs" className="text-primary hover:underline">
            Back to blogs
          </Link>
        </div>
      </main>
    );
  }

  const categoryColor = categoryColors[blog.category] || 'from-primary to-secondary';
  const categoryIcon = categoryIcons[blog.category] || faCode;
  const isAuthor = user?._id === blog.author?._id;

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16">
      <article className="container mx-auto px-6 max-w-4xl">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Blogs
          </Link>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Category Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${categoryColor} text-white mb-4`}>
            <FontAwesomeIcon icon={categoryIcon} />
            {blog.category}
          </span>

          {/* Title */}
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-text-main mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-text-muted text-sm">
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-sm font-bold text-bg-base">
                {blog.author?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-text-main font-medium">{blog.author?.name || 'Anonymous'}</p>
                <p className="text-xs text-text-dim">Author</p>
              </div>
            </div>

            <div className="w-px h-8 bg-border" />

            {/* Date */}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} />
              {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>

            {/* Read Time */}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} />
              {blog.readTime} min read
            </div>

            {/* Views */}
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faEye} />
              {blog.views} views
            </div>
          </div>

          {/* Author Actions */}
          {isAuthor && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate(`/blogs/edit/${blog.slug}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated border border-border text-text-muted hover:text-primary hover:border-primary/50 transition-all text-sm"
              >
                <FontAwesomeIcon icon={faEdit} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-elevated border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 rounded-2xl overflow-hidden"
          >
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full aspect-video object-cover"
            />
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert prose-lg max-w-none mb-10"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {blog.tags.map((tag, i) => (
              <Link
                key={i}
                to={`/blogs?tag=${tag}`}
                className="px-3 py-1.5 bg-bg-elevated rounded-lg text-sm text-text-muted hover:text-primary hover:bg-bg-elevated/80 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </motion.div>
        )}

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b border-border"
        >
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
              liked
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                : 'bg-bg-elevated border border-border text-text-muted hover:text-pink-400 hover:border-pink-500/50'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FontAwesomeIcon icon={liked ? faHeartSolid : faHeartOutline} />
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>

          {/* Share Buttons */}
          <div className="flex items-center gap-3">
            <span className="text-text-muted text-sm">
              <FontAwesomeIcon icon={faShare} className="mr-2" />
              Share:
            </span>
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 transition-all"
            >
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-all"
            >
              <FontAwesomeIcon icon={faLinkedin} />
            </a>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-[#1877F2] hover:border-[#1877F2]/50 transition-all"
            >
              <FontAwesomeIcon icon={faFacebook} />
            </a>
          </div>
        </motion.div>
      </article>
    </main>
  );
};

export default BlogDetailPage;
