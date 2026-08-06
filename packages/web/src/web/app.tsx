import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import { CartProvider } from "./components/cart-context";
import { Layout } from "./components/layout";
import Index from "./pages/index";
import CatalogoPage from "./pages/catalogo";
import ProdutoPage from "./pages/produto";
import CheckoutPage from "./pages/checkout";
import PedidoPage from "./pages/pedido";
import GaleriaPage from "./pages/galeria";
import OrcamentoPage from "./pages/orcamento";
import SobrePage from "./pages/sobre";
import ContatoPage from "./pages/contato";
import PainelPage from "./pages/painel";
import NaoEncontradoPage from "./pages/nao-encontrado";

function App() {
  return (
    <Provider>
      <CartProvider>
        <Layout>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/catalogo" component={CatalogoPage} />
            <Route path="/caneca/:slug" component={ProdutoPage} />
            <Route path="/checkout" component={CheckoutPage} />
            <Route path="/pedido/:code" component={PedidoPage} />
            <Route path="/galeria" component={GaleriaPage} />
            <Route path="/orcamento" component={OrcamentoPage} />
            <Route path="/sobre" component={SobrePage} />
            <Route path="/contato" component={ContatoPage} />
            <Route path="/painel" component={PainelPage} />
            <Route component={NaoEncontradoPage} />
          </Switch>
        </Layout>
      </CartProvider>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
