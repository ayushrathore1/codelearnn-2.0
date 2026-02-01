import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHistory,
  faChevronDown,
  faChevronUp,
  faUndo,
  faCodeBranch,
  faPlus,
  faMinus,
  faEdit,
  faCheck,
  faRobot,
  faSpinner,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

/**
 * VersionHistory Component
 *
 * Displays the version history of a learning path with:
 * - Timeline view of changes
 * - Version comparison
 * - Restore to previous version
 *
 * Props:
 * - versions: Array of version objects
 * - onRestore: (versionNumber) => Promise<void>
 * - isLoading: boolean
 */

const VersionHistory = ({ versions = [], onRestore, isLoading = false }) => {
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);

  const getReasonIcon = (reason) => {
    switch (reason) {
      case "video_added":
        return { icon: faPlus, color: "text-green-400" };
      case "video_removed":
        return { icon: faMinus, color: "text-red-400" };
      case "reorder":
        return { icon: faCodeBranch, color: "text-blue-400" };
      case "node_completed":
        return { icon: faCheck, color: "text-emerald-400" };
      case "ai_suggestion":
        return { icon: faRobot, color: "text-purple-400" };
      case "branch_created":
        return { icon: faCodeBranch, color: "text-cyan-400" };
      case "user_edit":
      default:
        return { icon: faEdit, color: "text-yellow-400" };
    }
  };

  const getReasonLabel = (reason) => {
    return reason
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleRestore = async (versionNumber) => {
    setRestoring(versionNumber);
    try {
      await onRestore(versionNumber);
      setShowConfirm(null);
    } finally {
      setRestoring(null);
    }
  };

  if (isLoading && versions.length === 0) {
    return (
      <div className="p-6 text-center">
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin text-2xl text-primary mb-3"
        />
        <p className="text-text-muted">Loading version history...</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-bg-elevated flex items-center justify-center">
          <FontAwesomeIcon icon={faHistory} className="text-xl text-text-dim" />
        </div>
        <p className="text-text-muted">No version history yet</p>
        <p className="text-sm text-text-dim mt-1">
          Changes will be tracked here
        </p>
      </div>
    );
  }

  return (
    <div className="version-history">
      <h3 className="text-sm font-semibold text-text-main flex items-center gap-2 mb-4">
        <FontAwesomeIcon icon={faHistory} className="text-primary" />
        Version History
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />

        <div className="space-y-3">
          {versions.map((version, index) => {
            const { icon, color } = getReasonIcon(version.reason);
            const isExpanded = expandedVersion === version.versionNumber;
            const isLatest = index === 0;

            return (
              <motion.div
                key={version.versionNumber}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div
                  className={`
                  absolute left-0 w-6 h-6 rounded-full flex items-center justify-center
                  ${isLatest ? "bg-primary" : "bg-bg-elevated border border-border"}
                `}
                >
                  <FontAwesomeIcon
                    icon={icon}
                    className={`text-xs ${isLatest ? "text-white" : color}`}
                  />
                </div>

                {/* Content */}
                <div className="ml-10">
                  <button
                    onClick={() =>
                      setExpandedVersion(
                        isExpanded ? null : version.versionNumber,
                      )
                    }
                    className="w-full text-left p-3 rounded-lg bg-bg-surface border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-main">
                            v{version.versionNumber}
                          </span>
                          {isLatest && (
                            <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary">
                              Current
                            </span>
                          )}
                          {version.aiSuggestion && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                          {version.changeDescription ||
                            getReasonLabel(version.reason)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-dim">
                          {formatDate(version.createdAt)}
                        </span>
                        <FontAwesomeIcon
                          icon={isExpanded ? faChevronUp : faChevronDown}
                          className="text-text-dim text-xs"
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 rounded-lg bg-bg-elevated border border-border/50">
                          {/* Snapshot info */}
                          <div className="text-xs text-text-muted space-y-1">
                            <p>
                              <span className="text-text-dim">Nodes:</span>{" "}
                              {version.snapshot?.structureGraph?.nodes
                                ?.length || 0}
                            </p>
                            <p>
                              <span className="text-text-dim">Status:</span>{" "}
                              {version.snapshot?.status || "draft"}
                            </p>
                          </div>

                          {/* Delta info if available */}
                          {version.delta &&
                            (Object.keys(version.delta.addedNodes || [])
                              .length > 0 ||
                              Object.keys(version.delta.removedNodes || [])
                                .length > 0) && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-xs text-text-dim mb-2">
                                  Changes:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {version.delta.addedNodes?.map((id) => (
                                    <span
                                      key={id}
                                      className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400"
                                    >
                                      +1 node
                                    </span>
                                  ))}
                                  {version.delta.removedNodes?.map((id) => (
                                    <span
                                      key={id}
                                      className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-400"
                                    >
                                      -1 node
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Actions */}
                          {!isLatest && (
                            <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
                              {showConfirm === version.versionNumber ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleRestore(version.versionNumber)
                                    }
                                    disabled={
                                      restoring === version.versionNumber
                                    }
                                    className="flex-1 px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium flex items-center justify-center gap-1"
                                  >
                                    {restoring === version.versionNumber ? (
                                      <FontAwesomeIcon
                                        icon={faSpinner}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <>
                                        <FontAwesomeIcon icon={faCheck} />
                                        Confirm
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setShowConfirm(null)}
                                    className="px-3 py-2 rounded-lg bg-bg-base border border-border text-xs text-text-muted"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() =>
                                    setShowConfirm(version.versionNumber)
                                  }
                                  className="px-3 py-2 rounded-lg bg-bg-base border border-border hover:border-primary/50 text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                                >
                                  <FontAwesomeIcon icon={faUndo} />
                                  Restore to this version
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;
