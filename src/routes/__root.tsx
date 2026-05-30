import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Little Luxuries - Premium Baby Clothing & Accessories in Pakistan" },
      {
        name: "description",
        content: "Discover premium organic baby clothing, accessories, and gift sets at Little Luxuries. Handcrafted with love in Pakistan using sustainable materials for your little ones.",
      },
      { name: "keywords", content: "baby clothes, organic baby clothing, baby accessories, baby gifts, Pakistan baby store, sustainable baby products, onesies, baby swaddles, baby sleepwear" },
      { name: "author", content: "Little Luxuries" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Little Luxuries - Premium Baby Clothing & Accessories" },
      {
        property: "og:description",
        content: "Discover premium organic baby clothing, accessories, and gift sets. Handcrafted with love in Pakistan using sustainable materials.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://littleluxuries.pk" },
      { property: "og:image", content: "https://littleluxuries.pk/og-image.jpg" },
      { property: "og:site_name", content: "Little Luxuries" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@LittleLuxuriesPK" },
      { name: "twitter:title", content: "Little Luxuries - Premium Baby Clothing & Accessories" },
      {
        name: "twitter:description",
        content: "Discover premium organic baby clothing, accessories, and gift sets. Handcrafted with love in Pakistan.",
      },
      { name: "twitter:image", content: "https://littleluxuries.pk/og-image.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "canonical",
        href: "https://littleluxuries.pk",
      },
    ],
    scripts: [
      {
        type: "text/javascript",
        src: "https://www.googletagmanager.com/gtag/js?id=G-5MVN9EFSEB",
        async: true,
      },
      {
        type: "text/javascript",
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-5MVN9EFSEB');
        `,
      },
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Little Luxuries",
          description: "Premium organic baby clothing and accessories store in Pakistan",
          url: "https://littleluxuries.pk",
          logo: "https://littleluxuries.pk/logo.png",
          image: "https://littleluxuries.pk/og-image.jpg",
          address: {
            "@type": "PostalAddress",
            addressCountry: "PK",
          },
          priceRange: "PKR 500 - PKR 5000",
          sameAs: [
            "https://www.instagram.com/littleluxuriespk",
            "https://www.facebook.com/littleluxuriespk",
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
