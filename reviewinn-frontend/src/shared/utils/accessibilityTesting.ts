// Accessibility Testing Utilities for ReviewInn
// These utilities can be used during development to test accessibility

interface AccessibilityTestResult {
  passed: boolean;
  issue?: string;
  element?: string;
  recommendation?: string;
}

// Color contrast testing (simplified version)
export const testColorContrast = (
  foreground: string, 
  background: string, 
  requiredRatio: number = 4.5
): AccessibilityTestResult => {
  // This is a simplified implementation
  // In production, you'd use a proper color contrast library
  const mockRatio = 4.7; // Mock value for example
  
  return {
    passed: mockRatio >= requiredRatio,
    issue: mockRatio < requiredRatio ? 'Insufficient color contrast' : undefined,
    recommendation: mockRatio < requiredRatio ? 
      `Increase contrast ratio to at least ${requiredRatio}:1` : undefined
  };
};

// Test for missing alt attributes
export const testImageAltText = (container: HTMLElement): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = [];
  const images = container.querySelectorAll('img');
  
  images.forEach((img, index) => {
    const alt = img.getAttribute('alt');
    const isDecorative = img.getAttribute('aria-hidden') === 'true' || 
                        img.getAttribute('role') === 'presentation';
    
    if (!alt && !isDecorative) {
      results.push({
        passed: false,
        issue: `Image ${index + 1} missing alt attribute`,
        element: img.outerHTML.substring(0, 100) + '...',
        recommendation: 'Add descriptive alt text or mark as decorative with aria-hidden="true"'
      });
    } else {
      results.push({
        passed: true,
        element: `Image ${index + 1}`
      });
    }
  });
  
  return results;
};

// Test for proper heading hierarchy
export const testHeadingHierarchy = (container: HTMLElement): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = [];
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  
  if (headings.length === 0) {
    return [{
      passed: false,
      issue: 'No headings found',
      recommendation: 'Add proper heading structure for screen readers'
    }];
  }
  
  let previousLevel = 0;
  
  headings.forEach((heading, index) => {
    const currentLevel = parseInt(heading.tagName.charAt(1));
    
    if (index === 0 && currentLevel !== 1) {
      results.push({
        passed: false,
        issue: `First heading is ${heading.tagName}, should be H1`,
        element: heading.outerHTML.substring(0, 100) + '...',
        recommendation: 'Start with H1 or ensure proper heading hierarchy'
      });
    } else if (currentLevel > previousLevel + 1) {
      results.push({
        passed: false,
        issue: `Heading level jumps from H${previousLevel} to H${currentLevel}`,
        element: heading.outerHTML.substring(0, 100) + '...',
        recommendation: 'Don\'t skip heading levels'
      });
    } else {
      results.push({
        passed: true,
        element: `${heading.tagName}: ${heading.textContent?.substring(0, 30)}...`
      });
    }
    
    previousLevel = currentLevel;
  });
  
  return results;
};

// Test for buttons without accessible names
export const testButtonAccessibility = (container: HTMLElement): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = [];
  const buttons = container.querySelectorAll('button');
  
  buttons.forEach((button, index) => {
    const hasAriaLabel = button.hasAttribute('aria-label');
    const hasAriaLabelledBy = button.hasAttribute('aria-labelledby');
    const hasVisibleText = button.textContent?.trim();
    const hasTitle = button.hasAttribute('title');
    
    if (!hasAriaLabel && !hasAriaLabelledBy && !hasVisibleText && !hasTitle) {
      results.push({
        passed: false,
        issue: `Button ${index + 1} has no accessible name`,
        element: button.outerHTML.substring(0, 100) + '...',
        recommendation: 'Add aria-label, visible text, or aria-labelledby'
      });
    } else {
      results.push({
        passed: true,
        element: `Button ${index + 1}: ${hasAriaLabel ? button.getAttribute('aria-label') : button.textContent?.substring(0, 20)}`
      });
    }
  });
  
  return results;
};

// Test for form accessibility
export const testFormAccessibility = (container: HTMLElement): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = [];
  const formControls = container.querySelectorAll('input, select, textarea');
  
  formControls.forEach((control, index) => {
    const id = control.getAttribute('id');
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = control.hasAttribute('aria-label');
    const hasAriaLabelledBy = control.hasAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      results.push({
        passed: false,
        issue: `Form control ${index + 1} has no associated label`,
        element: control.outerHTML.substring(0, 100) + '...',
        recommendation: 'Associate with a label element or add aria-label'
      });
    } else {
      results.push({
        passed: true,
        element: `Form control ${index + 1}: ${control.tagName.toLowerCase()}`
      });
    }
  });
  
  return results;
};

