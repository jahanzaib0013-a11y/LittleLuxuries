import { test, expect } from "@playwright/test";

test.describe("Studio Address Fields - Basic Test", () => {
  test("should verify studio section is present on settings page", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Check that Studio section exists
    const studioSection = page.getByRole("heading", { name: "Studio" });
    await expect(studioSection).toBeVisible();

    // Check for address labels
    await expect(page.locator('text="Studio Address"')).toBeVisible();
    await expect(page.locator('text="Studio City"')).toBeVisible();
    await expect(page.locator('text="Studio Country"')).toBeVisible();

    // Check for address input fields
    const addressField = page.locator('text="Studio Address"').locator("..").locator("input");
    const cityField = page.locator('text="Studio City"').locator("..").locator("input");
    const countryField = page.locator('text="Studio Country"').locator("..").locator("input");

    await expect(addressField).toBeVisible();
    await expect(cityField).toBeVisible();
    await expect(countryField).toBeVisible();

    // Verify they have some values (not empty)
    await expect(addressField).toHaveValue(/\S+/); // Any non-empty value
    await expect(cityField).toHaveValue(/\S+/); // Any non-empty value
    await expect(countryField).toHaveValue(/\S+/); // Any non-empty value
  });

  test("should verify contact page displays address from settings", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Set a test address
    const addressField = page.locator('text="Studio Address"').locator("..").locator("input");
    await addressField.fill("123 Test Street");
    await addressField.dispatchEvent("input");
    await addressField.dispatchEvent("change");

    // Save changes
    const saveButtons = page.getByRole("button", { name: "Save Changes" });
    await saveButtons.nth(1).click(); // Studio section save button
    await expect(page.getByText("Changes saved successfully!")).toBeVisible({ timeout: 5000 });

    // Go to contact page
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");

    // Check that updated address is displayed
    const studioInfo = page.locator("text=Studio").locator("..");
    await expect(studioInfo).toContainText("123 Test Street");
  });
});
