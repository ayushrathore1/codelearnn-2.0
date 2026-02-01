import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSpinner,
  faFire,
  faBolt,
  faTrophy,
  faStar,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import {
  charchaPostsAPI,
  charchaVotesAPI,
  charchaAuthAPI,
  SORT_OPTIONS,
  POST_TYPES,
  POST_TAGS,
  getCharchaUser,
  setCharchaUser,
  setCharchaToken,
} from "../services/charchaApi";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/charcha/PostCard";
import UserStatsBar from "../components/charcha/UserStatsBar";
import LeaderboardPanel from "../components/charcha/LeaderboardPanel";
import CreatePostModal from "../components/charcha/CreatePostModal";

const CharchaPage = () => {
  const { user: mainUser, isAuthenticated } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [charchaUser, setCharchaUserState] = useState(null);
  const [charchaLoading, setCharchaLoading] = useState(true);

  // Filters
  const [sort, setSort] = useState("hot");
  const [postType, setPostType] = useState("all");
  const [tag, setTag] = useState("all");
  const [page, setPage] = useState(1);

  // UI State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Auto-register/login to Charcha backend using main app credentials
  useEffect(() => {
    const initCharchaAuth = async () => {
      if (!isAuthenticated || !mainUser) {
        setCharchaLoading(false);
        return;
      }

      const existingUser = getCharchaUser();
      if (existingUser) {
        setCharchaUserState(existingUser);
        setCharchaLoading(false);
        return;
      }

      try {
        // Try to get existing user first
        const meRes = await charchaAuthAPI.getMe();
        setCharchaUserState(meRes.data.user);
        setCharchaUser(meRes.data.user);
      } catch (_) {
        // If not authenticated, try to register/login
        try {
          const registerRes = await charchaAuthAPI.register({
            email: mainUser.email,
            password: mainUser._id, // Use user ID as password for auto-auth
            name: mainUser.name,
          });
          setCharchaToken(registerRes.data.token);
          setCharchaUser(registerRes.data.user);
          setCharchaUserState(registerRes.data.user);
        } catch (_regErr) {
          // Already registered, try login
          try {
            const loginRes = await charchaAuthAPI.login({
              email: mainUser.email,
              password: mainUser._id,
            });
            setCharchaToken(loginRes.data.token);
            setCharchaUser(loginRes.data.user);
            setCharchaUserState(loginRes.data.user);
          } catch (loginErr) {
            console.error("Charcha auth failed:", loginErr);
          }
        }
      } finally {
        setCharchaLoading(false);
      }
    };

    initCharchaAuth();
  }, [isAuthenticated, mainUser]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = {
          sort,
          page,
          limit: 20,
        };
        if (postType !== "all") params.type = postType;
        if (tag !== "all") params.tag = tag;

        const response = await charchaPostsAPI.getPosts(params);
        const postsData = response.data.posts || response.data.data || [];
        setPosts(postsData);

        // Check user votes
        if (charchaUser && postsData.length > 0) {
          const postIds = postsData.map((p) => p._id);
          const votesRes = await charchaVotesAPI.checkVotes("post", postIds);
          setUserVotes(votesRes.data.votes || {});
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [sort, postType, tag, page, charchaUser]);

  const handleVote = async (postId, voteType) => {
    if (!charchaUser) return;

    try {
      await charchaVotesAPI.vote("post", postId, voteType);
      setUserVotes((prev) => ({
        ...prev,
        [postId]: prev[postId] === voteType ? 0 : voteType,
      }));

      // Update post score locally
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            const currentVote = userVotes[postId] || 0;
            const scoreDiff =
              currentVote === voteType ? -voteType : voteType - currentVote;
            return { ...post, voteScore: (post.voteScore || 0) + scoreDiff };
          }
          return post;
        }),
      );
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const handleBookmark = async (postId) => {
    if (!charchaUser) return;

    try {
      await charchaPostsAPI.bookmarkPost(postId);
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  };

  const handlePostCreated = () => {
    // Refresh posts
    setPage(1);
    setSort("new");
  };

  const getSortIcon = (sortId) => {
    switch (sortId) {
      case "hot":
        return faFire;
      case "new":
        return faBolt;
      case "top":
        return faTrophy;
      case "quality":
        return faStar;
      default:
        return faFire;
    }
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-text-main mb-2">
                <span className="text-primary">चर्चा</span> Charcha
              </h1>
              <p className="text-text-muted">
                Developer community • Share, learn, discuss
              </p>
            </div>

            {charchaUser && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Create Post
              </button>
            )}
          </div>
        </motion.div>

        {/* User Stats */}
        {charchaUser && !charchaLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <UserStatsBar user={charchaUser} />
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Content */}
          <div>
            {/* Sort & Filter Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="card-bento p-3 mb-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Sort Tabs */}
                <div className="flex items-center gap-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSort(option.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        sort === option.id
                          ? "bg-primary/20 text-primary"
                          : "text-text-muted hover:text-text-main hover:bg-bg-elevated"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={getSortIcon(option.id)}
                        className="text-xs"
                      />
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    showFilters || postType !== "all" || tag !== "all"
                      ? "bg-secondary/20 text-secondary"
                      : "text-text-muted hover:text-text-main hover:bg-bg-elevated"
                  }`}
                >
                  <FontAwesomeIcon icon={faFilter} />
                  Filters
                </button>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border space-y-4"
                >
                  {/* Post Type Filter */}
                  <div>
                    <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">
                      Post Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPostType("all")}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          postType === "all"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-text-muted border-border hover:border-text-dim"
                        }`}
                      >
                        All
                      </button>
                      {Object.entries(POST_TYPES).map(
                        ([key, { label, color }]) => (
                          <button
                            key={key}
                            onClick={() => setPostType(key)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
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

                  {/* Tag Filter */}
                  <div>
                    <label className="text-xs text-text-dim uppercase tracking-wider mb-2 block">
                      Tag
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTag("all")}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          tag === "all"
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-text-muted border-border hover:border-text-dim"
                        }`}
                      >
                        All
                      </button>
                      {POST_TAGS.map(({ id, label, icon }) => (
                        <button
                          key={id}
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
                </motion.div>
              )}
            </motion.div>

            {/* Posts List */}
            {loading ? (
              <div className="flex justify-center py-16">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="text-2xl text-primary animate-spin"
                />
              </div>
            ) : posts.length === 0 ? (
              <div className="card-bento p-12 text-center">
                <p className="text-text-muted mb-4">No posts yet</p>
                {charchaUser && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary"
                  >
                    Be the first to post!
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PostCard
                      post={post}
                      userVote={userVotes[post._id] || 0}
                      onVote={handleVote}
                      onBookmark={handleBookmark}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Load More */}
            {posts.length >= 20 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  className="btn-secondary"
                >
                  Load More
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <LeaderboardPanel />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card-bento p-4"
            >
              <h3 className="font-heading font-semibold text-text-main mb-3">
                How it works
              </h3>
              <ul className="text-sm text-text-muted space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Share notes, resources, roadmaps
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Earn AURA by getting upvotes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Build CRED through quality posts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Level up and unlock perks
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePostCreated}
      />
    </main>
  );
};

export default CharchaPage;
