import React, {type PropsWithChildren} from 'react';
import {ScrollViewStyleReset} from 'expo-router/html';

export default function Html({children}:PropsWithChildren) {
  return <html lang="en"><head>
    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#101714" />
    <link rel="icon" href="/brand/favicon.ico?v=liquid-g-2" sizes="any" />
    <link rel="icon" href="/brand/favicon.svg?v=liquid-g-2" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png?v=liquid-g-2" sizes="180x180" />
    <meta name="robots" content="noindex,nofollow" />
    <meta name="description" content="Explore classic cocktails, follow your taste, and discover recipes with their sources." />
    <ScrollViewStyleReset />
    <style>{`html,body{background:#101714;color:#f3f0e8}*{box-sizing:border-box}button,input,select{font:inherit}::selection{background:#b5c6a9;color:#101714}a{color:inherit}`}</style>
  </head><body>{children}</body></html>;
}
