import { test, expect } from "@playwright/test";

test.describe("UTM Tracking - Simple Tests", () => {
  test("UTM parameters should be stored in localStorage", async ({ page }) => {
    // Visit with Instagram UTM parameters
    await page.goto(
      "http://localhost:8080/?utm_source=instagram&utm_medium=social&utm_campaign=test&utm_content=bio_link",
    );

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify UTM parameters are stored in localStorage
    const utmParams = await page.evaluate(() => {
      const stored = localStorage.getItem("utm_params");
      return stored ? JSON.parse(stored) : {};
    });

    expect(utmParams).toEqual({
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "test",
      utm_content: "bio_link",
    });
  });

  test("Different UTM sources should be captured correctly", async ({ page }) => {
    const testCases = [
      {
        url: "http://localhost:8080/?utm_source=tiktok&utm_medium=social",
        expected: { utm_source: "tiktok", utm_medium: "social" },
      },
      {
        url: "http://localhost:8080/?utm_source=google&utm_medium=organic",
        expected: { utm_source: "google", utm_medium: "organic" },
      },
      {
        url: "http://localhost:8080/?utm_source=facebook&utm_medium=social",
        expected: { utm_source: "facebook", utm_medium: "social" },
      },
    ];

    for (const testCase of testCases) {
      // Clear localStorage
      await page.goto("http://localhost:8080");
      await page.evaluate(() => localStorage.clear());

      // Visit with UTM parameters
      await page.goto(testCase.url);
      await page.waitForLoadState("networkidle");

      // Verify UTM parameters are stored
      const utmParams = await page.evaluate(() => {
        const stored = localStorage.getItem("utm_params");
        return stored ? JSON.parse(stored) : {};
      });

      expect(utmParams).toEqual(testCase.expected);
    }
  });

  test("Direct traffic should have no UTM parameters", async ({ page }) => {
    // Visit without UTM parameters
    await page.goto("http://localhost:8080");
    await page.waitForLoadState("networkidle");

    // Verify no UTM parameters are stored
    const utmParams = await page.evaluate(() => {
      const stored = localStorage.getItem("utm_params");
      return stored ? JSON.parse(stored) : {};
    });

    expect(utmParams).toEqual({});
  });

  test("Landing page should be tracked", async ({ page }) => {
    // Visit with UTM parameters
    await page.goto("http://localhost:8080/?utm_source=instagram&utm_medium=social");
    await page.waitForLoadState("networkidle");

    // Verify landing page is stored
    const landingPage = await page.evaluate(() => {
      return localStorage.getItem("landing_page");
    });

    expect(landingPage).toBe("/");
  });
});
