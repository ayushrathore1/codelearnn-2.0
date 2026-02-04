import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faArrowDown,
  faBookmark,
  faArrowLeft,
  faSpinner,
  faUserSecret,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import {
  charchaPostsAPI,
  charchaCommentsAPI,
  charchaVotesAPI,
  POST_TYPES,
  POST_TAGS,
  getCharchaUser,
} from "../../services/charchaApi";
import CommentThread from "./CommentThread";

const PostDetail = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [userVote, setUserVote] = useState(0);
  const [commentVotes, setCommentVotes] = useState({});
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const charchaUser = getCharchaUser();
  const postType = post ? POST_TYPES[post.type] || POST_TYPES.POST : null;
  const tag = post ? POST_TAGS.find((t) => t.id === post.tag) : null;

  const getAllCommentIds = useCallback((comments) => {
    let ids = [];
    for (const comment of comments) {
      ids.push(comment._id);
      if (comment.replies?.length > 0) {
        ids = [...ids, ...getAllCommentIds(comment.replies)];
      }
    }
    return ids;
  }, []);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      const currentUser = getCharchaUser();
      try {
        const response = await charchaPostsAPI.getPost(idOrSlug);
        setPost(response.data.post || response.data);

        // Check user's vote on post
        if (currentUser) {
          const votesRes = await charchaVotesAPI.checkVotes("post", [
            response.data.post?._id || response.data._id,
          ]);
          const votes = votesRes.data.votes || {};
          setUserVote(votes[response.data.post?._id || response.data._id] || 0);
        }
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [idOrSlug]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!post?._id) return;
      const currentUser = getCharchaUser();

      try {
        const response = await charchaCommentsAPI.getComments(post._id, {
          sort: "best",
        });
        setComments(response.data.comments || []);

        // Check user's votes on comments
        if (currentUser && response.data.comments?.length > 0) {
          const commentIds = getAllCommentIds(response.data.comments);
          if (commentIds.length > 0) {
            const votesRes = await charchaVotesAPI.checkVotes(
              "comment",
              commentIds,
            );
            setCommentVotes(votesRes.data.votes || {});
          }
        }
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [post?._id, getAllCommentIds]);

  const handleVote = async (voteType) => {
    if (!charchaUser) return;

    try {
      await charchaVotesAPI.vote("post", post._id, voteType);
      setUserVote((prev) => (prev === voteType ? 0 : voteType));
      setPost((prev) => ({
        ...prev,
        voteScore:
          prev.voteScore +
          (userVote === voteType ? -voteType : voteType - userVote),
      }));
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const handleCommentVote = async (commentId, voteType) => {
    if (!charchaUser) return;

    try {
      await charchaVotesAPI.vote("comment", commentId, voteType);
      setCommentVotes((prev) => ({
        ...prev,
        [commentId]: prev[commentId] === voteType ? 0 : voteType,
      }));
    } catch (err) {
      console.error("Failed to vote on comment:", err);
    }
  };

  const handleBookmark = async () => {
    if (!charchaUser) return;

    try {
      await charchaPostsAPI.bookmarkPost(post._id);
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !charchaUser) return;

    setSubmitting(true);
    try {
      const response = await charchaCommentsAPI.addComment(post._id, {
        content: newComment.trim(),
      });
      setComments((prev) => [response.data.comment, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId, content) => {
    if (!charchaUser) return;

    try {
      await charchaCommentsAPI.addComment(post._id, {
        content,
        parentCommentId,
      });
      // Refresh comments
      const response = await charchaCommentsAPI.getComments(post._id, {
        sort: "best",
      });
      setComments(response.data.comments || []);
    } catch (err) {
      console.error("Failed to reply:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!charchaUser) return;

    try {
      await charchaCommentsAPI.deleteComment(commentId);
      // Refresh comments
      const response = await charchaCommentsAPI.getComments(post._id, {
        sort: "best",
      });
      setComments(response.data.comments || []);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-6 bg-bg-base flex items-center justify-center">
        <FontAwesomeIcon
          icon={faSpinner}
          className="text-2xl text-primary animate-spin"
        />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-2xl text-text-main mb-4">Post not found</h1>
          <Link to="/charcha" className="text-primary hover:underline">
            ← Back to Charcha
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
      <div className="container mx-auto max-w-3xl">
        {/* Back Button */}
        <button
          onClick={() => navigate("/charcha")}
          className="flex items-center gap-2 text-text-muted hover:text-primary mb-6 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Charcha
        </button>

        {/* Post */}
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-bento p-6 mb-6"
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
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
                <span className="text-primary">
                  @{post.author?.username || "user"}
                </span>
              )}
            </span>
            <span className="text-text-dim">•</span>
            <span className="text-xs text-text-dim">
              {formatDate(post.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-heading font-bold text-text-main mb-4">
            {post.title}
          </h1>

          {/* Content */}
          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-text-muted whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {post.mediaUrls.map((media, idx) => (
                <div
                  key={idx}
                  className="rounded-lg overflow-hidden bg-bg-elevated border border-border"
                >
                  {media.type === "image" && (
                    <img src={media.url} alt="" className="w-full h-auto" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            {/* Votes */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote(1)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  userVote === 1
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-bg-elevated text-text-dim hover:text-primary"
                }`}
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </button>
              <span
                className={`font-bold text-lg ${
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
                onClick={() => handleVote(-1)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  userVote === -1
                    ? "bg-red-500/20 text-red-400"
                    : "hover:bg-bg-elevated text-text-dim hover:text-red-400"
                }`}
              >
                <FontAwesomeIcon icon={faArrowDown} />
              </button>
            </div>

            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isBookmarked
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-bg-elevated text-text-dim hover:text-primary"
              }`}
            >
              <FontAwesomeIcon icon={faBookmark} />
              <span className="text-sm">{isBookmarked ? "Saved" : "Save"}</span>
            </button>
          </div>
        </motion.article>

        {/* Comment Form */}
        <div className="card-bento p-4 mb-6">
          <div className="flex gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                charchaUser ? "Add a comment..." : "Login to comment"
              }
              disabled={!charchaUser}
              rows={3}
              className="flex-1 px-4 py-3 bg-bg-elevated border border-border rounded-lg text-text-main placeholder-text-dim focus:outline-none focus:border-primary resize-none disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || !charchaUser || submitting}
              className="btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} />
              )}
              Comment
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="card-bento p-4">
          <h3 className="font-heading font-semibold text-text-main mb-4">
            Comments ({comments.length})
          </h3>

          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <FontAwesomeIcon
                icon={faSpinner}
                className="text-primary animate-spin"
              />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <CommentThread
              comments={comments}
              userVotes={commentVotes}
              currentUserId={charchaUser?._id}
              onVote={handleCommentVote}
              onReply={handleReply}
              onDelete={handleDeleteComment}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default PostDetail;
