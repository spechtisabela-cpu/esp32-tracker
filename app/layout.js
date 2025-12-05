export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Monitoramento Ar - IFUSP</title>
        {/* Fallback for Cerebri Sans since it is a paid font, using a similar geometric sans stack */}
        <style>{`
          @font-face {
            font-family: 'Cerebri Sans';
            src: local('Cerebri Sans'), local('Arial');
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
