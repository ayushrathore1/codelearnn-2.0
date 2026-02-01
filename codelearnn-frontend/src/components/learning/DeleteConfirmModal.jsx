import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faExclamationTriangle,
  faTrash,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

/**
 * DeleteConfirmModal - Confirmation modal for destructive actions
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onConfirm: () => Promise<void>
 * - title: string
 * - message: string
 * - itemName: string (optional, for confirmation input)
 * - requireConfirmation: boolean (if true, requires typing item name)
 */

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName = null,
  requireConfirmation = false,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const canConfirm = !requireConfirmation || confirmText === itemName;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      setConfirmText("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText("");
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-bg-surface rounded-2xl border border-red-500/20 shadow-2xl w-full max-w-md pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="text-red-400"
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-text-main">
                    {title}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="p-2 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-main transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Error */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Message */}
                <p className="text-text-muted">{message}</p>

                {/* Confirmation Input */}
                {requireConfirmation && itemName && (
                  <div>
                    <label className="block text-sm text-text-muted mb-2">
                      Type{" "}
                      <span className="font-mono text-red-400">{itemName}</span>{" "}
                      to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={itemName}
                      className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-main placeholder:text-text-dim focus:border-red-500 focus:outline-none transition-colors"
                      disabled={isDeleting}
                      autoComplete="off"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isDeleting}
                    className="flex-1 btn-ghost py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isDeleting || !canConfirm}
                    className={`
                      flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors
                      ${
                        canConfirm
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-bg-elevated text-text-dim cursor-not-allowed"
                      }
                    `}
                  >
                    {isDeleting ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                        />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faTrash} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
