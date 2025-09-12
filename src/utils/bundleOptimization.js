// Bundle optimization utilities for reducing initial load size

// Lazy load components to reduce initial bundle size
export const lazyLoadComponent = (importFunc, fallback = null) => {
  return React.lazy(() => 
    importFunc().catch(err => {
      console.warn('Component lazy load failed:', err);
      // Return a fallback component if main component fails to load
      return { default: fallback || (() => <div>Component unavailable</div>) };
    })
  );
};

// Preload critical resources based on user interaction
export const preloadCriticalResources = () => {
  const criticalRoutes = ['/home', '/login', '/signup'];
  
  criticalRoutes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
};

// Remove unused CSS and optimize styles
export const optimizeStyles = () => {
  // Remove unused CSS classes (basic implementation)
  const stylesheets = document.querySelectorAll('style, link[rel="stylesheet"]');
  const usedClasses = new Set();
  
  // Collect all used classes
  document.querySelectorAll('*').forEach(el => {
    if (el.className) {
      el.className.split(' ').forEach(cls => {
        if (cls.trim()) usedClasses.add(cls.trim());
      });
    }
  });
  
  console.log(`Found ${usedClasses.size} used CSS classes`);
  return usedClasses;
};

// Minimize JavaScript execution on slow connections
export const conditionallyLoadFeatures = (connectionType) => {
  const heavyFeatures = {
    animations: ['framer-motion'],
    charts: ['chart.js', 'recharts'],
    richText: ['quill', 'draft-js']
  };
  
  const slowConnections = ['slow-2g', '2g'];
  
  if (slowConnections.includes(connectionType)) {
    console.log('Slow connection detected, disabling heavy features');
    return {
      enableAnimations: false,
      enableCharts: false,
      enableRichText: false,
      reducedMotion: true
    };
  }
  
  return {
    enableAnimations: true,
    enableCharts: true,
    enableRichText: true,
    reducedMotion: false
  };
};

// Tree shake unused imports (development helper)
export const analyzeUnusedImports = () => {
  const importStatements = [];
  const scripts = document.querySelectorAll('script[type="module"]');
  
  scripts.forEach(script => {
    if (script.src) {
      fetch(script.src)
        .then(response => response.text())
        .then(code => {
          const imports = code.match(/import\s+.*?\s+from\s+['"][^'"]+['"]/g);
          if (imports) {
            importStatements.push(...imports);
          }
        })
        .catch(err => console.warn('Could not analyze script:', err));
    }
  });
  
  return importStatements;
};

// Compress and minify inline styles
export const compressInlineStyles = () => {
  const styleElements = document.querySelectorAll('style');
  
  styleElements.forEach(style => {
    if (style.textContent) {
      // Basic CSS minification
      const minified = style.textContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
        .replace(/\s*{\s*/g, '{') // Clean braces
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';')
        .trim();
      
      style.textContent = minified;
    }
  });
};

// Initialize bundle optimizations
export const initBundleOptimizations = (connectionType = 'unknown') => {
  const features = conditionallyLoadFeatures(connectionType);
  
  // Apply optimizations based on connection
  if (features.reducedMotion) {
    document.documentElement.style.setProperty('--animation-duration', '0s');
    document.documentElement.style.setProperty('--transition-duration', '0s');
  }
  
  // Compress inline styles
  compressInlineStyles();
  
  // Preload critical resources on good connections
  if (!['slow-2g', '2g'].includes(connectionType)) {
    setTimeout(preloadCriticalResources, 2000);
  }
  
  return features;
};
