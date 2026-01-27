import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faImage,
  faTags,
  faLink,
  faBuilding,
  faMapMarkerAlt,
  faCalendar,
  faMoneyBill,
  faUserGraduate,
  faCode,
  faGraduationCap,
  faBriefcase,
  faTrophy,
  faGift,
  faRocket,
  faSpinner,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { opportunitiesAPI } from '../../services/api';

const types = [
  { id: 'hackathon', label: 'Hackathon', icon: faCode },
  { id: 'fellowship', label: 'Fellowship', icon: faGraduationCap },
  { id: 'internship', label: 'Internship', icon: faBriefcase },
  { id: 'job', label: 'Job', icon: faBriefcase },
  { id: 'scholarship', label: 'Scholarship', icon: faGift },
  { id: 'competition', label: 'Competition', icon: faTrophy },
  { id: 'other', label: 'Other', icon: faRocket }
];

const CreateOpportunityModal = ({ onClose, onCreated, editOpportunity = null }) => {
  const [formData, setFormData] = useState({
    title: editOpportunity?.title || '',
    description: editOpportunity?.description || '',
    type: editOpportunity?.type || 'hackathon',
    organization: editOpportunity?.organization || '',
    link: editOpportunity?.link || '',
    deadline: editOpportunity?.deadline ? new Date(editOpportunity.deadline).toISOString().split('T')[0] : '',
    startDate: editOpportunity?.startDate ? new Date(editOpportunity.startDate).toISOString().split('T')[0] : '',
    endDate: editOpportunity?.endDate ? new Date(editOpportunity.endDate).toISOString().split('T')[0] : '',
    stipend: editOpportunity?.stipend || '',
    location: editOpportunity?.location || 'Remote',
    eligibility: editOpportunity?.eligibility?.join('\n') || '',
    tags: editOpportunity?.tags?.join(', ') || '',
    coverImage: editOpportunity?.coverImage || '',
    featured: editOpportunity?.featured || false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please add a title');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Please add a description');
      return;
    }

    if (!formData.link.trim()) {
      setError('Please add an application link');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = {
        ...formData,
        eligibility: formData.eligibility.split('\n').map(e => e.trim()).filter(Boolean),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        deadline: formData.deadline || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };

      if (editOpportunity) {
        await opportunitiesAPI.update(editOpportunity._id, data);
      } else {
        await opportunitiesAPI.create(data);
      }

      onCreated();
    } catch (err) {
      console.error('Opportunity submit error:', err);
      setError(err.response?.data?.message || 'Failed to save opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-elevated rounded-2xl border border-border shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-bg-elevated border-b border-border">
            <h2 className="font-heading text-xl font-semibold text-text-main">
              {editOpportunity ? 'Edit Opportunity' : 'Post an Opportunity'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-base transition-all"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Google Summer of Code 2026"
                className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {types.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
                      formData.type === type.id
                        ? 'bg-gradient-to-r from-secondary to-primary text-bg-base'
                        : 'bg-bg-base border border-border text-text-muted hover:text-secondary hover:border-secondary/50'
                    }`}
                  >
                    <FontAwesomeIcon icon={type.icon} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Organization & Link */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  <FontAwesomeIcon icon={faBuilding} className="mr-2" />
                  Organization
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="e.g., Google"
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  <FontAwesomeIcon icon={faLink} className="mr-2" />
                  Application Link *
                </label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
            </div>

            {/* Location & Stipend */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Remote, Hybrid, or City"
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
                  Stipend/Prize
                </label>
                <input
                  type="text"
                  name="stipend"
                  value={formData.stipend}
                  onChange={handleChange}
                  placeholder="e.g., ₹50,000 or Unpaid"
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the opportunity... (HTML supported)"
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all resize-none"
              />
            </div>

            {/* Eligibility */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">
                <FontAwesomeIcon icon={faUserGraduate} className="mr-2" />
                Eligibility (one per line)
              </label>
              <textarea
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                placeholder="Open to all students&#10;Must be 18+&#10;Enrolled in university"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all resize-none"
              />
            </div>

            {/* Tags & Cover Image */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  <FontAwesomeIcon icon={faTags} className="mr-2" />
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="AI, ML, Web Dev"
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-text-muted text-sm font-medium mb-2">
                  <FontAwesomeIcon icon={faImage} className="mr-2" />
                  Cover Image URL
                </label>
                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border text-text-main placeholder:text-text-dim focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-secondary to-primary text-bg-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  {editOpportunity ? 'Updating...' : 'Posting...'}
                </>
              ) : (
                editOpportunity ? 'Update Opportunity' : 'Post Opportunity'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateOpportunityModal;
