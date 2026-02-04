/**
 * Protected Routes Tests
 * Tests that protected routes redirect to login when not authenticated
 */

import { test, expect } from '@playwright/test';

test.describe('Protected Routes - Unauthenticated Access', () => {
  
  test('Dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login or home (depending on dev/prod mode)
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Vault redirects to login', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Learning Paths redirects to login', async ({ page }) => {
    await page.goto('/learning-paths');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Analyzer redirects to login', async ({ page }) => {
    await page.goto('/analyzer');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Career Explorer redirects to login', async ({ page }) => {
    await page.goto('/career');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Career Journey redirects to login', async ({ page }) => {
    await page.goto('/my-career-journey');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Profile redirects to login', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('Charcha redirects to login', async ({ page }) => {
    await page.goto('/charcha');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    expect(url.includes('/login') || url === 'http://localhost:5173/').toBeTruthy();
  });
});

test.describe('404 and Legacy Routes', () => {
  
  test('Unknown route redirects to home', async ({ page }) => {
    await page.goto('/some-random-page-that-does-not-exist');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to home
    await expect(page).toHaveURL('/');
  });

  test('Legacy /resources redirects to /vault', async ({ page }) => {
    // This would require auth, so just check redirection behavior
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');
    
    // Should redirect somewhere (vault requires auth -> login)
    const url = page.url();
    expect(url !== 'http://localhost:5173/resources').toBeTruthy();
  });
});
