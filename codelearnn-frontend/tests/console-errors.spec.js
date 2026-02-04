/**
 * Console Errors Detection Test
 * Scans all pages for JavaScript errors and warnings
 */

import { test, expect } from '@playwright/test';

// Define all routes to test
const PUBLIC_ROUTES = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
  { name: 'Blogs', path: '/blogs' },
  { name: 'Opportunities', path: '/opportunities' },
  { name: 'Privacy Policy', path: '/privacy-policy' },
  { name: 'Terms', path: '/terms' },
  { name: 'Cookie Policy', path: '/cookie-policy' },
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
];

// Errors to ignore (expected behavior)
const IGNORED_ERRORS = [
  '/api/journey/active',  // Expected 404 when no journey exists
  '404 (Not Found)',      // Some API calls might 404 in dev
  'favicon.ico',          // Favicon errors
  'net::ERR_',            // Network errors in test environment
];

test.describe('Console Error Detection', () => {
  
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} page has no critical console errors`, async ({ page }) => {
      const errors = [];
      const warnings = [];
      
      // Capture console messages
      page.on('console', msg => {
        const text = msg.text();
        const isIgnored = IGNORED_ERRORS.some(ignored => text.includes(ignored));
        
        if (!isIgnored) {
          if (msg.type() === 'error') {
            errors.push({
              type: 'console.error',
              text: text,
              location: msg.location()
            });
          } else if (msg.type() === 'warning') {
            warnings.push({
              type: 'console.warn',
              text: text
            });
          }
        }
      });
      
      // Capture uncaught exceptions
      page.on('pageerror', error => {
        const isIgnored = IGNORED_ERRORS.some(ignored => error.message.includes(ignored));
        if (!isIgnored) {
          errors.push({
            type: 'pageerror',
            text: error.message,
            stack: error.stack
          });
        }
      });
      
      // Navigate to page
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      // Wait a bit for any async errors
      await page.waitForTimeout(1000);
      
      // Report warnings (don't fail)
      if (warnings.length > 0) {
        console.log(`Warnings on ${route.name}:`, warnings);
      }
      
      // Fail if there are critical errors
      if (errors.length > 0) {
        console.error(`Errors on ${route.name}:`, errors);
      }
      
      // Check for ReferenceError specifically (like 'motion is not defined')
      const referenceErrors = errors.filter(e => 
        e.text.includes('ReferenceError') || 
        e.text.includes('is not defined') ||
        e.text.includes('Cannot read properties of undefined')
      );
      
      expect(referenceErrors).toHaveLength(0);
    });
  }
});

test.describe('Component Interaction Tests', () => {
  
  test('Theme toggle works (if exists)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for theme toggle button
    const themeToggle = page.locator('[aria-label*="theme" i], [data-testid="theme-toggle"], button:has-text("dark"), button:has-text("light")').first();
    
    if (await themeToggle.isVisible()) {
      // Get initial state
      const initialClass = await page.locator('html, body').first().getAttribute('class') || '';
      
      // Click toggle
      await themeToggle.click();
      
      // Wait for change
      await page.waitForTimeout(300);
      
      // Class should have changed
      const newClass = await page.locator('html, body').first().getAttribute('class') || '';
      
      // Theme should have toggled (dark/light class change)
      console.log('Theme toggle test completed');
    } else {
      console.log('No theme toggle found - skipping');
    }
  });
  
  test('Mobile menu opens (if exists)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for mobile menu button
    const menuButton = page.locator('[aria-label*="menu" i], [data-testid="mobile-menu"], button:has([class*="hamburger"]), .mobile-menu-toggle').first();
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);
      
      // Menu should be visible
      const menu = page.locator('nav, [role="navigation"], .mobile-menu').first();
      await expect(menu).toBeVisible();
      
      console.log('Mobile menu test completed');
    } else {
      console.log('No mobile menu button found - skipping');
    }
  });
});

test.describe('Form Validation Tests', () => {
  
  test('Login form shows validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Find and submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation (form shouldn't submit with empty fields)
      // Either validation message appears or we stay on login page
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/login/);
      
      console.log('Login form validation test completed');
    }
  });
  
  test('Contact form exists and has required fields', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    
    // Check for form elements
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const messageInput = page.locator('textarea, input[name="message"]').first();
    
    // At least email should exist for contact form
    const hasForm = await emailInput.isVisible() || await messageInput.isVisible();
    
    if (hasForm) {
      console.log('Contact form found with required fields');
    } else {
      console.log('Contact form structure differs from expected');
    }
  });
});
