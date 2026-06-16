import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/check-env')({
  server: {
    handlers: {
      GET: async () => {
        const checks = {
          'R2_ACCOUNT_ID': {
            status: process.env.R2_ACCOUNT_ID ? '✅ SET' : '❌ MISSING',
            value: process.env.R2_ACCOUNT_ID ? process.env.R2_ACCOUNT_ID.substring(0, 8) + '...' : 'NOT SET',
          },
          'R2_ACCESS_KEY_ID': {
            status: process.env.R2_ACCESS_KEY_ID ? '✅ SET' : '❌ MISSING',
            value: process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET',
          },
          'R2_SECRET_ACCESS_KEY': {
            status: process.env.R2_SECRET_ACCESS_KEY ? '✅ SET' : '❌ MISSING',
            value: process.env.R2_SECRET_ACCESS_KEY ? '***HIDDEN***' : 'NOT SET',
          },
          'R2_BUCKET_NAME': {
            status: process.env.R2_BUCKET_NAME ? '✅ SET' : '❌ MISSING',
            value: process.env.R2_BUCKET_NAME || 'NOT SET',
          },
          'R2_PUBLIC_URL': {
            status: process.env.R2_PUBLIC_URL ? '✅ SET' : '❌ MISSING',
            value: process.env.R2_PUBLIC_URL || 'NOT SET',
          },
        };

        const allSet = Object.values(checks).every(c => c.status.includes('✅'));

        console.log('🔍 Environment Variables Check:');
        Object.entries(checks).forEach(([key, check]) => {
          console.log(`${check.status} ${key}: ${check.value}`);
        });
        console.log(allSet ? '✅ All variables set!' : '❌ Some variables missing!');

        return new Response(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            allSet: allSet,
            message: allSet ? '✅ All environment variables are set!' : '❌ Some environment variables are missing',
            variables: checks,
            nextStep: allSet ? 'Website should work with R2 caching' : 'Please add missing environment variables to Cloudflare Pages Settings',
          }, null, 2),
          { headers: { 'Content-Type': 'application/json' } }
        );
      },
    },
  },
});
