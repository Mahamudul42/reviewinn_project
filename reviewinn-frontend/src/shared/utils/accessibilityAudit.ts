// Accessibility Audit Report for ReviewInn
// This file documents accessibility issues found and provides fixes

export interface AccessibilityIssue {
  component: string;
  severity: 'critical' | 'major' | 'minor';
  wcagLevel: 'A' | 'AA' | 'AAA';
  issue: string;
  solution: string;
  codeExample?: string;
}

export const accessibilityAuditResults: AccessibilityIssue[] = [
  // Critical Issues (Must Fix)
  {
    component: 'ReviewCardHeader',
    severity: 'critical',
    wcagLevel: 'A',
    issue: 'Menu button has no accessible name',
    solution: 'Add aria-label to describe the button purpose',
    codeExample: `<button aria-label="Review options menu" onClick={...}>`
  },
  {
    component: 'ReviewCardHeader', 
    severity: 'critical',
    wcagLevel: 'A',
    issue: 'Hide button has insufficient accessible name',
    solution: 'Replace title with aria-label and add screen reader text',
    codeExample: `<button aria-label="Hide this review" onClick={onHide}>`
  },
  {
    component: 'ReviewCardHeader',
    severity: 'major',
    wcagLevel: 'AA',
    issue: 'Verified badge has no screen reader description',
    solution: 'Add aria-label to verification indicator',
    codeExample: `<span aria-label="Verified reviewer" className="...">`
  },

  // Major Issues (Should Fix)
  {
    component: 'PageLoader',
    severity: 'major', 
    wcagLevel: 'A',
    issue: 'Reload buttons lack descriptive text',
    solution: 'Add specific aria-labels explaining what will reload',
    codeExample: `<button aria-label="Reload page to retry loading content">`
  },
  {
    component: 'ProgressSection',
    severity: 'major',
    wcagLevel: 'A', 
    issue: 'Review button context unclear for screen readers',
    solution: 'Add aria-describedby or more specific button text',
    codeExample: `<button aria-label="Leave a review for this entity">`
  },

  // Minor Issues (Nice to Fix)
  {
    component: 'ClaimedBadge',
    severity: 'minor',
    wcagLevel: 'AA',
    issue: 'Badge meaning may not be clear to screen readers',
    solution: 'Add aria-label explaining what "claimed" means',
    codeExample: `<span aria-label="Business owner verified">`
  }
];

// Audit scoring
export const calculateAccessibilityScore = (): number => {
  const weights = { critical: 20, major: 10, minor: 2 };
  const totalDeductions = accessibilityAuditResults.reduce(
    (sum, issue) => sum + weights[issue.severity], 0
  );
  return Math.max(0, 100 - totalDeductions);
};

// Generate accessibility report
export const generateAccessibilityReport = (): string => {
  const score = calculateAccessibilityScore();
  const criticalCount = accessibilityAuditResults.filter(i => i.severity === 'critical').length;
  const majorCount = accessibilityAuditResults.filter(i => i.severity === 'major').length;
  const minorCount = accessibilityAuditResults.filter(i => i.severity === 'minor').length;

  return `
Accessibility Audit Report - ReviewInn
=====================================

Overall Score: ${score}/100

Issue Summary:
- Critical Issues: ${criticalCount} (Must fix for WCAG compliance)
- Major Issues: ${majorCount} (Important for usability)  
- Minor Issues: ${minorCount} (Nice to have)

WCAG 2.1 Compliance:
- Level A: ${criticalCount === 0 ? '✅ Passing' : '❌ Failing'}  
- Level AA: ${criticalCount === 0 && majorCount === 0 ? '✅ Passing' : '❌ Failing'}
- Level AAA: ${accessibilityAuditResults.length === 0 ? '✅ Passing' : '❌ Failing'}

Recommendations:
1. Fix all critical issues immediately
2. Address major issues in next iteration
3. Consider minor issues for future improvements
  `;
};

// Validation helpers
export const validateAccessibilityAttributes = (element: HTMLElement): string[] => {
  const issues: string[] = [];
  
  // Check for missing alt text on images
  const images = element.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      issues.push(`Image ${index + 1} missing alt attribute`);
    }
  });
  
  // Check for buttons without accessible names
  const buttons = element.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const hasAriaLabel = button.hasAttribute('aria-label');
    const hasAriaLabelledBy = button.hasAttribute('aria-labelledby'); 
    const hasVisibleText = button.textContent?.trim();
    
    if (!hasAriaLabel && !hasAriaLabelledBy && !hasVisibleText) {
      issues.push(`Button ${index + 1} has no accessible name`);
    }
  });
  
  // Check for form controls without labels
  const formControls = element.querySelectorAll('input, select, textarea');
  formControls.forEach((control, index) => {
    const hasLabel = document.querySelector(`label[for="${control.id}"]`);
    const hasAriaLabel = control.hasAttribute('aria-label');
    const hasAriaLabelledBy = control.hasAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push(`Form control ${index + 1} has no associated label`);
    }
  });
  
  return issues;
};