import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import logo from "@/assets/logo.png";

/**
 * Brand splash shown in the very first HTML the browser receives, so visitors
 * see the logo on-brand background instantly instead of a blank white screen
 * while the JS bundle downloads (this app renders its body client-side).
 *
 * It is rendered by React in the server HTML (so it paints before hydration),
 * stays visible through hydration (initial state matches SSR → no mismatch),
 * then fades out once the app has mounted. Styles are inline and self-contained
 * so it does not depend on the main stylesheet loading first. The background +
 * logo match the intro animation, so it hands off seamlessly into whatever
 * animation is selected in the admin dashboard.
 */
function AppSplash() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Fade out on the next frame (after the app has painted), then unmount.
    const raf = requestAnimationFrame(() => setHidden(true));
    const timer = setTimeout(() => setRemoved(true), 700);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at top, oklch(0.94 0.05 305) 0%, oklch(0.985 0.004 300) 70%)",
        opacity: hidden ? 0 : 1,
        pointerEvents: "none",
        transition: "opacity 500ms ease",
      }}
    >
      <img
        src={logo}
        alt="Little Luxuries"
        width={96}
        height={96}
        style={{ width: 96, height: 96, objectFit: "contain" }}
      />
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div
      className="lux-grain flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="relative z-[1] max-w-md text-center">
        <span className="label-eyebrow justify-center">Lost the thread</span>
        <h1 className="display-serif mt-4 text-7xl text-primary sm:text-8xl">404</h1>
        <div className="divider-ornament mx-auto mt-6 w-48">
          <span className="diamond" />
        </div>
        <h2 className="mt-6 font-serif text-2xl italic text-foreground">
          This page has wandered off
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Let's get you back to
          something beautiful.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-(--shadow-soft) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-hover)"
          >
            Return home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-7 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Browse the shop
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
        content:
          "Discover premium organic baby clothing, accessories, and gift sets at Little Luxuries. Handcrafted with love in Pakistan using sustainable materials for your little ones.",
      },
      {
        name: "keywords",
        content:
          "baby clothes, organic baby clothing, baby accessories, baby gifts, Pakistan baby store, sustainable baby products, onesies, baby swaddles, baby sleepwear",
      },
      { name: "author", content: "Little Luxuries" },
      { name: "robots", content: "index, follow" },
      {
        name: "google-site-verification",
        content: "Z2Xeg_3J0_LXL1FCEFcv0y2_XfA6s6jE8C-f6-yGO4k",
      },
      { property: "og:title", content: "Little Luxuries - Premium Baby Clothing & Accessories" },
      {
        property: "og:description",
        content:
          "Discover premium organic baby clothing, accessories, and gift sets. Handcrafted with love in Pakistan using sustainable materials.",
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
        content:
          "Discover premium organic baby clothing, accessories, and gift sets. Handcrafted with love in Pakistan.",
      },
      { name: "twitter:image", content: "https://littleluxuries.pk/og-image.jpg" },
    ],
    links: [
      // Preload the splash logo so the brand screen paints instantly.
      { rel: "preload", as: "image", href: logo, fetchpriority: "high" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "canonical",
        href: "https://littleluxuries.pk",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/logo.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo.png",
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
        <AppSplash />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
