import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Enterprise SEO & Head Meta Manager Component
 * Ensures every route has unique, keyword-optimized titles, meta descriptions,
 * canonical URLs, Open Graph tags, and optional structured JSON-LD data.
 */
export default function SEO({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  schema,
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Update Document Title
    const baseTitle = 'SmartSpend — FinTech & Personal Wealth Platform';
    document.title = title ? `${title} | SmartSpend` : baseTitle;

    // 2. Helper to set/update meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Helper for link tag (e.g. canonical)
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 4. Update Meta Tags
    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
      setMetaTag('name', 'twitter:description', description);
    }

    if (title) {
      setMetaTag('property', 'og:title', `${title} | SmartSpend`);
      setMetaTag('name', 'twitter:title', `${title} | SmartSpend`);
    }

    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', window.location.href);

    const canonicalUrl = canonical || `https://smartspend.io${location.pathname}`;
    setLinkTag('canonical', canonicalUrl);

    // 5. Inject Page-Level JSON-LD Schema if provided
    let scriptElement = null;
    if (schema) {
      // Remove any previously injected page-json-ld script
      const existing = document.getElementById('page-json-ld');
      if (existing) existing.remove();

      scriptElement = document.createElement('script');
      scriptElement.type = 'application/ld+json';
      scriptElement.id = 'page-json-ld';
      scriptElement.text = JSON.stringify(schema);
      document.head.appendChild(scriptElement);
    }

    return () => {
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, [title, description, keywords, canonical, ogType, schema, location.pathname]);

  return null;
}
