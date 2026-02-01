import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faArrowDown,
  faComment,
  faBookmark,
  faUserSecret,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { POST_TYPES, POST_TAGS } from "../../services/charchaApi";

const PostCard = ({
  post,
  userVote = 0,
  isBookmarked = false,
  onVote,
  onBookmark,
}) => {
  const postType = POST_TYPES[post.type] || POST_TYPES.POST;
  const tag = POST_TAGS.find((t) => t.id === post.tag);

  const handleVote = (e, voteType) => {
    e.preventDefault();
    e.stopPropagation();
    if (onVote) onVote(post._id, voteType);
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBookmark) onBookmark(post._id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link to={`/charcha/post/${post.slug || post._id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-bento p-4 hover:border-primary/50 group cursor-pointer transition-all"
      >
        <div className="flex gap-4">
          {/* Vote Section */}
          <div className="flex flex-col items-center gap-1 min-w-[40px]">
            <button
              onClick={(e) => handleVote(e, 1)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                userVote === 1
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-bg-elevated text-text-dim hover:text-primary"
              }`}
            >
              <FontAwesomeIcon icon={faArrowUp} className="text-sm" />
            </button>
            <span
              className={`font-bold text-sm ${
                post.voteScore > 0
                  ? "text-primary"
                  : post.voteScore < 0
                    ? "text-red-400"
                    : "text-text-muted"
              }`}
            >
              {post.voteScore || 0}
            </span>
            <button
              onClick={(e) => handleVote(e, -1)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                userVote === -1
                  ? "bg-red-500/20 text-red-400"
                  : "hover:bg-bg-elevated text-text-dim hover:text-red-400"
              }`}
            >
              <FontAwesomeIcon icon={faArrowDown} className="text-sm" />
            </button>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            {/* Header with type, tag, author */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${postType.color}`}
              >
                {postType.label}
              </span>
              {tag && (
                <span className="text-xs text-text-dim">
                  {tag.icon} {tag.label}
                </span>
              )}
              <span className="text-text-dim">•</span>
              <span className="text-xs text-text-dim flex items-center gap-1">
                {post.isAnonymous ? (
                  <>
                    <FontAwesomeIcon icon={faUserSecret} />
                    <span>Anonymous</span>
                  </>
                ) : (
                  <>
                    <span className="text-primary">
                      @{post.author?.username || "user"}
                    </span>
                    {post.author?.level && (
                      <span className="text-text-dim ml-1">
                        Lv.{post.author.level}
                      </span>
                    )}
                  </>
                )}
              </span>
              <span className="text-text-dim">•</span>
              <span className="text-xs text-text-dim">
                {formatDate(post.createdAt)}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-medium text-text-main group-hover:text-primary transition-colors mb-2 line-clamp-2">
              {post.title}
            </h3>

            {/* Content Preview */}
            {post.content && (
              <p className="text-sm text-text-muted line-clamp-2 mb-3">
                {post.content.replace(/[#*`]/g, "").slice(0, 200)}
              </p>
            )}

            {/* Media Preview */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-hidden">
                {post.mediaUrls.slice(0, 3).map((media, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 rounded-lg bg-bg-elevated border border-border overflow-hidden"
                  >
                    {media.type === "image" && (
                      <img
                        src={media.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                    {media.type === "video" && (
                      <div className="w-full h-full flex items-center justify-center text-text-dim">
                        ▶
                      </div>
                    )}
                    {media.type === "pdf" && (
                      <div className="w-full h-full flex items-center justify-center text-text-dim text-xs">
                        PDF
                      </div>
                    )}
                  </div>
                ))}
                {post.mediaUrls.length > 3 && (
                  <div className="w-16 h-16 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-dim text-xs">
                    +{post.mediaUrls.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center gap-4 text-text-dim">
              <span className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
                <FontAwesomeIcon icon={faComment} />
                {post.commentCount || 0} comments
              </span>
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  isBookmarked ? "text-primary" : "hover:text-primary"
                }`}
              >
                <FontAwesomeIcon icon={faBookmark} />
                {isBookmarked ? "Saved" : "Save"}
              </button>
              {post.viewCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs">
                  <FontAwesomeIcon icon={faEye} />
                  {post.viewCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default PostCard;
