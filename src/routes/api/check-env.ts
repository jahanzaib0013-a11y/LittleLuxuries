import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/check-env')({
  server: {
    handlers: {
      GET: async () => {
        const envVars = {
          R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? '✅ SET' : '❌ MISSING',
          R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ SET' : '❌ MISSING',
          R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ SET' : '❌ MISSING',
          R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? '✅ SET' : '❌ MISSING',
          R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ? '✅ SET' : '❌ MISSING',
        };

        console.log('=== Environment Variables Check ===');
        console.log('R2_ACCOUNT_ID:', envVars.R2_ACCOUNT_ID);
        console.log('R2_ACCESS_KEY_ID:', envVars.R2_ACCESS_KEY_ID);
        console.log('R2_SECRET_ACCESS_KEY:', envVars.R2_SECRET_ACCESS_KEY);
        console.log('R2_BUCKET_NAME:', envVars.R2_BUCKET_NAME);
        console.log('R2_PUBLIC_URL:', envVars.R2_PUBLIC_URL);
        console.log('=====================================');

        return new Response(
          JSON.stringify({
            status: 'Environment Variables Check',
            variables: envVars,
            timestamp: new Date().toISOString(),
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      },
    },
  },
});
