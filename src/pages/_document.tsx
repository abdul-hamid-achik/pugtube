import { env } from "@/env.mjs";
import { Head, Html, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html className="h-full bg-gray-700">
      <Head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${
            env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""
          }`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""}');
        `}
        </Script>
      </Head>
      <body className="h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
