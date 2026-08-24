import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";
import { site, whatsappLink } from "../lib/site";
import { useSeo } from "../hooks/use-seo";
import { usePageView } from "../hooks/use-analytics";

/** Última revisão do texto — atualize a data ao mudar o conteúdo. */
const UPDATED_AT = "7 de agosto de 2026";

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-extrabold text-navy md:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-navy/75">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  useSeo({
    title: "Política de Privacidade",
    description:
      "Como a Caneca Maneira coleta, usa e protege os seus dados pessoais, de acordo com a LGPD (Lei 13.709/2018).",
  });
  usePageView("/privacidade");

  return (
    <main className="bg-cream">
      <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
        <span className="tag bg-mint">
          <ShieldCheck className="size-4" />
          Seus dados
        </span>

        <h1 className="mt-4 font-display text-3xl font-extrabold text-navy md:text-5xl">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-navy/70">
          Última atualização: {UPDATED_AT}. Este texto explica, sem juridiquês,
          quais dados a {site.name} coleta quando você pede um orçamento, para
          que eles servem e o que você pode exigir da gente.
        </p>

        <Block title="Quem somos">
          <p>
            A {site.name} ({site.tagline}) é a responsável pelo tratamento dos
            seus dados. Estamos no {site.address}, {site.city}. Para falar sobre
            privacidade, chame no WhatsApp{" "}
            <a
              className="font-semibold underline"
              href={whatsappLink(
                "Olá! Quero falar sobre privacidade e meus dados.",
              )}
              target="_blank"
              rel="noreferrer"
            >
              {site.whatsappDisplay}
            </a>
            .
          </p>
        </Block>

        <Block title="Que dados coletamos">
          <p>
            Só pedimos o necessário para montar o seu orçamento e entregar o
            pedido:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Nome e WhatsApp</strong> — para responder o
              orçamento e combinar a produção.
            </li>
            <li>
              <strong>CEP</strong> — para calcular o frete. Não guardamos o
              endereço completo pelo site.
            </li>
            <li>
              <strong>Detalhes do pedido</strong> — modelo, quantidade, prazo,
              tipo de cliente (pessoa ou empresa) e o que você escreveu no campo
              de observações.
            </li>
            <li>
              <strong>Arte enviada</strong> — a foto, frase ou desenho que você
              nos passa para personalizar.
            </li>
            <li>
              <strong>Dados de navegação</strong> — páginas visitadas e origem
              da visita, de forma agregada e anônima, para entender o que
              funciona no site. Não usamos isso para identificar você.
            </li>
          </ul>
          <p>
            Não pedimos CPF, RG nem dados de cartão pelo site. O pagamento é
            combinado direto com a gente, fora daqui.
          </p>
        </Block>

        <Block title="Por que usamos esses dados">
          <p>
            Para responder o seu orçamento, calcular frete, produzir e entregar
            o pedido, e manter registro das vendas. A base legal é a{" "}
            <strong>execução de contrato</strong> (art. 7º, V da LGPD) quando
            você pede um orçamento, e o{" "}
            <strong>legítimo interesse</strong> (art. 7º, IX) para melhorar o
            site.
          </p>
          <p>
            <strong>Não vendemos seus dados</strong> e não mandamos propaganda
            sem você pedir.
          </p>
        </Block>

        <Block title="Com quem compartilhamos">
          <p>
            Apenas com quem é indispensável para o pedido acontecer:
            transportadoras e a plataforma de frete{" "}
            <strong>Melhor Envio</strong> (recebe apenas o CEP para cotar), e a
            hospedagem do site. Cada um recebe só o mínimo necessário e não pode
            usar seus dados para outra coisa.
          </p>
          <p>
            Também podemos compartilhar se a lei ou uma ordem judicial exigir.
          </p>
        </Block>

        <Block title="Por quanto tempo guardamos">
          <p>
            Orçamentos que não viraram pedido: até{" "}
            <strong>12 meses</strong>. Pedidos concluídos: até{" "}
            <strong>5 anos</strong>, prazo legal para questões fiscais e de
            consumo. Depois disso, apagamos ou anonimizamos.
          </p>
          <p>
            As artes que você envia ficam guardadas enquanto durar o pedido e
            por mais 6 meses, caso você queira repetir a compra. É só pedir que
            apagamos antes.
          </p>
        </Block>

        <Block title="Seus direitos">
          <p>Pela LGPD, você pode a qualquer momento pedir para:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>saber quais dados seus a gente tem;</li>
            <li>corrigir algo que esteja errado;</li>
            <li>apagar seus dados, quando não formos obrigados a guardar;</li>
            <li>receber uma cópia do que você nos deu;</li>
            <li>revogar seu consentimento e parar de receber contato.</li>
          </ul>
          <p>
            Basta mandar um WhatsApp. Respondemos em até{" "}
            <strong>15 dias</strong>, sem custo.
          </p>
        </Block>

        <Block title="Segurança">
          <p>
            O site roda com conexão criptografada (HTTPS) e o acesso aos
            orçamentos é protegido por senha, restrito à equipe. Nenhum sistema
            é 100% infalível, mas se acontecer qualquer incidente com risco para
            você, avisamos você e a ANPD.
          </p>
        </Block>

        <Block title="Cookies">
          <p>
            Usamos apenas o essencial para o site funcionar e uma medição de
            audiência que não cria perfil nem rastreia você por outros sites.
            Não usamos cookies de publicidade.
          </p>
        </Block>

        <Block title="Mudanças nesta política">
          <p>
            Se mudarmos algo relevante, atualizamos a data no topo desta página.
            Vale sempre a versão publicada aqui.
          </p>
        </Block>

        <div className="sticker mt-12 bg-yellow p-6">
          <h2 className="font-display text-xl font-extrabold">
            Ficou com dúvida sobre seus dados?
          </h2>
          <p className="mt-2 text-navy/75">
            Chama a gente que a gente explica direitinho.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              className="btn bg-magenta text-white"
              href={whatsappLink(
                "Oi! Tenho uma dúvida sobre privacidade e meus dados.",
              )}
              target="_blank"
              rel="noreferrer"
            >
              Falar no WhatsApp
            </a>
            <Link className="btn bg-white" href="/contato">
              Página de contato
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
