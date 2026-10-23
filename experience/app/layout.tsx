import './globals.css';
export const metadata = {
  title: 'Chenuka Jayathilake | Developer Portfolio',
  description:
    'Full-stack developer building interactive web apps, speech tools, and digital experiences. Explore Chenuka Jayathilake’s projects, engineering background, and CV.',
  authors: [
    {
      name: 'Chenuka Jayathilake',
    },
  ],
  openGraph: {
    title: 'Chenuka Jayathilake | Developer Portfolio',
    description:
      'Full-stack developer building interactive web apps, speech tools, and digital experiences. Explore Chenuka Jayathilake’s projects, engineering background, and CV.',
    type: 'website',
    siteName: 'Chenuka Jayathilake',
  },
  twitter: {
    card: 'summary',
    title: 'Chenuka Jayathilake | Developer Portfolio',
    description:
      'Full-stack developer building interactive web apps, speech tools, and digital experiences. Explore Chenuka Jayathilake’s projects, engineering background, and CV.',
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
