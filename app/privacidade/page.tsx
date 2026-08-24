export const metadata = { title: 'Política de Privacidade — PULSO Control' }

const EMPRESA = {
  razaoSocial: 'DIGIAI ÓTICA E TECNOLOGIA LTDA',
  cnpj: '12.549.582/0001-49',
  endereco: 'Rua General Francisco Glicério, 940 — Térreo Sala 02, Jardim Guaio, Suzano/SP, CEP 08674-000',
  email: 'contato@digiai.app.br',
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-200">
      <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-zinc-500">Última atualização: 24 de agosto de 2026</p>

      <div className="mt-8 space-y-5 leading-relaxed">
        <p>
          <strong className="text-white">Controlador:</strong> {EMPRESA.razaoSocial}, CNPJ {EMPRESA.cnpj}, com sede em{' '}
          {EMPRESA.endereco}. Contato do encarregado (DPO):{' '}
          <a href={`mailto:${EMPRESA.email}`} className="underline underline-offset-2 hover:text-zinc-200">
            {EMPRESA.email}
          </a>
          .
        </p>
        <p>
          1. <strong>Dados tratados:</strong> credenciais de acesso às contas das redes sociais dos canais PULSO
          (tokens de API armazenados de forma segura), conteúdos produzidos pela equipe, e métricas públicas e
          agregadas de desempenho fornecidas pelas APIs oficiais das plataformas. Contas de operadores da equipe
          (e-mail de login) são tratadas para controle de acesso.
        </p>
        <p>
          2. <strong>Base legal (LGPD art. 7º):</strong> execução de contrato e procedimentos preliminares para as
          contas de operadores (inciso V) e legítimo interesse na operação e segurança da ferramenta (inciso IX).
        </p>
        <p>
          3. <strong>O que NÃO fazemos:</strong> não coletamos dados pessoais de espectadores, não vendemos dados a
          terceiros e não compartilhamos tokens de acesso fora da infraestrutura do serviço.
        </p>
        <p>
          4. <strong>Operadores:</strong> Vercel (hospedagem) e Supabase (banco de dados), com criptografia em trânsito
          e em repouso.
        </p>
        <p>
          5. <strong>Seus direitos:</strong> a LGPD (art. 18) garante confirmação, acesso, correção, portabilidade e
          eliminação dos seus dados. Solicite pelo e-mail acima — respondemos em até 15 dias.
        </p>
        <p>
          6. <strong>Revogação:</strong> o acesso concedido às plataformas conectadas pode ser revogado a qualquer
          momento nas configurações de cada plataforma.
        </p>
      </div>
    </main>
  )
}
