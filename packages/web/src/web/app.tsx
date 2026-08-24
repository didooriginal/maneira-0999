import { lazy, Suspense } from "react";
import { Redirect, Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import { Layout } from "./components/layout";
import Index from "./pages/index";

/**
 * A home vem junto do bundle principal — é a primeira coisa que todo mundo
 * abre e não pode esperar um segundo download.
 *
 * O resto entra em lazy: cada página só é baixada quando o visitante clica.
 * Quem mais pesa é o /painel (só o Diego usa) e o /pedido (formulário grande
 * com frete e cálculo de preço), e não faz sentido cobrar esse download de
 * quem entrou pelo celular só pra ver o catálogo.
 */
const ModelosPage = lazy(() => import("./pages/modelos"));
const CatalogoPage = lazy(() => import("./pages/catalogo"));
const ProdutoPage = lazy(() => import("./pages/produto"));
const ProntosPage = lazy(() => import("./pages/prontos"));
const ProntoPage = lazy(() => import("./pages/pronto"));
const PedidoPage = lazy(() => import("./pages/pedido-form"));
const EmpresasPage = lazy(() => import("./pages/empresas"));
const OrcamentoPage = lazy(() => import("./pages/orcamento"));
const SobrePage = lazy(() => import("./pages/sobre"));
const ContatoPage = lazy(() => import("./pages/contato"));
const PrivacidadePage = lazy(() => import("./pages/privacidade"));
const PainelPage = lazy(() => import("./pages/painel"));
const NaoEncontradoPage = lazy(() => import("./pages/nao-encontrado"));

/**
 * Enquanto o pedaço da página baixa. Fica com a altura de uma tela pra o
 * rodapé não subir e pular na cara do visitante.
 */
function Carregando() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-5">
      <div className="flex items-center gap-3 text-navy/60">
        <span className="size-5 animate-spin rounded-full border-[3px] border-navy/20 border-t-navy" />
        <span className="font-bold">Carregando...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <Provider>
      <Layout>
        <Suspense fallback={<Carregando />}>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/modelos" component={ModelosPage} />
            <Route path="/catalogo" component={CatalogoPage} />
            <Route path="/caneca/:slug" component={ProdutoPage} />
            <Route path="/prontos" component={ProntosPage} />
            <Route path="/prontos/:slug" component={ProntoPage} />
            <Route path="/pedido" component={PedidoPage} />
            <Route path="/pedido/:linha" component={PedidoPage} />
            <Route path="/empresas" component={EmpresasPage} />
            {/* /galeria virou parte de /catalogo: os dois botões diziam a
                mesma coisa pro cliente. Link antigo continua chegando. */}
            <Route path="/galeria">
              <Redirect to="/catalogo" replace />
            </Route>
            <Route path="/orcamento" component={OrcamentoPage} />
            <Route path="/sobre" component={SobrePage} />
            <Route path="/contato" component={ContatoPage} />
            <Route path="/privacidade" component={PrivacidadePage} />
            <Route path="/painel" component={PainelPage} />
            <Route component={NaoEncontradoPage} />
          </Switch>
        </Suspense>
      </Layout>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
