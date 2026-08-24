# Google — o que falta fazer (Search Console, GA4 e Perfil da Empresa)

**Resumo em uma linha:** faltam **três tarefas suas**, todas de graça e todas feitas no navegador — nenhuma mexe no site. Juntas levam cerca de **40 minutos**. A mais urgente é a terceira (Perfil da Empresa), porque é a que traz cliente do Rio procurando "caneca personalizada" no celular.

Tudo que dependia do site **já está pronto e instalado**: o Google Analytics, a etiqueta do Google Ads, o mapa do site (sitemap) e as marcações que o Google lê. O que resta é só ligar as contas do seu lado.

> **Antes de tudo: clique em Publicar.** Enquanto o site publicado for a versão antiga, nada disso vai medir direito.

---

## Tarefa 1 — Marcar o "gerar_lead" como evento-chave no GA4 (10 min)

**O que é:** o site já avisa o Google Analytics toda vez que alguém realmente entra em contato — clica no WhatsApp, manda o formulário de pedido, fecha uma sacola de prontos ou fala com o chat. Esse aviso se chama `gerar_lead`. Só que, pro Google, hoje ele é um aviso comum, igual a "rolou a página". Você precisa dizer que **aquilo ali é o que importa**.

**Por que fazer:** sem isso, o relatório mostra visita e tempo no site — número bonito que não paga conta. Com isso, ele passa a mostrar **quantos contatos o site gerou** e de onde vieram (Instagram, Google, digitação direta).

**Passo a passo:**

