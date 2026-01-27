import { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faCog, 
  faSignOutAlt, 
  faCamera,
  faEnvelope,
  faShieldAlt,
  faChartLine,
  faAward,
  faFire,
  faHistory,
  faBookOpen,
  faCheckCircle,
  faLock,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

// Security Tab Component with Password Change
const SecurityTab = ({ user }) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.updatePassword({
        currentPassword,
        newPassword
      });
      setSuccess('Password updated successfully!');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user signed up via OAuth (no password set)
  const isOAuthUser = user?.googleId || user?.githubId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card-bento p-8"
    >
      <h3 className="text-xl font-bold text-text-main mb-6">Security Settings</h3>
      
      {isOAuthUser && !user?.hasPassword && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm p-4 rounded-lg mb-6">
          <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
          You signed in with {user?.googleId ? 'Google' : 'GitHub'}. Password login is not available for OAuth accounts.
        </div>
      )}

      <div className="space-y-6 max-w-xl">
        {!showChangePassword ? (
          <>
            <p className="text-sm text-text-muted">Manage your password and security preferences.</p>
            <button 
              onClick={() => setShowChangePassword(true)}
              className="btn-secondary px-6 py-2"
              disabled={isOAuthUser && !user?.hasPassword}
            >
              <FontAwesomeIcon icon={faLock} className="mr-2" />
              Change Password
            </button>
          </>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm p-3 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Current Password</label>
              <div className="relative">
                <input 
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 pr-12 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main"
                >
                  <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">New Password</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 pr-12 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main"
                >
                  <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              <p className="text-xs text-text-dim mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Confirm New Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false);
                  setError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock user data if not available
  const userData = user || {
    name: 'Alex Developer',
    email: 'alex@example.com',
    joinDate: 'January 2025',
    avatar: null,
    stats: {
      xp: 1250,
      streak: 5,
      completedLessons: 24,
      hoursLearning: 18
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: faChartLine },
    { id: 'settings', label: 'Settings', icon: faCog },
    { id: 'security', label: 'Security', icon: faShieldAlt },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6 bg-bg-base">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="grid lg:grid-cols-4 gap-8"
        >
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="card-bento p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
              
              <div className="relative z-10 mt-8">
                <div className="w-24 h-24 rounded-full bg-bg-elevated border-4 border-bg-base mx-auto mb-4 flex items-center justify-center relative group cursor-pointer">
                  {userData.avatar ? (
                    <img src={userData.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="text-3xl text-text-dim" />
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <FontAwesomeIcon icon={faCamera} className="text-white" />
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-text-main mb-1">{userData.name}</h2>
                <p className="text-sm text-text-muted mb-4">{userData.email}</p>
                
                <div className="flex items-center justify-center gap-2 text-xs text-text-dim mb-6">
                  <span>Joined {userData.joinDate}</span>
                </div>

                <div className="w-full h-px bg-border mb-6"></div>

                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-text-muted hover:text-text-main hover:bg-bg-elevated'
                      }`}
                    >
                      <FontAwesomeIcon icon={tab.icon} />
                      {tab.label}
                    </button>
                  ))}
                  
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red hover:bg-red/10 border border-transparent hover:border-red/20 transition-all mt-4"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    Sign Out
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total XP', value: userData.stats?.xp, icon: faAward, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                    { label: 'Day Streak', value: userData.stats?.streak, icon: faFire, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { label: 'Lessons', value: userData.stats?.completedLessons, icon: faCheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Hours', value: userData.stats?.hoursLearning, icon: faHistory, color: 'text-secondary', bg: 'bg-secondary/10' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="card-bento p-4 flex items-center gap-4"
                    >
                      <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl`}>
                        <FontAwesomeIcon icon={stat.icon} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-text-main">{stat.value}</div>
                        <div className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Progress Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="card-bento p-6"
                >
                  <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBookOpen} className="text-primary" />
                    Current Progress
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-text-main">Full Stack Developer Path</span>
                            <span className="text-xs text-primary">65% Complete</span>
                      </div>
                      <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[65%] rounded-full"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-text-main">React Advanced Patterns</span>
                        <span className="text-xs text-secondary">32% Complete</span>
                      </div>
                      <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-[32%] rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-bento p-8"
              >
                <h3 className="text-xl font-bold text-text-main mb-6">Account Settings</h3>
                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Display Name</label>
                    <input 
                      type="text" 
                      defaultValue={userData.name}
                      className="w-full bg-bg-base border border-border rounded-lg px-4 py-3 text-text-main focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Email Address</label>
                    <div className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-text-dim flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="text-text-dim" />
                      <span>{userData.email}</span>
                      <span className="ml-auto text-xs text-text-dim bg-bg-base px-2 py-1 rounded">Cannot be changed</span>
                    </div>
                    <p className="text-xs text-text-dim mt-1">Email address cannot be changed for security reasons.</p>
                  </div>
                  <div className="pt-4">
                    <button className="btn-primary px-6 py-2">Save Changes</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <SecurityTab user={userData} />
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default ProfilePage;
