# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: studio-address-test.spec.ts >> Studio Address Fields - Basic Test >> should verify contact page displays address from settings
- Location: tests/studio-address-test.spec.ts:32:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text="Studio Address"').locator('..').locator('input')

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
                - link "Dashboard" [ref=e11]:
                    - /url: /dashboard
                    - img [ref=e12]
                    - text: Dashboard
                - link "Products" [ref=e17]:
                    - /url: /products
                    - img [ref=e18]
                    - text: Products
                - link "Orders" [ref=e21]:
                    - /url: /orders
                    - img [ref=e22]
                    - text: Orders
                - link "Customers" [ref=e25]:
                    - /url: /customers
                    - img [ref=e26]
                    - text: Customers
                - link "Coupons" [ref=e31]:
                    - /url: /coupons
                    - img [ref=e32]
                    - text: Coupons
                - link "Content" [ref=e35]:
                    - /url: /content
                    - img [ref=e36]
                    - text: Content
                - link "Analytics" [ref=e40]:
                    - /url: /analytics
                    - img [ref=e41]
                    - text: Analytics
                - link "Settings" [ref=e43]:
                    - /url: /settings
                    - img [ref=e44]
                    - text: Settings
            - generic [ref=e47]:
                - generic [ref=e48]: EV
                - generic [ref=e49]:
                    - generic [ref=e50]: Eleanor Vance
                    - generic [ref=e51]: Store Administrator
                - link "Sign out" [ref=e52]:
                    - /url: /login
                    - img [ref=e53]
    - generic [ref=e56]:
        - banner [ref=e57]:
            - generic [ref=e58]:
                - generic [ref=e59]:
                    - img [ref=e60]
                    - textbox "Search settings…" [ref=e63]
                - button "Notifications" [ref=e65]:
                    - img [ref=e66]
        - main [ref=e70]:
            - generic [ref=e71]:
                - generic [ref=e72]:
                    - heading "Store Settings" [level=1] [ref=e73]
                    - paragraph [ref=e74]: Manage your boutique's global configurations, payment methods, and regional logistics.
                - generic [ref=e75]:
                    - generic [ref=e76]:
                        - generic [ref=e77]:
                            - generic [ref=e78]:
                                - heading "Store Profile" [level=2] [ref=e79]
                                - generic [ref=e80]: Identity & Contact
                            - button "Save Changes" [ref=e81]
                        - generic [ref=e82]:
                            - button "Change Logo" [ref=e85]:
                                - img [ref=e86]
                                - text: Change Logo
                            - generic [ref=e89]:
                                - generic [ref=e90]:
                                    - text: Store Name
                                    - textbox [ref=e91]: Little Luxuries Boutique
                                - generic [ref=e92]:
                                    - text: Business Email
                                    - textbox [ref=e93]: concierge@littleluxuries.com
                                - generic [ref=e94]:
                                    - text: Contact Number
                                    - textbox [ref=e95]: +1 (555) 892-0192
                                - generic [ref=e96]:
                                    - text: Timezone
                                    - textbox [ref=e97]: London (GMT +00)
                    - generic [ref=e98]:
                        - heading "Payment Methods" [level=2] [ref=e99]
                        - generic [ref=e100]:
                            - generic [ref=e101]:
                                - img [ref=e103]
                                - generic [ref=e105]:
                                    - generic [ref=e106]: Credit Cards
                                    - generic [ref=e107]: Visa, Mastercard, Amex
                                - button [ref=e108]
                            - generic [ref=e110]:
                                - generic [ref=e112]: P
                                - generic [ref=e113]:
                                    - generic [ref=e114]: PayPal
                                    - generic [ref=e115]: Standard & Express
                                - button [ref=e116]
                            - generic [ref=e118]:
                                - img [ref=e120]
                                - generic [ref=e122]:
                                    - generic [ref=e123]: Apple Pay
                                    - generic [ref=e124]: iOS/Safari checkouts
                                - button [ref=e125]
                        - button "+ Add Custom Gateway" [ref=e127]
                - generic [ref=e128]:
                    - generic [ref=e129]:
                        - generic [ref=e130]:
                            - heading "Shipping & Logistics" [level=2] [ref=e131]
                            - generic [ref=e132]: Zones & Taxation Rules
                        - generic [ref=e133]:
                            - button "Tax Settings" [ref=e134]
                            - button "Add Zone" [ref=e135]:
                                - img
                                - text: Add Zone
                    - generic [ref=e136]:
                        - generic [ref=e137]:
                            - generic [ref=e138]:
                                - img [ref=e140]
                                - generic [ref=e143]: ACTIVE
                            - generic [ref=e144]: Domestic (UK)
                            - paragraph [ref=e145]: Next day & standard delivery across United Kingdom.
                            - generic [ref=e146]: 🚚 Free from £100.00
                        - generic [ref=e147]:
                            - generic [ref=e148]:
                                - img [ref=e150]
                                - generic [ref=e152]: ACTIVE
                            - generic [ref=e153]: European Union
                            - paragraph [ref=e154]: Standard tracked shipping to all EU member states.
                            - generic [ref=e155]: 🚚 Flat Rate £15.00
                - generic [ref=e157]:
                    - generic [ref=e158]: 👤
                    - generic [ref=e159]:
                        - generic [ref=e160]: Administrator Account
                        - generic [ref=e161]: Eleanor Vance
                        - generic [ref=e162]: Senior Store Manager • Full Permissions
                        - generic [ref=e163]:
                            - button "Edit Profile" [ref=e164]
                            - button "Two-Factor Auth" [ref=e165]
                    - generic [ref=e166]:
                        - generic [ref=e167]: Login Activity
                        - generic [ref=e168]: "Current: London, UK"
                        - generic [ref=e170]: "2h ago: iPhone 15 Pro"
                - generic [ref=e171]:
                    - generic [ref=e172]:
                        - img [ref=e173]
                        - text: "Last backup: October 24, 2023 at 10:15 AM"
                    - generic [ref=e176]:
                        - button "Discard All" [ref=e177]
                        - button "Save All Changes" [ref=e178]
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
  10 |     await expect(studioSection).toBeVisible();
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
> 38 |     await addressField.fill('123 Test Street');
     |                        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