// Test for landmark regions
export const testLandmarkRegions = (container: HTMLElement): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = [];
  const landmarks = ['header', 'nav', 'main', 'aside', 'footer'];
  const foundLandmarks = new Set();
  
  // Check for semantic HTML landmarks
  landmarks.forEach(landmark => {
    const elements = container.querySelectorAll(landmark);
    if (elements.length > 0) {
      foundLandmarks.add(landmark);
      results.push({
        passed: true,
        element: `<${landmark}> landmark found`
      });
    }
  });
  
  // Check for ARIA landmarks
  const ariaLandmarks = container.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]');
  ariaLandmarks.forEach(element => {
    const role = element.getAttribute('role');
    foundLandmarks.add(role);
    results.push({
      passed: true,
      element: `ARIA ${role} landmark found`
    });
  });
  
  // Check for essential landmarks
  if (!foundLandmarks.has('main') && !foundLandmarks.has('main')) {
    results.push({
      passed: false,
      issue: 'No main landmark found',
      recommendation: 'Add <main> element or role="main"'
    });
  }
  
  if (!foundLandmarks.has('header') && !foundLandmarks.has('banner')) {
    results.push({
      passed: false,
      issue: 'No header landmark found',
      recommendation: 'Add <header> element or role="banner"'
    });
  }
  
  return results;
};

// Test for focus management
export const testFocusManagement = (container: HTMLElement): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = [];
  const focusableElements = container.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
  );
  
  let visibleFocusableCount = 0;
  
  focusableElements.forEach((element, index) => {
    const isVisible = element.offsetParent !== null;
    const tabIndex = element.getAttribute('tabindex');
    
    if (isVisible) {
      visibleFocusableCount++;
    }
    
    if (tabIndex === '-1' && isVisible) {
      results.push({
        passed: false,
        issue: `Element ${index + 1} is visible but removed from tab order`,
        element: element.outerHTML.substring(0, 100) + '...',
        recommendation: 'Ensure visible interactive elements are keyboard accessible'
      });
    }
  });
  
  results.push({
    passed: visibleFocusableCount > 0,
    element: `Found ${visibleFocusableCount} focusable elements`,
    issue: visibleFocusableCount === 0 ? 'No focusable elements found' : undefined,
    recommendation: visibleFocusableCount === 0 ? 'Ensure interactive elements are keyboard accessible' : undefined
  });
  
  return results;
};

// Comprehensive accessibility audit
export const runAccessibilityAudit = (container: HTMLElement = document.body): {
  score: number;
  results: { [key: string]: AccessibilityTestResult[] };
  summary: string;
} => {
  const results = {
    images: testImageAltText(container),
    headings: testHeadingHierarchy(container),
    buttons: testButtonAccessibility(container),
    forms: testFormAccessibility(container),
    landmarks: testLandmarkRegions(container),
    focus: testFocusManagement(container)
  };
  
  // Calculate score
  let totalTests = 0;
  let passedTests = 0;
  
  Object.values(results).forEach(testResults => {
    testResults.forEach(result => {
      totalTests++;
      if (result.passed) passedTests++;
    });
  });
  
  const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  // Generate summary
  const failedTests = totalTests - passedTests;
  const summary = `
Accessibility Audit Results:
- Score: ${score}/100
- Total Tests: ${totalTests}
- Passed: ${passedTests}
- Failed: ${failedTests}

${failedTests > 0 ? 'Issues found that need attention.' : 'No accessibility issues detected!'}
  `.trim();
  
  return { score, results, summary };
};

// Console logging helper for development
export const logAccessibilityResults = (container?: HTMLElement): void => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Accessibility testing should only be used in development');
    return;
  }
  
  const audit = runAccessibilityAudit(container);
  
  console.group('🔍 Accessibility Audit Results');
  console.log(audit.summary);
  
  Object.entries(audit.results).forEach(([category, results]) => {
    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.group(`❌ ${category.toUpperCase()} (${failed.length} issues)`);
      failed.forEach(result => {
        console.warn(`Issue: ${result.issue}`);
        if (result.element) console.log(`Element: ${result.element}`);
        if (result.recommendation) console.log(`Fix: ${result.recommendation}`);
        console.log('---');
      });
      console.groupEnd();
    } else {
      console.log(`✅ ${category.toUpperCase()} - All tests passed`);
    }
  });
  
  console.groupEnd();
};

// Hook for React components
export const useAccessibilityTesting = () => {
  const testComponent = (elementRef: React.RefObject<HTMLElement>) => {
    if (elementRef.current) {
      return runAccessibilityAudit(elementRef.current);
    }
    return null;
  };
  
  const logComponentAccessibility = (elementRef: React.RefObject<HTMLElement>) => {
    if (elementRef.current) {
      logAccessibilityResults(elementRef.current);
    }
  };
  
  return { testComponent, logComponentAccessibility };
};