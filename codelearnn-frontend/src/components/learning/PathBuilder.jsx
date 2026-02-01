import { useState, useCallback } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGripVertical,
  faTrash,
  faPlus,
  faCheck,
  faSave,
  faUndo,
  faCodeBranch,
  faLink,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube } from "@fortawesome/free-brands-svg-icons";

/**
 * PathBuilder Component
 *
 * A drag-and-drop learning path editor for creating and managing
 * user learning paths. Supports:
 * - Drag-and-drop reordering
 * - Adding videos from saved library or YouTube URL
 * - Removing videos from path
 * - Marking videos as complete
 * - Saving changes
 *
 * Props:
 * - path: UserLearningPath object
 * - savedVideos: Array of SavedVideo objects available to add
 * - onAddVideo: (videoId) => void
 * - onRemoveVideo: (nodeId) => void
 * - onReorder: (newOrder) => void
 * - onCompleteNode: (nodeId) => void
 * - isLoading: boolean
 */

const PathBuilder = ({
  path,
  savedVideos = [],
  onAddVideo,
  onRemoveVideo,
  onReorder,
  onCompleteNode,
  isLoading = false,
}) => {
  const [nodes, setNodes] = useState(path?.structureGraph?.nodes || []);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Handle reorder
  const handleReorder = useCallback((newOrder) => {
    setNodes(newOrder);
    setHasChanges(true);
  }, []);

  // Save changes
  const handleSave = useCallback(() => {
    const nodeOrder = nodes.map((n) => n.id);
    onReorder?.(nodeOrder);
    setHasChanges(false);
  }, [nodes, onReorder]);

  // Reset changes
  const handleReset = useCallback(() => {
    setNodes(path?.structureGraph?.nodes || []);
    setHasChanges(false);
  }, [path]);

  // Add video from saved library
  const handleAddFromLibrary = useCallback(
    (videoId) => {
      onAddVideo?.(videoId);
      setShowAddPanel(false);
    },
    [onAddVideo],
  );

  // Add video from YouTube URL
  const handleAddFromUrl = useCallback(() => {
    if (!youtubeUrl.trim()) return;

    // Extract video ID from URL
    const match = youtubeUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    );
    if (match) {
      onAddVideo?.(match[1]);
      setYoutubeUrl("");
      setShowAddPanel(false);
    }
  }, [youtubeUrl, onAddVideo]);

  // Get completion stats
  const completedCount = nodes.filter((n) => n.isCompleted).length;
  const progressPercent =
    nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0;

  return (
    <div className="path-builder">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-main">
            {path?.title || "Learning Path"}
          </h2>
          <p className="text-sm text-text-muted">
            {nodes.length} videos • {progressPercent}% complete
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="btn-ghost text-sm flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUndo} />
                Reset
              </button>
              <button
                onClick={handleSave}
                className="btn-primary text-sm flex items-center gap-2"
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faSave} />
                Save Order
              </button>
            </>
          )}
          <button
            onClick={() => setShowAddPanel(!showAddPanel)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Video
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Add Video Panel */}
      {showAddPanel && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-bg-surface rounded-xl border border-border"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* From Saved Library */}
            <div>
              <h4 className="text-sm font-medium text-text-main mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faLink} className="text-primary" />
                From Saved Videos
              </h4>

              {savedVideos.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedVideos.map((video) => (
                    <button
                      key={video.videoId}
                      onClick={() => handleAddFromLibrary(video.videoId)}
                      className="w-full p-3 bg-bg-elevated rounded-lg border border-border hover:border-primary/50 transition-colors text-left flex items-center gap-3 group"
                    >
                      <div className="w-16 h-10 rounded bg-bg-base flex-shrink-0 overflow-hidden">
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-main truncate group-hover:text-primary transition-colors">
                          {video.title}
                        </p>
                        <p className="text-xs text-text-dim">
                          {video.duration}
                        </p>
                      </div>
                      <FontAwesomeIcon
                        icon={faPlus}
                        className="text-text-dim group-hover:text-primary"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted p-3 bg-bg-elevated rounded-lg text-center">
                  No saved videos available
                </p>
              )}
            </div>

            {/* From YouTube URL */}
            <div>
              <h4 className="text-sm font-medium text-text-main mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faYoutube} className="text-red-500" />
                From YouTube URL
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube URL..."
                  className="flex-1 px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleAddFromUrl}
                  disabled={!youtubeUrl.trim()}
                  className="btn-primary text-sm px-4"
                >
                  Add
                </button>
              </div>

              <p className="text-xs text-text-dim mt-2">
                The video will be analyzed before adding to your path
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Node List (Drag & Drop) */}
      {nodes.length > 0 ? (
        <Reorder.Group
          axis="y"
          values={nodes}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {nodes.map((node, index) => (
            <PathNodeItem
              key={node.id}
              node={node}
              index={index}
              onRemove={() => onRemoveVideo?.(node.id)}
              onComplete={() => onCompleteNode?.(node.id)}
              isLoading={isLoading}
            />
          ))}
        </Reorder.Group>
      ) : (
        <div className="text-center py-12 bg-bg-surface rounded-xl border border-dashed border-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-elevated flex items-center justify-center">
            <FontAwesomeIcon
              icon={faCodeBranch}
              className="text-2xl text-text-dim"
            />
          </div>
          <h3 className="text-lg font-medium text-text-main mb-2">
            No videos yet
          </h3>
          <p className="text-text-muted text-sm mb-4">
            Add videos to build your learning path
          </p>
          <button onClick={() => setShowAddPanel(true)} className="btn-primary">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add Your First Video
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Path Node Item (Draggable)
 */
const PathNodeItem = ({ node, index, onRemove, onComplete, isLoading }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={node}
      dragListener={false}
      dragControls={dragControls}
      className="group"
    >
      <motion.div
        className={`
          flex items-center gap-4 p-4 rounded-xl border transition-colors
          ${
            node.isCompleted
              ? "bg-green-500/5 border-green-500/20"
              : "bg-bg-surface border-border hover:border-primary/30"
          }
        `}
        layout
      >
        {/* Drag Handle */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1 text-text-dim hover:text-text-main"
        >
          <FontAwesomeIcon icon={faGripVertical} />
        </div>

        {/* Order Number */}
        <div
          className={`
          w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono
          ${
            node.isCompleted
              ? "bg-green-500/20 text-green-400"
              : "bg-bg-elevated text-text-muted"
          }
        `}
        >
          {node.isCompleted ? <FontAwesomeIcon icon={faCheck} /> : index + 1}
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-medium truncate ${node.isCompleted ? "text-text-muted line-through" : "text-text-main"}`}
          >
            {node.title}
          </h4>
          {node.notes && (
            <p className="text-xs text-text-dim mt-1 truncate">{node.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Watch on YouTube */}
          <a
            href={`https://www.youtube.com/watch?v=${node.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-bg-elevated hover:bg-bg-base text-text-muted hover:text-red-400 transition-colors"
            title="Watch on YouTube"
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm" />
          </a>

          {/* Mark Complete */}
          {!node.isCompleted && (
            <button
              onClick={onComplete}
              disabled={isLoading}
              className="p-2 rounded-lg bg-bg-elevated hover:bg-green-500/20 text-text-muted hover:text-green-400 transition-colors"
              title="Mark as complete"
            >
              <FontAwesomeIcon icon={faCheck} className="text-sm" />
            </button>
          )}

          {/* Remove */}
          <button
            onClick={onRemove}
            disabled={isLoading}
            className="p-2 rounded-lg bg-bg-elevated hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
            title="Remove from path"
          >
            <FontAwesomeIcon icon={faTrash} className="text-sm" />
          </button>
        </div>
      </motion.div>
    </Reorder.Item>
  );
};

export default PathBuilder;
