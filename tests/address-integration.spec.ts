import { test, expect } from "@playwright/test";

test.describe("Address Integration - Settings to Contact Page", () => {
  test("should display updated address on contact page after saving in settings", async ({
    page,
  }) => {
    // Step 1: Go to settings and update address
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Update address fields
    const studioAddressField = page.locator('text="Studio Address"').locator("..").locator("input");
    const studioCityField = page.locator('text="Studio City"').locator("..").locator("input");
    const studioCountryField = page.locator('text="Studio Country"').locator("..").locator("input");

    await studioAddressField.fill("123 Integration Test Street");
    await studioAddressField.dispatchEvent("input");
    await studioAddressField.dispatchEvent("change");

    await studioCityField.fill("TestCity");
    await studioCityField.dispatchEvent("input");
    await studioCityField.dispatchEvent("change");

    await studioCountryField.fill("Test Country");
    await studioCountryField.dispatchEvent("input");
    await studioCountryField.dispatchEvent("change");

    // Save changes
    const saveButtons = page.getByRole("button", { name: "Save Changes" });
    await saveButtons.nth(1).click(); // Use Studio section save button
    await expect(page.getByText("Changes saved successfully!")).toBeVisible({ timeout: 5000 });

    // Step 2: Go to contact page and verify address is displayed
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    // Check that the updated address is displayed
    const studioInfo = page.locator("text=Studio").locator("..");
    await expect(studioInfo).toContainText("123 Integration Test Street, TestCity, Test Country");

    // Verify it's not showing the old hardcoded address
    await expect(studioInfo).not.toContainText("14 Coral Lane, London E2");
  });

  test("should display default address if no custom address is set", async ({ page }) => {
    // Go to contact page directly without changing settings
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    // Should show some address (either default or previously saved)
    const studioInfo = page.locator("text=Studio").locator("..");
    await expect(studioInfo).toBeVisible();

    // Should contain address information
    const addressText = await studioInfo.textContent();
    expect(addressText).toContain("Studio");
    expect(addressText?.length || 0).toBeGreaterThan(10); // Should have meaningful content
  });

  test("should update email dynamically on contact page", async ({ page }) => {
    // Step 1: Update email in settings
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const emailField = page.locator('text="Business Email"').locator("..").locator("input");
    await emailField.fill("test@example.com");
    await emailField.dispatchEvent("input");
    await emailField.dispatchEvent("change");

    // Save changes
    const saveButtons = page.getByRole("button", { name: "Save Changes" });
    await saveButtons.nth(0).click(); // Use Store Profile section save button
    await expect(page.getByText("Changes saved successfully!")).toBeVisible({ timeout: 5000 });

    // Step 2: Check contact page shows updated email
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    const emailInfo = page.locator("text=Email").locator("..");
    await expect(emailInfo).toContainText("test@example.com");
  });
});
