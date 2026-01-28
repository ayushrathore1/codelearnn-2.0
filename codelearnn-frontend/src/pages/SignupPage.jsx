import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    'Access structured learning paths',
    'Track your progress across paths',
    'Analyze unlimited YouTube tutorials',
    'Get personalized career guidance',
  ];

  return (
    <main className="min-h-screen flex selection:bg-primary selection:text-black">
      {/* Left Side - Brand */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-bg-surface border-r border-border flex-col justify-center px-16 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10" />
        </div>

        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <Link to="/" className="font-heading font-bold text-3xl text-text-main inline-block mb-8">
            <span className="text-primary">&lt;</span>
            CodeLearnn
            <span className="text-secondary">/&gt;</span>
          </Link>

          {/* Tagline */}
          <h1 className="text-h2 text-text-main mb-6">
            Start your<br />
            <span className="text-gradient-primary">learning journey</span>
          </h1>

          <p className="text-body text-text-muted mb-8">
            Join thousands of developers learning with structure, 
            visual understanding, and clear direction.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 text-text-muted"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="text-primary text-[10px]" />
                </div>
                <span>{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="mt-10 pt-8 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-bg-elevated border-2 border-bg-surface flex items-center justify-center text-xs text-text-dim"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-text-muted">
                <span className="text-text-main font-medium">1,000+</span> developers learning
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-bg-base"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="font-heading font-bold text-2xl text-text-main inline-block">
              <span className="text-primary">&lt;</span>
              CodeLearnn
              <span className="text-secondary">/&gt;</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-h3 text-text-main mb-2">Create your account</h2>
            <p className="text-text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary-glow transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-danger/10 border border-danger/30 text-danger text-sm p-4 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Social Signup */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <a 
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
              className="btn-secondary py-3 flex items-center justify-center gap-2 hover:bg-bg-elevated hover:text-main border-border text-text-muted transition-colors"
            >
              <FontAwesomeIcon icon={faGoogle} />
              Google
            </a>
            <button 
              disabled
              className="btn-secondary py-3 flex items-center justify-center gap-2 hover:bg-bg-elevated hover:text-main border-border text-text-muted transition-colors opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              <FontAwesomeIcon icon={faGithub} />
              GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text-dim text-sm">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm text-text-muted mb-2">Full name</label>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-text-muted mb-2">Email</label>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faEnvelope} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-text-muted mb-2">Password</label>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" 
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-11 bg-bg-surface border-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-text-main placeholder:text-text-dim"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-text-dim mt-1.5">Minimum 8 characters</p>
            </div>

            {/* Terms */}
            <p className="text-xs text-text-dim">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:text-primary-glow transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary hover:text-primary-glow transition-colors">Privacy Policy</Link>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_var(--primary-glow)] hover:shadow-[0_0_30px_-5px_var(--primary-glow)]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>
                  Create account
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
};

export default SignupPage;
