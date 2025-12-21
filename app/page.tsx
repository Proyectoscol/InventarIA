export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">InventarIA</h1>
        <p className="text-lg">Sistema de Gestión de Inventario Multi-Compañía</p>
        <div className="mt-8">
          <a href="/login" className="text-blue-600 hover:underline">Iniciar Sesión</a>
        </div>
      </div>
    </main>
  );
}

