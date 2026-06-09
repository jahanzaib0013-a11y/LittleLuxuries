import { test, expect } from "@playwright/test";

test.describe("UTM Tracking System", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("http://localhost:8080");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test("Instagram UTM parameters should be captured and stored", async ({ page }) => {
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

    // Navigate to products and add to cart
    await page.click('a[href="/products"]');
    await page.waitForLoadState("networkidle");

    // Click on first product
    await page.click(".product-card:first-child");
    await page.waitForLoadState("networkidle");

    // Add to cart
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(1000);

    // Go to checkout
    await page.click('button:has-text("Checkout")');
    await page.waitForLoadState("networkidle");

    // Fill checkout form
    await page.fill('input[name="firstName"]', "Test");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="email"]', "test.instagram@example.com");
    await page.fill('input[name="phone"]', "+1-555-0123");
    await page.fill('input[name="streetAddress"]', "123 Test St");
    await page.fill('input[name="city"]', "Test City");
    await page.fill('input[name="postalCode"]', "12345");

    // Select referral source
    await page.click('select[name="referralSource"]');
    await page.click('option[value="instagram_ad"]');

    // Place order
    await page.click('button:has-text("Place Order")');
    await page.waitForLoadState("networkidle");

    // Verify order success
    await expect(page.locator("text=Order placed successfully")).toBeVisible();
  });

  test("TikTok UTM parameters should be captured and stored", async ({ page }) => {
    // Visit with TikTok UTM parameters
    await page.goto(
      "http://localhost:8080/?utm_source=tiktok&utm_medium=social&utm_campaign=tiktok_test&utm_content=dance_video",
    );

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify UTM parameters are stored in localStorage
    const utmParams = await page.evaluate(() => {
      const stored = localStorage.getItem("utm_params");
      return stored ? JSON.parse(stored) : {};
    });

    expect(utmParams).toEqual({
      utm_source: "tiktok",
      utm_medium: "social",
      utm_campaign: "tiktok_test",
      utm_content: "dance_video",
    });

    // Verify landing page is stored
    const landingPage = await page.evaluate(() => {
      return localStorage.getItem("landing_page");
    });
    expect(landingPage).toBe("/");
  });

  test("Google organic UTM parameters should be captured and stored", async ({ page }) => {
    // Visit with Google UTM parameters
    await page.goto(
      "http://localhost:8080/?utm_source=google&utm_medium=organic&utm_campaign=seo&utm_content=search_result",
    );

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify UTM parameters are stored in localStorage
    const utmParams = await page.evaluate(() => {
      const stored = localStorage.getItem("utm_params");
      return stored ? JSON.parse(stored) : {};
    });

    expect(utmParams).toEqual({
      utm_source: "google",
      utm_medium: "organic",
      utm_campaign: "seo",
      utm_content: "search_result",
    });
  });

  test("Analytics dashboard should show acquisition sources", async ({ page }) => {
    // First, create some test data by visiting with UTM parameters
    const testUrls = [
      "http://localhost:8080/?utm_source=instagram&utm_medium=social&utm_campaign=test1",
      "http://localhost:8080/?utm_source=tiktok&utm_medium=social&utm_campaign=test2",
      "http://localhost:8080/?utm_source=google&utm_medium=organic&utm_campaign=test3",
    ];

    for (const url of testUrls) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // Simulate completing checkout (simplified for test)
      await page.evaluate(() => {
        // Simulate the acquisition data that would be saved
        const acquisitionData = {
          acquisition_source: url.includes("instagram")
            ? "social"
            : url.includes("tiktok")
              ? "social"
              : "organic_search",
          acquisition_channel: url.includes("instagram")
            ? "instagram"
            : url.includes("tiktok")
              ? "tiktok"
              : "google",
          utm_source: new URL(url).searchParams.get("utm_source"),
          utm_medium: new URL(url).searchParams.get("utm_medium"),
          utm_campaign: new URL(url).searchParams.get("utm_campaign"),
          referral_source: "test_referral",
        };

        // Store in localStorage for analytics to read
        localStorage.setItem("test_acquisition_data", JSON.stringify(acquisitionData));
      });
    }

    // Navigate to analytics page
    await page.goto("http://localhost:8080/analytics");
    await page.waitForLoadState("networkidle");

    // Wait for analytics to load
    await page.waitForTimeout(2000);

    // Verify analytics page loads
    await expect(page.locator('h1:has-text("Analytics")')).toBeVisible();

    // Check if acquisition chart is present
    const acquisitionChart = page.locator(
      '[data-testid="customer-acquisition-chart"], .acquisition-chart, text:has-text("Customer Acquisition")',
    );
    await expect(acquisitionChart).toBeVisible();
  });

  test("Direct traffic should be captured when no UTM parameters", async ({ page }) => {
    // Visit without UTM parameters
    await page.goto("http://localhost:8080");
    await page.waitForLoadState("networkidle");

    // Verify no UTM parameters are stored
    const utmParams = await page.evaluate(() => {
      const stored = localStorage.getItem("utm_params");
      return stored ? JSON.parse(stored) : {};
    });

    expect(utmParams).toEqual({});

    // Verify landing page is still stored
    const landingPage = await page.evaluate(() => {
      return localStorage.getItem("landing_page");
    });
    expect(landingPage).toBe("/");
  });

  test("UTM parameters should persist across page navigation", async ({ page }) => {
    // Visit with UTM parameters
    await page.goto(
      "http://localhost:8080/?utm_source=instagram&utm_medium=social&utm_campaign=test",
    );
    await page.waitForLoadState("networkidle");

    // Navigate to different pages
    await page.click('a[href="/products"]');
    await page.waitForLoadState("networkidle");

    // Verify UTM parameters are still in localStorage
    const utmParams = await page.evaluate(() => {
      const stored = localStorage.getItem("utm_params");
      return stored ? JSON.parse(stored) : {};
    });

    expect(utmParams).toEqual({
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "test",
    });
  });
});