1. Entre em [analytics.google.com](https://analytics.google.com) com o e-mail **didoww@gmail.com**.
2. Confirme lá em cima que a propriedade selecionada é a do **canecamaneira.com.br**.
3. Canto inferior esquerdo → engrenagem **Administrador**.
4. Na coluna do meio (Exibição de dados) → **Eventos**.
5. Procure na lista o evento chamado **`gerar_lead`**.
6. Na linha dele, do lado direito, ligue a chavinha **"Marcar como evento-chave"**.

**Detalhe importante:** o `gerar_lead` só aparece na lista **depois que alguém dispara ele pelo menos uma vez no site publicado**. Se a lista estiver sem ele, publique o site, abra no seu celular, clique no botão de WhatsApp e espere umas horas. Se preferir não esperar, dá pra criar na mão em Administrador → **Eventos-chave** → **Novo evento-chave** → digitar exatamente `gerar_lead`.

**Como saber que deu certo:** dois ou três dias depois, no menu **Relatórios → Aquisição**, vai aparecer uma coluna de eventos-chave com número maior que zero.

### Ainda no Google Ads (2 minutos, é rápido)

Já que você vai estar logado: em **Metas → Conversões**, ache a ação de conversão que a gente instalou e confirme que ela está marcada como **"Principal"** e com status **"Registrando conversões"**. Se estiver como "Secundária", o Google Ads não usa ela pra otimizar os anúncios — que é justamente pra isso que ela serve.

---

## Tarefa 2 — Search Console (15 min)

**O que é:** é o painel gratuito onde o Google mostra **o que as pessoas digitaram** pra achar você, em qual posição o site apareceu e quantas clicaram. Também é por onde o Google avisa se alguma página quebrou.

**Por que fazer:** hoje você está voando às cegas — não sabe se aparece pra "caneca personalizada rio de janeiro", "caneca com foto" ou pra nada. Sem esse painel não dá pra melhorar o que não se mede.

**Passo a passo:**

1. Entre em [search.google.com/search-console](https://search.google.com/search-console) com o **didoww@gmail.com** (o mesmo do Analytics — assim os dois conversam sozinhos).
2. Clique em **Adicionar propriedade**.
3. Vão aparecer duas caixas. Escolha a da **esquerda: "Domínio"**. Digite só `canecamaneira.com.br`, sem `https://` e sem `www`.
4. O Google vai te dar um código comprido começando com `google-site-verification=`. **Copie ele.**
5. Abra em outra aba o painel da **Cloudflare** (é onde o domínio do site está apontado), entre no `canecamaneira.com.br` → **DNS** → **Add record**:
   - Tipo: **TXT**
   - Nome: **@**
   - Conteúdo: cole o código que você copiou
   - Salvar.
6. Volte no Search Console e clique em **Verificar**. Costuma funcionar na hora; se der erro, espere 30 minutos e clique de novo (o DNS demora um pouco pra espalhar).

**Depois de verificado, faça mais uma coisa:** no menu da esquerda → **Sitemaps** → digite `sitemap.xml` → **Enviar**. Isso entrega ao Google a lista pronta de todas as páginas do site. Ele já está publicado e funcionando, é só apontar.

**O que esperar:** os dados **demoram de 2 a 3 dias** pra começar a aparecer, e uns 15 dias pra ficarem úteis. Não se assuste com o painel vazio no primeiro dia.

**Aviso sobre uma mudança recente:** a página `/galeria` deixou de existir (virou parte de "Modelos que já fizemos"). Quem tiver o link antigo continua chegando na página certa, mas o Google leva **algumas semanas** pra atualizar. Se o Search Console acusar essa URL como redirecionamento, é esperado — não é erro.

---

## Tarefa 3 — Perfil da Empresa no Google (15 min) — **a mais importante**

**O que é:** é aquela ficha que aparece do lado direito da busca e no Google Maps, com nome, endereço, telefone, foto e estrelas.

**Por que é a mais importante das três:** quem busca "caneca personalizada perto de mim" no celular quase nunca chega a rolar até os sites — clica direto na ficha do Maps. É de graça e é a maior fonte de cliente local que você não está usando direito. Suas **5,0 estrelas com 6 avaliações** já estão lá; falta o resto da ficha estar certa.

**Como entrar:** faça login com o **didoww@gmail.com** e simplesmente **pesquise "Caneca Maneira" no Google**. Se o perfil for seu, aparece um painel de edição em cima do resultado. Se pedir pra reivindicar, siga a verificação que o Google pedir (costuma ser por vídeo ou cartão-postal).

**O que corrigir, na ordem:**

1. **Nome exato:** `Caneca Maneira — Brindes e Personalizados`. Nada de enfiar palavra-chave tipo "caneca personalizada barata rio" — o Google pune e pode suspender a ficha.
2. **Endereço:** o da **loja no Mercado Popular Uruguaiana — Quadra C, nº 107**, que é onde o cliente te encontra. **Não** ponha o endereço da produção em Irajá como endereço público, e **nunca** o "Apt 304".
3. **Categoria principal:** "Loja de presentes" ou "Serviço de impressão". Adicione as secundárias que couberem (gráfica, loja de canecas, brindes promocionais).
4. **Telefone:** `(21) 97549-8978` — o mesmo do site, digitado igualzinho.
5. **Site:** `https://canecamaneira.com.br` (com https, sem barra no fim).
6. **Horário:** o de verdade da banca. Ficha com horário errado gera avaliação ruim de gente que foi e achou fechado.
7. **Fotos:** mínimo de **5**. Fachada da banca, o balcão, 3 peças prontas. Essa é a parte que mais mexe o ponteiro — perfil com foto recebe muito mais clique que perfil sem. (As fotos estão na lista do outro guia que te mandei.)
8. **Descrição:** algo curto e verdadeiro, tipo: *"Canecas, camisas e azulejos personalizados com produção própria no Rio de Janeiro há mais de 6 anos. Atendemos pessoa física e empresas, com pedido a partir de 1 peça."*

**Duas coisas que dão retorno depois que a ficha estiver certa:**

- **Poste 1 foto por semana** no perfil (é o botão "Adicionar atualização"). Perfil movimentado o Google mostra mais.
- **Peça avaliação.** Você tem 6 — chegar a 20 muda de patamar. Use aquele **cartaz com QR code** que eu gerei: imprima, corte e ponha um dentro de cada caixa que sair. É o jeito mais barato de subir isso.

---

## Resumo pra colar na geladeira

| # | Tarefa | Onde | Tempo | Ganho |
|---|---|---|---|---|
| 0 | Clicar em **Publicar** | Runable | 1 min | Nada mede sem isso |
| 1 | Marcar `gerar_lead` como evento-chave | analytics.google.com | 10 min | Saber quantos contatos o site gera |
| 2 | Verificar domínio + enviar sitemap | search.google.com/search-console | 15 min | Saber o que buscam pra te achar |
| 3 | Arrumar a ficha + 5 fotos | Pesquisar "Caneca Maneira" logado | 15 min | Cliente do Rio no celular |
| ↳ | Conferir conversão "Principal" | Google Ads → Metas | 2 min | Anúncio otimizar pra venda |

Travou em algum passo, tira print e me manda que eu destravo.
