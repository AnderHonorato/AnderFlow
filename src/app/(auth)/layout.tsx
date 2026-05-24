export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex relative overflow-hidden bg-[var(--bg)]">
      {/* Organic tree-branch divider SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden lg:block"
        preserveAspectRatio="none"
        viewBox="0 0 1440 1024"
        fill="none"
      >
        <path
          d="M680 0
             C660 80, 620 160, 640 240
             C660 320, 720 360, 690 440
             C660 520, 600 560, 620 640
             C640 720, 700 760, 670 840
             C650 890, 630 960, 660 1024"
          stroke="var(--border)"
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M710 0
             C730 100, 690 200, 720 300
             C750 380, 790 420, 750 500
             C710 570, 650 610, 690 690
             C720 750, 760 800, 720 880
             C700 920, 710 980, 690 1024"
          stroke="var(--border)"
          strokeWidth="0.3"
          fill="none"
          opacity="0.15"
        />
        <path
          d="M695 180
             C720 200, 740 220, 720 250
             C700 270, 670 240, 690 180Z"
          fill="var(--accent)"
          opacity="0.04"
        />
        <path
          d="M675 500
             C705 530, 735 540, 715 570
             C692 595, 655 570, 675 500Z"
          fill="var(--accent)"
          opacity="0.03"
        />
        <path
          d="M680 780
             C710 800, 735 820, 710 850
             C685 870, 658 840, 680 780Z"
          fill="var(--accent)"
          opacity="0.05"
        />
      </svg>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] relative items-center justify-center p-12 overflow-hidden z-10">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.025]">
          <svg width="360" height="360" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="var(--accent)"/>
            <path d="M7 22l6-15h4l4 10h-4l-3-5-4 10H7z" fill="#fff" opacity="0.9"/>
            <path d="M13 19c2-2 3-3 5-3h3c-1 2-2 3-4 3h-4z" fill="#fff" opacity="0.5"/>
          </svg>
        </div>
        <div className="max-w-[420px] space-y-6 relative z-10">
          <h1 className="text-[36px] font-[700] text-[var(--text)] tracking-[-0.04em] leading-none">
            ANDERFLOW
          </h1>
          <p className="text-[16px] text-[var(--text-2)] leading-relaxed">
            Gerencie seus projetos com excelencia. Plataforma completa para gestao de projetos, comunicacao com clientes, controle financeiro e automacoes inteligentes.
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-4">
            {['Projetos', 'CRM', 'Financeiro', 'Automacoes', 'Chat', 'Analytics'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-[14px] text-[var(--text-2)]">
                <div className="h-2 w-2 rounded-full bg-[var(--accent)] shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-4 lg:p-8 overflow-y-auto z-10">
        <div className="w-full max-w-[380px]">
          {children}
        </div>
      </div>
    </div>
  )
}
