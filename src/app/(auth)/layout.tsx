export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:flex-1 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-xl font-bold text-primary-foreground">A</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Gerencie seus projetos com excelência
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Plataforma completa para gestão de projetos, comunicação com clientes, 
            controle financeiro e automações inteligentes.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {['Projetos', 'CRM', 'Financeiro', 'Automações', 'Chat', 'Analytics'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  )
}
