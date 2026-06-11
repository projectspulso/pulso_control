export const metadata = { title: 'Política de Privacidade — PULSO' }

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-200">
      <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-zinc-500">Última atualização: 11 de junho de 2026</p>
      <div className="mt-8 space-y-4 leading-relaxed">
        <p>
          O PULSO Control respeita a sua privacidade. Esta política descreve quais dados tratamos e
          como.
        </p>
        <p>
          1. <strong>Dados tratados:</strong> credenciais de acesso às contas das redes sociais dos
          canais PULSO (tokens de API armazenados de forma segura), conteúdos produzidos pela equipe
          e métricas públicas de desempenho fornecidas pelas APIs oficiais das plataformas.
        </p>
        <p>
          2. <strong>O que NÃO fazemos:</strong> não coletamos dados pessoais de espectadores, não
          vendemos dados a terceiros e não compartilhamos tokens de acesso fora da infraestrutura do
          serviço.
        </p>
        <p>
          3. <strong>Armazenamento:</strong> os dados ficam em provedores de nuvem com criptografia
          em trânsito e em repouso (Vercel e Supabase).
        </p>
        <p>
          4. <strong>Revogação:</strong> o acesso concedido às plataformas conectadas pode ser
          revogado a qualquer momento nas configurações de cada plataforma.
        </p>
        <p>Contato: oticastatymello@gmail.com</p>
      </div>
    </main>
  )
}
