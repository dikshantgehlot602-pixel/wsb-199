import { Suspense } from 'react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import './globals.css';
import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import Commonlayout from './components/Common/Commonlayout';
import RouteProgress from './components/Common/RouteProgress';

export const metadata = {
  title: 'Monsta - Online Furniture in India',
  description: 'Monsta is your one-stop online furniture store in India. Shop premium sofas, beds, tables, chairs and more with fast delivery.',
  openGraph: {
    title: 'Monsta - Online Furniture in India',
    description: 'Monsta is your one-stop online furniture store in India. Shop premium sofas, beds, tables, chairs and more with fast delivery.',
    url: 'https://monsta-frontend.vercel.app/',
    siteName: 'Monsta',
    images: [
      {
        url: 'https://monsta-frontend.vercel.app/images/banner1.jpg',
        width: 1200,
        height: 630,
        alt: 'Monsta Online Furniture Store',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monsta - Online Furniture in India',
    description: 'Monsta is your one-stop online furniture store in India. Shop premium sofas, beds, tables, chairs and more with fast delivery.',
    images: ['https://monsta-frontend.vercel.app/images/banner1.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    // `data-scroll-behavior="smooth"` is required by the App Router when the theme sets
    // `scroll-behavior: smooth` on <html> (public/css/plugins.css, inside a
    // prefers-reduced-motion media query). Without it Next disables smooth scrolling during
    // route transitions and logs: "Detected `scroll-behavior: smooth` on the `<html>` element."
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* Viewport meta tag — essential for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Icon libraries (required for icons to show) */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
        <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css" />

        {/* Your downloaded CSS files (you'll place them in public/css/) */}
        <link rel="stylesheet" href="/css/plugins.css" />
        <link rel="stylesheet" href="/css/style.css" />

        {/* Favicon (optional) */}
        <link rel="shortcut icon" href="/images/favicon.ico" />
      </head>
      <body>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <WishlistProvider>
          <CartProvider>
            <Commonlayout>
              <Header />
              {children}
              <Footer />
            </Commonlayout>
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}