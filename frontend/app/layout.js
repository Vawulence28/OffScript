import './globals.css';

export const metadata = {
  title: 'OffScript | Independent Live Podcast Platform',
  description: 'Professional live podcast broadcasting and studio control room',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}