import "./globals.css";

export const metadata = {
  title: "FTBL PRONOS",
  description: "Pronostics football gratuits et VIP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
