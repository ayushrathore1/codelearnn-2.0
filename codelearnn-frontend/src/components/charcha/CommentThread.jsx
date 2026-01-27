import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowUp, 
  faArrowDown, 
  faReply,
  faTrash,
  faUserSecret
} from '@fortawesome/free-solid-svg-icons';
import { getLevelInfo } from '../../services/charchaApi';

const CommentThread = ({ 
  comments, 
  userVotes = {},
  currentUserId,
  onVote, 
  onReply, 
  onDelete,
  depth = 0 
}) => {
  const maxDepth = 4; // Max nesting level

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-border/50 pl-4' : ''}>
      {comments.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          userVote={userVotes[comment._id] || 0}
          currentUserId={currentUserId}
          onVote={onVote}
          onReply={onReply}
          onDelete={onDelete}
          depth={depth}
          maxDepth={maxDepth}
          userVotes={userVotes}
        />
      ))}
    </div>
  );
};

const CommentItem = ({ 
  comment, 
  userVote, 
  currentUserId,
  onVote, 
  onReply, 
  onDelete,
  depth,
  maxDepth,
  userVotes
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const levelInfo = comment.author ? getLevelInfo(comment.author.aura || 0) : null;
  const isOwner = currentUserId && comment.author?._id === currentUserId;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const handleSubmitReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(comment._id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
    }
  };

  return (
    <div className="py-3">
      {/* Comment Header */}
      <div className="flex items-center gap-2 mb-2">
        {comment.isAnonymous ? (
          <span className="text-xs text-text-dim flex items-center gap-1">
            <FontAwesomeIcon icon={faUserSecret} />
            Anonymous
          </span>
        ) : (
          <>
            <span className="text-xs">{levelInfo?.icon}</span>
            <span className="text-xs text-primary font-medium">
              @{comment.author?.username || 'user'}
            </span>
            <span className="text-[10px] text-text-dim">
              Lv.{comment.author?.level || levelInfo?.level || 1}
            </span>
          </>
        )}
        <span className="text-text-dim">•</span>
        <span className="text-[10px] text-text-dim">{formatDate(comment.createdAt)}</span>
      </div>

      {/* Comment Content */}
      <p className="text-sm text-text-main mb-2 whitespace-pre-wrap">
        {comment.content}
      </p>

      {/* Comment Actions */}
      <div className="flex items-center gap-4 text-text-dim">
        {/* Votes */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onVote && onVote(comment._id, 1)}
            className={`p-1 rounded transition-colors ${
              userVote === 1 ? 'text-primary' : 'hover:text-primary'
            }`}
          >
            <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
          </button>
          <span className={`text-xs font-medium ${
            comment.voteScore > 0 ? 'text-primary' : 
            comment.voteScore < 0 ? 'text-red-400' : ''
          }`}>
            {comment.voteScore || 0}
          </span>
          <button
            onClick={() => onVote && onVote(comment._id, -1)}
            className={`p-1 rounded transition-colors ${
              userVote === -1 ? 'text-red-400' : 'hover:text-red-400'
            }`}
          >
            <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
          </button>
        </div>

        {/* Reply */}
        {depth < maxDepth && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-xs hover:text-primary transition-colors"
          >
            <FontAwesomeIcon icon={faReply} />
            Reply
          </button>
        )}

        {/* Delete (owner only) */}
        {isOwner && (
          <button
            onClick={() => onDelete && onDelete(comment._id)}
            className="flex items-center gap-1 text-xs hover:text-red-400 transition-colors"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
            placeholder="Write a reply..."
            className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSubmitReply}
            disabled={!replyContent.trim()}
            className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <CommentThread
          comments={comment.replies}
          userVotes={userVotes}
          currentUserId={currentUserId}
          onVote={onVote}
          onReply={onReply}
          onDelete={onDelete}
          depth={depth + 1}
        />
      )}
    </div>
  );
};

export default CommentThread;
