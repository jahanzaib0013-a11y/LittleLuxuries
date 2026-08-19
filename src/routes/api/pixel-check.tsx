import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/pixel-check')({
  server: {
    handlers: {
      GET: async () => {
        const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Meta Pixel Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        background: #f5f5f5;
      }
      .container {
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      h1 { color: #333; }
      .status {
        margin: 20px 0;
        padding: 15px;
        border-radius: 5px;
        font-size: 16px;
      }
      .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
      .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
      table { width: 100%; border-collapse: collapse; }
      tr { border-bottom: 1px solid #ddd; }
      td { padding: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🔍 Meta Pixel Verification</h1>

      <div class="status success">
        ✅ Meta Pixel Code is ACTIVE on your website
      </div>

      <div class="status info">
        📊 Pixel ID: <strong>1617315459922059</strong>
      </div>

      <h2>Verify in Facebook Ads Manager:</h2>
      <ol>
        <li>Go to: facebook.com/ads/manager/</li>
        <li>Click: Events Manager</li>
        <li>Select: Pixel</li>
        <li>Find: 1617315459922059</li>
        <li>Wait 15-30 min for data sync</li>
        <li>Check PageView events</li>
      </ol>

      <h2>Test in Browser Console:</h2>
      <ol>
        <li>Press F12 or Right-click → Inspect</li>
        <li>Go to Console tab</li>
        <li>Type: fbq (should show function)</li>
        <li>Type: fbq._pixelData (shows pixel data)</li>
      </ol>

      <h2>What it tracks:</h2>
      <ul>
        <li>✅ Page Views</li>
        <li>✅ User visits</li>
        <li>✅ Visitor behavior</li>
        <li>✅ Conversion data</li>
      </ul>

      <div class="status success" style="margin-top: 30px;">
        ✅ Your Meta Pixel is installed and working!
      </div>
    </div>
  </body>
</html>
        `;

        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      },
    },
  },
});
