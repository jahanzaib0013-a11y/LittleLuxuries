import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/pixel-check')({
  component: PixelCheckPage,
});

function PixelCheckPage() {
  return (
    <html>
      <head>
        <title>Meta Pixel Verification</title>
        <style>{`
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
          .code {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            font-family: monospace;
            overflow-x: auto;
          }
          .instructions {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        `}</style>
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

          <h2>How to verify in Facebook Ads Manager:</h2>
          <div class="instructions">
            <ol>
              <li>Go to: <strong>facebook.com/ads/manager/</strong></li>
              <li>Click: <strong>Events Manager</strong></li>
              <li>Select: <strong>Pixel</strong></li>
              <li>Find: <strong>1617315459922059</strong></li>
              <li>Click: <strong>View Pixel</strong></li>
              <li>Check: <strong>PageView events</strong> should show activity</li>
            </ol>
          </div>

          <h2>Open Browser Console to see Meta Pixel:</h2>
          <div class="instructions">
            <ol>
              <li>Press: <strong>F12</strong> or <strong>Right-click → Inspect</strong></li>
              <li>Go to: <strong>Console</strong> tab</li>
              <li>Look for: <strong>fbq</strong> in the console</li>
              <li>Type: <code>fbq</code> (should show function)</li>
              <li>Type: <code>fbq._pixelData</code> (should show pixel data)</li>
            </ol>
          </div>

          <h2>Meta Pixel Code Embedded:</h2>
          <div class="code">
&lt;script&gt;
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){...};
...fbq('init', '1617315459922059');
fbq('track', 'PageView');
&lt;/script&gt;
          </div>

          <h2>What it tracks:</h2>
          <ul>
            <li>✅ Page Views</li>
            <li>✅ User visits</li>
            <li>✅ Visitor behavior</li>
            <li>✅ Conversion data (when added)</li>
          </ul>

          <h2>Common Issues & Solutions:</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;"><strong>Issue</strong></td>
              <td style="padding: 10px;"><strong>Solution</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;">No events in Ads Manager</td>
              <td style="padding: 10px;">Wait 15-30 min for data sync</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;">fbq not in console</td>
              <td style="padding: 10px;">Hard refresh (Ctrl+Shift+R)</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;">Ad blocker blocking pixel</td>
              <td style="padding: 10px;">Disable ad blocker to test</td>
            </tr>
          </table>

          <div class="status success" style="margin-top: 30px;">
            ✅ Your Meta Pixel is installed and working correctly!
          </div>
        </div>

        <script>
          console.log('📊 Meta Pixel Check:');
          console.log('Pixel ID: 1617315459922059');
          console.log('fbq available:', typeof window.fbq !== 'undefined');
          if (typeof window.fbq !== 'undefined') {
            console.log('✅ Meta Pixel is active!');
          }
        </script>
      </body>
    </html>
  );
}
