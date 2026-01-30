import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicyPage = () => {
  return (
    <div className="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-2 text-white">
          Privacy Policy
        </h1>
        <p className="text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <p className="mb-4">
              At Elytron, we value your privacy and are committed to protecting the personal information of users of our product CodeLearnn. This Privacy Policy explains how we collect, use, store, and safeguard your information when you access or use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="mb-4">We may collect the following types of information:</p>
            
            <h3 className="text-xl font-medium text-white mb-2">a. Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Profile details you voluntarily provide (skills, learning progress, projects, career interests)</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-2">b. Usage & Technical Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Device information</li>
              <li>Browser type</li>
              <li>IP address</li>
              <li>Pages visited, features used, and interactions on the platform</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-2">c. User-Generated Content</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Learning progress</li>
              <li>Saved learning paths</li>
              <li>Project submissions</li>
              <li>Skill assessments and scores</li>
              <li>Profile information used to generate your learning or career profile</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve the CodeLearnn platform</li>
              <li>Personalize learning paths and career recommendations</li>
              <li>Track learning progress and skill development</li>
              <li>Enable collaboration, project sharing, and profile creation</li>
              <li>Communicate important updates, support responses, or platform changes</li>
              <li>Ensure platform security and prevent misuse</li>
            </ul>
            <p className="mt-4 font-medium text-neon-green/80">We do not sell user data to third parties.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Content & External Resources</h2>
            <p>
              CodeLearnn structures and organizes publicly available learning resources (such as YouTube links and free internet content). We do not claim ownership over third-party content and are not responsible for external platforms’ privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage & Security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect user data from unauthorized access, loss, or misuse. However, no online system is completely secure, and users acknowledge this inherent risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. User Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Access or update your personal information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for data usage where applicable</li>
            </ul>
            <p>
              Requests can be made by contacting us at: <a href="mailto:engineeratcodelearnn@gmail.com" className="text-neon-green hover:underline">engineeratcodelearnn@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy as the platform evolves. Continued use of CodeLearnn after updates indicates acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Contact</h2>
            <p>
              For any privacy-related concerns, contact us at: <a href="mailto:engineeratcodelearnn@gmail.com" className="text-neon-green hover:underline">engineeratcodelearnn@gmail.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicyPage;
