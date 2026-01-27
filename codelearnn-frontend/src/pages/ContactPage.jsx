import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faInstagram, faGithub, faYoutube, faLinkedin, faDiscord } from '@fortawesome/free-brands-svg-icons';
import ContactForm from '../components/forms/ContactForm';

const socialLinks = [
  { icon: faFacebook, href: '#', label: 'Facebook' },
  { icon: faTwitter, href: 'https://x.com/ayushrathore_27', label: 'Twitter' },
  { icon: faInstagram, href: 'https://www.instagram.com/ayush.rathore27', label: 'Instagram' },
  { icon: faGithub, href: 'https://github.com/ayushrathore1', label: 'GitHub' },
  { icon: faYoutube, href: '#', label: 'YouTube' },
  { icon: faLinkedin, href: '#', label: 'LinkedIn' },
  { icon: faDiscord, href: '#', label: 'Discord' }
];

const ContactPage = () => {
  return (
    <main className="bg-bg-base min-h-screen pt-24">
      {/* Hero Section */}
      <section className="section text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-primary font-mono text-sm mb-4">Get In Touch</p>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-main mb-6">
            Contact Us
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you!
          </p>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section className="section pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-bento p-8"
          >
            <h2 className="text-2xl font-heading font-bold text-text-main mb-6 flex items-center gap-3">
              <span className="text-primary font-mono text-lg">01.</span>
              Get In Touch
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 text-text-muted">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary text-xl mt-1" />
                <div>
                  <h4 className="text-text-main font-medium">Location</h4>
                  <p>Jaipur, Rajasthan, India</p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-text-muted">
                <FontAwesomeIcon icon={faEnvelope} className="text-primary text-xl mt-1" />
                <div>
                  <h4 className="text-text-main font-medium">Email</h4>
                  <p>engineeratcodelearnn@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 text-text-muted">
                <FontAwesomeIcon icon={faPhone} className="text-primary text-xl mt-1" />
                <div>
                  <h4 className="text-text-main font-medium">Phone</h4>
                  <p>+91 7488605560</p>
                  <p>+91 6377805448</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-8">
              <h3 className="text-text-main font-medium mb-4">Follow Us</h3>
              <div className="flex gap-3 flex-wrap">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-text-muted bg-bg-elevated border border-border hover:text-primary hover:border-primary hover:-translate-y-1 transition-all duration-200"
                  >
                    <FontAwesomeIcon icon={social.icon} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card-bento p-8"
          >
            <h2 className="text-2xl font-heading font-bold text-text-main mb-6 flex items-center gap-3">
              <span className="text-primary font-mono text-lg">02.</span>
              Send A Message
            </h2>
            <ContactForm />
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
