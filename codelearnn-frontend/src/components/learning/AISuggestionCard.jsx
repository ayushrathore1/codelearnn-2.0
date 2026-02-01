import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faLightbulb,
  faCheck,
  faTimes,
  faChevronDown,
  faChevronUp,
  faPlus,
  faCodeBranch,
  faExclamationTriangle,
  faSpinner,
  faPercent,
} from "@fortawesome/free-solid-svg-icons";

/**
 * AISuggestionCard Component
 *
 * Displays an AI suggestion with:
 * - Clear reasoning (explainability)
 * - Confidence indicator
 * - Accept/Reject actions
 * - Expandable details
 *
 * Props:
 * - suggestion: Suggestion object
 * - onAccept: (id, feedback?) => Promise<void>
 * - onReject: (id, feedback?) => Promise<void>
 * - onDismiss: (id) => Promise<void>
 */

const AISuggestionCard = ({
  suggestion,
  onAccept,
  onReject,
  onDismiss,
  isProcessing = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");

  const getSuggestionIcon = (type) => {
    switch (type) {
      case "add_video":
      case "add_skill_video":
      case "add_prerequisite":
        return { icon: faPlus, color: "text-green-400" };
      case "create_branch":
        return { icon: faCodeBranch, color: "text-cyan-400" };
      case "improve_coverage":
      case "next_step":
        return { icon: faLightbulb, color: "text-yellow-400" };
      case "career_alignment":
        return { icon: faRobot, color: "text-purple-400" };
      default:
        return { icon: faLightbulb, color: "text-primary" };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-orange-400";
  };

  const handleAccept = async () => {
    setProcessing("accept");
    try {
      await onAccept(suggestion._id, showFeedback ? feedback : null);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    setProcessing("reject");
    try {
      await onReject(suggestion._id, showFeedback ? feedback : null);
    } finally {
      setProcessing(null);
    }
  };

  const handleDismiss = async () => {
    setProcessing("dismiss");
    try {
      await onDismiss(suggestion._id);
    } finally {
      setProcessing(null);
    }
  };

  const { icon, color } = getSuggestionIcon(suggestion.suggestionType);
  const isAnyProcessing = isProcessing || processing;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-bg-surface border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
            w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0
            border border-border
          `}
          >
            <FontAwesomeIcon icon={icon} className={`text-lg ${color}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`px-2 py-0.5 rounded text-xs border ${getPriorityColor(suggestion.priority)}`}
              >
                {suggestion.priority}
              </span>
              <span
                className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
              >
                <FontAwesomeIcon
                  icon={faPercent}
                  className="mr-1 text-[10px]"
                />
                {Math.round(suggestion.confidence * 100)}% confident
              </span>
            </div>

            <p className="text-sm text-text-main font-medium">
              {suggestion.reasoning?.summary}
            </p>
          </div>

          {/* Expand button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-bg-elevated transition-colors text-text-dim"
          >
            <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
          </button>
        </div>

        {/* Suggested videos preview */}
        {suggestion.proposedChange?.suggestedVideos?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestion.proposedChange.suggestedVideos
              .slice(0, 2)
              .map((video, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-lg bg-bg-elevated text-xs text-text-muted truncate max-w-[200px]"
                >
                  {video.title}
                </span>
              ))}
            {suggestion.proposedChange.suggestedVideos.length > 2 && (
              <span className="px-2 py-1 rounded-lg bg-bg-elevated text-xs text-text-dim">
                +{suggestion.proposedChange.suggestedVideos.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/50 pt-4">
              {/* Reasoning details */}
              {suggestion.reasoning?.details?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                    Why this suggestion?
                  </h4>
                  <ul className="space-y-1">
                    {suggestion.reasoning.details.map((detail, i) => (
                      <li
                        key={i}
                        className="text-sm text-text-muted flex items-start gap-2"
                      >
                        <span className="text-primary mt-1">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data points */}
              {suggestion.reasoning?.dataPoints?.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {suggestion.reasoning.dataPoints.map((dp, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-lg bg-bg-elevated"
                    >
                      <span className="text-xs text-text-dim">{dp.label}</span>
                      <span className="text-sm font-medium text-text-main ml-2">
                        {dp.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* All suggested videos */}
              {suggestion.proposedChange?.suggestedVideos?.length > 2 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-text-dim mb-2 uppercase tracking-wider">
                    Suggested videos
                  </h4>
                  <div className="space-y-2">
                    {suggestion.proposedChange.suggestedVideos.map(
                      (video, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-bg-elevated flex items-center justify-between"
                        >
                          <span className="text-sm text-text-muted truncate">
                            {video.title}
                          </span>
                          <span className="text-xs text-green-400 flex-shrink-0 ml-2">
                            {Math.round(video.relevanceScore * 100)}% match
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Feedback toggle */}
              <div className="mb-4">
                <button
                  onClick={() => setShowFeedback(!showFeedback)}
                  className="text-xs text-text-dim hover:text-text-muted"
                >
                  {showFeedback ? "Hide feedback" : "Add feedback (optional)"}
                </button>

                {showFeedback && (
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us why you're accepting or rejecting..."
                    className="mt-2 w-full px-3 py-2 rounded-lg bg-bg-base border border-border text-sm text-text-main placeholder-text-dim focus:outline-none focus:border-primary resize-none"
                    rows={2}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={handleAccept}
          disabled={isAnyProcessing}
          className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {processing === "accept" ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} />
              Accept
            </>
          )}
        </button>

        <button
          onClick={handleReject}
          disabled={isAnyProcessing}
          className="px-4 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-muted font-medium text-sm flex items-center justify-center gap-2 hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {processing === "reject" ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <>
              <FontAwesomeIcon icon={faTimes} />
              Reject
            </>
          )}
        </button>

        <button
          onClick={handleDismiss}
          disabled={isAnyProcessing}
          className="px-3 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-dim text-sm hover:text-text-muted transition-colors disabled:opacity-50"
          title="Dismiss"
        >
          {processing === "dismiss" ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faExclamationTriangle} />
          )}
        </button>
      </div>
    </motion.div>
  );
};

/**
 * AISuggestionPanel Component
 *
 * Panel showing all AI suggestions for a path
 */
export const AISuggestionPanel = ({
  suggestions = [],
  onAccept,
  onReject,
  onDismiss,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin text-2xl text-primary mb-3"
        />
        <p className="text-text-muted">Loading AI suggestions...</p>
      </div>
    );
  }

  return (
    <div className="ai-suggestion-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
          <FontAwesomeIcon icon={faRobot} className="text-purple-400" />
          AI Suggestions
        </h3>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              "Get suggestions"
            )}
          </button>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-bg-surface border border-border">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-bg-elevated flex items-center justify-center">
            <FontAwesomeIcon
              icon={faLightbulb}
              className="text-xl text-text-dim"
            />
          </div>
          <p className="text-text-muted">No suggestions right now</p>
          <p className="text-sm text-text-dim mt-1">
            Keep learning, and I'll share ideas soon!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {suggestions.map((suggestion) => (
              <AISuggestionCard
                key={suggestion._id}
                suggestion={suggestion}
                onAccept={onAccept}
                onReject={onReject}
                onDismiss={onDismiss}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AISuggestionCard;
