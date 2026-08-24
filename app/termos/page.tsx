export const metadata = { title: 'Termos de Serviço — PULSO Control' }

const EMPRESA = {
  razaoSocial: 'DIGIAI ÓTICA E TECNOLOGIA LTDA',
  cnpj: '12.549.582/0001-49',
  endereco: 'Rua General Francisco Glicério, 940 — Térreo Sala 02, Jardim Guaio, Suzano/SP, CEP 08674-000',
  email: 'contato@digiai.app.br',
}

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-200">
      <h1 className="text-3xl font-bold text-white">Termos de Serviço</h1>
      <p className="mt-2 text-sm text-zinc-500">Última atualização: 24 de agosto de 2026</p>

      <div className="mt-8 space-y-5 leading-relaxed">
        <p>
          O <strong className="text-white">PULSO Control</strong> é uma ferramenta interna de gestão e publicação de
          conteúdo audiovisual, operada por <strong className="text-white">{EMPRESA.razaoSocial}</strong>, CNPJ{' '}
          {EMPRESA.cnpj}, com sede em {EMPRESA.endereco}. Ao utilizá-la, você concorda com estes termos.
        </p>
        <p>
          1. O serviço destina-se à criação, organização e publicação de vídeos curtos nas redes sociais dos canais
          PULSO, mediante autorização explícita das contas conectadas. O acesso é restrito à equipe autorizada — não é
          um produto aberto ao público.
        </p>
        <p>
          2. As integrações com plataformas de terceiros (YouTube, TikTok, Instagram, Facebook, Kwai) seguem os termos
          e políticas de cada plataforma. A publicação só ocorre com confirmação humana do operador responsável.
        </p>
        <p>
          3. Os vídeos produzidos usam inteligência artificial na geração de cenas e na narração (voz sintética criada
          para o canal, que não reproduz voz de pessoa real). O uso de IA é declarado às plataformas que exigem a
          rotulagem, conforme as políticas vigentes de cada uma.
        </p>
        <p>
          4. Não coletamos dados de espectadores das redes sociais além das métricas públicas e agregadas fornecidas
          pelas APIs oficiais de cada plataforma.
        </p>
        <p>
          5. Podemos atualizar estes termos a qualquer momento. A data no topo indica a versão vigente, e o uso
          continuado da ferramenta após alterações constitui aceite.
        </p>
        <p className="pt-4 text-sm text-zinc-400">
          Contato:{' '}
          <a href={`mailto:${EMPRESA.email}`} className="underline underline-offset-2 hover:text-zinc-200">
            {EMPRESA.email}
          </a>{' '}
          · Site público do canal:{' '}
          <a
            href="https://pulsohub.netlify.app"
            className="underline underline-offset-2 hover:text-zinc-200"
            target="_blank"
            rel="noreferrer"
          >
            pulsohub.netlify.app
          </a>
        </p>
      </div>
    </main>
  )
}
