export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Monitoramento Ar - IFUSP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Simple geometric sans-serif to mimic Cerebri Sans */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700;800;900&display=swap');
          body { font-family: 'Urbanist', 'Arial', sans-serif !important; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
