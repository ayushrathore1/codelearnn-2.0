import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faSpinner,
  faSearch,
  faCode,
  faGraduationCap,
  faNewspaper,
  faLightbulb,
  faTags,
  faEye,
  faHeart,
  faClock,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blogsAPI } from '../services/api';
import CreateBlogModal from '../components/blogs/CreateBlogModal';

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

const BlogCard = ({ blog }) => {
  const categoryColor = categoryColors[blog.category] || 'from-primary to-secondary';
  const categoryIcon = categoryIcons[blog.category] || faCode;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-bg-elevated rounded-2xl border border-border overflow-hidden group"
    >
      <Link to={`/blogs/${blog.slug}`}>
        {/* Cover Image */}
        <div className="aspect-video bg-bg-base relative overflow-hidden">
          {blog.coverImage ? (
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryColor} opacity-20`} />
          )}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${categoryColor} text-white`}>
              <FontAwesomeIcon icon={categoryIcon} />
              {blog.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-heading font-semibold text-text-main text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h3>
          <p className="text-text-muted text-sm line-clamp-2 mb-4">
            {blog.excerpt}
          </p>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {blog.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-bg-base rounded text-xs text-text-dim">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-bg-base">
                {blog.author?.name?.charAt(0) || 'A'}
              </div>
              <span className="text-text-dim text-xs">{blog.author?.name || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-3 text-text-dim text-xs">
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} />
                {blog.readTime} min
              </span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faEye} />
                {blog.views}
              </span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faHeart} />
                {blog.likeCount || 0}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const BlogsPage = () => {
  const { isAuthenticated } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const categories = [
    { id: 'all', label: 'All Posts', icon: faTags },
    { id: 'technology', label: 'Technology', icon: faCode },
    { id: 'tutorial', label: 'Tutorials', icon: faGraduationCap },
    { id: 'news', label: 'News', icon: faNewspaper },
    { id: 'opinion', label: 'Opinion', icon: faLightbulb }
  ];

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory, pagination.page]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 12
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await blogsAPI.getAll(params);
      
      if (response.data.success) {
        setBlogs(response.data.data);
        setPagination(prev => ({
          ...prev,
          pages: response.data.pagination.pages,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBlogs();
  };

  const handleBlogCreated = () => {
    setShowCreateModal(false);
    fetchBlogs();
  };

  return (
    <main className="min-h-screen bg-bg-base pt-24 pb-16">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-main mb-4">
              Tech <span className="text-gradient">Blogs</span>
            </h1>
            <p className="text-text-muted text-lg mb-8">
              Explore insights on new technologies, tutorials, and the latest in tech. 
              Share your knowledge with the community.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3.5 pl-12 rounded-xl bg-bg-elevated border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-bg-base font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Write Blog Button */}
            {isAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-bg-base font-semibold hover:opacity-90 transition-opacity"
              >
                <FontAwesomeIcon icon={faPen} />
                Write a Blog
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="container mx-auto px-6 mb-8">
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-primary to-secondary text-bg-base'
                  : 'bg-bg-elevated border border-border text-text-muted hover:text-primary hover:border-primary/50'
              }`}
            >
              <FontAwesomeIcon icon={cat.icon} />
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="container mx-auto px-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-primary animate-spin" />
          </div>
        ) : blogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-text-muted text-lg mb-4">No blogs found</p>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-primary hover:underline"
              >
                Be the first to write one!
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {blogs.map((blog) => (
                  <BlogCard key={blog._id} blog={blog} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      pagination.page === page
                        ? 'bg-gradient-to-r from-primary to-secondary text-bg-base'
                        : 'bg-bg-elevated border border-border text-text-muted hover:border-primary'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Create Blog Modal */}
      {showCreateModal && (
        <CreateBlogModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBlogCreated}
        />
      )}
    </main>
  );
};

export default BlogsPage;
