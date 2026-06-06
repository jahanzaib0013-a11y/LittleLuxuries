# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: studio-address-test.spec.ts >> Studio Address Fields - Basic Test >> should verify studio section is present on settings page
- Location: tests/studio-address-test.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Studio' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Studio' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
    - complementary [ref=e3]:
        - generic [ref=e4]:
            - generic [ref=e5]:
                - img "Little Luxuries" [ref=e6]
                - generic [ref=e7]:
                    - generic [ref=e8]: Little Luxuries
                    - generic [ref=e9]: BABY GARMENTS
            - navigation [ref=e10]:
                - link "Dashboard" [ref=e11] [cursor=pointer]:
                    - /url: /dashboard
                    - img [ref=e12]
                    - text: Dashboard
                - link "Products" [ref=e17] [cursor=pointer]:
                    - /url: /products
                    - img [ref=e18]
                    - text: Products
                - link "Orders" [ref=e22] [cursor=pointer]:
                    - /url: /orders
                    - img [ref=e23]
                    - text: Orders
                - link "Customers" [ref=e27] [cursor=pointer]:
                    - /url: /customers
                    - img [ref=e28]
                    - text: Customers
                - link "Coupons" [ref=e33] [cursor=pointer]:
                    - /url: /coupons
                    - img [ref=e34]
                    - text: Coupons
                - link "Content" [ref=e37] [cursor=pointer]:
                    - /url: /content
                    - img [ref=e38]
                    - text: Content
                - link "Analytics" [ref=e42] [cursor=pointer]:
                    - /url: /analytics
                    - img [ref=e43]
                    - text: Analytics
                - link "Settings" [ref=e48] [cursor=pointer]:
                    - /url: /settings
                    - img [ref=e49]
                    - text: Settings
            - generic [ref=e52]:
                - generic [ref=e53]: EV
                - generic [ref=e54]:
                    - generic [ref=e55]: Eleanor Vance
                    - generic [ref=e56]: Store Administrator
                - link "Sign out" [ref=e57] [cursor=pointer]:
                    - /url: /login
                    - img [ref=e58]
    - generic [ref=e62]:
        - banner [ref=e63]:
            - generic [ref=e64]:
                - generic [ref=e65]:
                    - img [ref=e66]
                    - textbox "Search settings…" [ref=e69]
                - button "Notifications" [ref=e71]:
                    - img [ref=e72]
        - main [ref=e76]:
            - generic [ref=e77]:
                - generic [ref=e78]:
                    - heading "Store Settings" [level=1] [ref=e79]
                    - paragraph [ref=e80]: Manage your boutique's global configurations, payment methods, and regional logistics.
                - generic [ref=e81]:
                    - generic [ref=e82]:
                        - generic [ref=e83]:
                            - generic [ref=e84]:
                                - heading "Store Profile" [level=2] [ref=e85]
                                - generic [ref=e86]: Identity & Contact
                            - button "Save Changes" [ref=e87]
                        - generic [ref=e88]:
                            - button "Change Logo" [ref=e91]:
                                - img [ref=e92]
                                - text: Change Logo
                            - generic [ref=e95]:
                                - generic [ref=e96]:
                                    - text: Store Name
                                    - textbox [ref=e97]: Little Luxuries Boutique
                                - generic [ref=e98]:
                                    - text: Business Email
                                    - textbox [ref=e99]: concierge@littleluxuries.com
                                - generic [ref=e100]:
                                    - text: Contact Number
                                    - textbox [ref=e101]: +1 (555) 892-0192
                                - generic [ref=e102]:
                                    - text: Timezone
                                    - textbox [ref=e103]: London (GMT +00)
                    - generic [ref=e104]:
                        - heading "Payment Methods" [level=2] [ref=e105]
                        - generic [ref=e106]:
                            - generic [ref=e107]:
                                - img [ref=e109]
                                - generic [ref=e112]:
                                    - generic [ref=e113]: Credit Cards
                                    - generic [ref=e114]: Visa, Mastercard, Amex
                                - button [ref=e115]
                            - generic [ref=e117]:
                                - generic [ref=e119]: P
                                - generic [ref=e120]:
                                    - generic [ref=e121]: PayPal
                                    - generic [ref=e122]: Standard & Express
                                - button [ref=e123]
                            - generic [ref=e125]:
                                - img [ref=e127]
                                - generic [ref=e130]:
                                    - generic [ref=e131]: Apple Pay
                                    - generic [ref=e132]: iOS/Safari checkouts
                                - button [ref=e133]
                        - button "+ Add Custom Gateway" [ref=e135]
                - generic [ref=e136]:
                    - generic [ref=e137]:
                        - generic [ref=e138]:
                            - heading "Shipping & Logistics" [level=2] [ref=e139]
                            - generic [ref=e140]: Zones & Taxation Rules
                        - generic [ref=e141]:
                            - button "Tax Settings" [ref=e142]
                            - button "Add Zone" [ref=e143]:
                                - img
                                - text: Add Zone
                    - generic [ref=e144]:
                        - generic [ref=e145]:
                            - generic [ref=e146]:
                                - img [ref=e148]
                                - generic [ref=e152]: ACTIVE
                            - generic [ref=e153]: Domestic (UK)
                            - paragraph [ref=e154]: Next day & standard delivery across United Kingdom.
                            - generic [ref=e155]: 🚚 Free from £100.00
                        - generic [ref=e156]:
                            - generic [ref=e157]:
                                - img [ref=e159]
                                - generic [ref=e161]: ACTIVE
                            - generic [ref=e162]: European Union
                            - paragraph [ref=e163]: Standard tracked shipping to all EU member states.
                            - generic [ref=e164]: 🚚 Flat Rate £15.00
                - generic [ref=e166]:
                    - generic [ref=e167]: 👤
                    - generic [ref=e168]:
                        - generic [ref=e169]: Administrator Account
                        - generic [ref=e170]: Eleanor Vance
                        - generic [ref=e171]: Senior Store Manager • Full Permissions
                        - generic [ref=e172]:
                            - button "Edit Profile" [ref=e173]
                            - button "Two-Factor Auth" [ref=e174]
                    - generic [ref=e175]:
                        - generic [ref=e176]: Login Activity
                        - generic [ref=e177]: "Current: London, UK"
                        - generic [ref=e179]: "2h ago: iPhone 15 Pro"
                - generic [ref=e180]:
                    - generic [ref=e181]:
                        - img [ref=e182]
                        - text: "Last backup: October 24, 2023 at 10:15 AM"
                    - generic [ref=e185]:
                        - button "Discard All" [ref=e186]
                        - button "Save All Changes" [ref=e187]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Studio Address Fields - Basic Test', () => {
  4  |   test('should verify studio section is present on settings page', async ({ page }) => {
  5  |     await page.goto('/settings');
  6  |     await page.waitForLoadState('networkidle');
  7  |
  8  |     // Check that Studio section exists
  9  |     const studioSection = page.getByRole('heading', { name: 'Studio' });
> 10 |     await expect(studioSection).toBeVisible();
     |                                 ^ Error: expect(locator).toBeVisible() failed
  11 |
  12 |     // Check for address labels
  13 |     await expect(page.locator('text="Studio Address"')).toBeVisible();
  14 |     await expect(page.locator('text="Studio City"')).toBeVisible();
  15 |     await expect(page.locator('text="Studio Country"')).toBeVisible();
  16 |
  17 |     // Check for address input fields
  18 |     const addressField = page.locator('text="Studio Address"').locator('..').locator('input');
  19 |     const cityField = page.locator('text="Studio City"').locator('..').locator('input');
  20 |     const countryField = page.locator('text="Studio Country"').locator('..').locator('input');
  21 |
  22 |     await expect(addressField).toBeVisible();
  23 |     await expect(cityField).toBeVisible();
  24 |     await expect(countryField).toBeVisible();
  25 |
  26 |     // Verify they have some values (not empty)
  27 |     await expect(addressField).toHaveValue(/\S+/); // Any non-empty value
  28 |     await expect(cityField).toHaveValue(/\S+/); // Any non-empty value
  29 |     await expect(countryField).toHaveValue(/\S+/); // Any non-empty value
  30 |   });
  31 |
  32 |   test('should verify contact page displays address from settings', async ({ page }) => {
  33 |     await page.goto('/settings');
  34 |     await page.waitForLoadState('networkidle');
  35 |
  36 |     // Set a test address
  37 |     const addressField = page.locator('text="Studio Address"').locator('..').locator('input');
  38 |     await addressField.fill('123 Test Street');
  39 |     await addressField.dispatchEvent('input');
  40 |     await addressField.dispatchEvent('change');
  41 |
  42 |     // Save changes
  43 |     const saveButtons = page.getByRole('button', { name: 'Save Changes' });
  44 |     await saveButtons.nth(1).click(); // Studio section save button
  45 |     await expect(page.getByText('Changes saved successfully!')).toBeVisible({ timeout: 5000 });
  46 |
  47 |     // Go to contact page
  48 |     await page.goto('/contact');
  49 |     await page.waitForLoadState('networkidle');
  50 |
  51 |     // Check that updated address is displayed
  52 |     const studioInfo = page.locator('text=Studio').locator('..');
  53 |     await expect(studioInfo).toContainText('123 Test Street');
  54 |   });
  55 | });
  56 |
```
