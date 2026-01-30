import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  type = 'website',
  canonicalUrl,
  jsonLd 
}) => {
  const location = useLocation();
  const baseUrl = 'https://codelearnn.com';
  const currentUrl = canonicalUrl || `${baseUrl}${location.pathname}`;
  const defaultImage = `${baseUrl}/og-image.jpg`; // Ensure you have this image in public/
  
  const siteTitle = 'CodeLearnn - The Learning Operating System for Engineering Students';
  const fullTitle = title ? `${title} | CodeLearnn` : siteTitle;
  const metaDescription = description || 'Stop learning random tutorials. Start building a real engineering career with structured learning paths, AI-powered roadmaps, and career intelligence.';

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content="CodeLearnn" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@ayushrathore_27" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image || defaultImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
      
      {/* Default Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "CodeLearnn",
          "url": baseUrl,
          "logo": `${baseUrl}/logo.png`,
          "sameAs": [
            "https://x.com/ayushrathore_27",
            "https://www.linkedin.com/in/ayushrathore1",
            "https://github.com/ayushrathore1"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "engineeratcodelearnn@gmail.com",
            "contactType": "customer support"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
