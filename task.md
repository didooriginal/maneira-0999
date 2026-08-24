# Modelos prontos (/prontos) — vitrine com sacola no WhatsApp

Decisões do Diego (18/08):
- Sacola: escolhe vários, um WhatsApp só com a lista toda.
- Preço: automático pela tabela conforme o tipo, com campo pra sobrescrever à mão.
- Campos: código (CM-014), várias fotos, tipo de produto, destaque, preço antigo,
  tags de busca, esgotado, observação interna.
- Arte digital: 1 arquivo por modelo (PDF/PNG/JPG/ZIP), download só no painel.
- URL: /prontos. Aba "Modelos" atual continua como está.

## Passos
1. [x] schema `ready_designs` + migração SQL direta
2. [x] api/routes/ready.ts (público: list, item, facets) — nunca expor artUrl/internalNote
3. [x] admin.ts: readyDesigns, createReadyDesign, updateReadyDesign, removeReadyDesign, reorderReadyDesigns
4. [x] upload.ts: allowArt (pdf + zip); /api/midia com ?download= para baixar a arte
5. [x] queries: prontos.ts (público) + hooks no admin.ts
6. [x] lib/sacola.ts (localStorage) + components/sacola.tsx (botão no header + gaveta)
7. [x] pages/prontos.tsx + pages/pronto.tsx; rotas no app.tsx; nav no layout; sitemap
8. [x] painel: aba-prontos.tsx (lista, editar, novo, ↑↓, ocultar, arte) + aba no painel.tsx
9. [x] tsc + build + Playwright (CONSOLE ERRS: []) + screenshots
10. [x] limpar dados de teste, deliver, pedir Publicar

## Regras que valem aqui
- Preço é fonte única: loadPriceModels() manda; sobrescrita por modelo é opcional.
- Nunca apagar produto do catálogo antigo; em prontos existe apagar (com confirmação).
- Nada de estatística/depoimento inventado.


## Validação final (/prontos)
- tsc OK, build 2 successful, Playwright CONSOLE ERRS: []
- Bug corrigido: useSacola() espalhava `sacola` depois de `itens`, o getter sobrescrevia a lista e o checkBag nunca rodava.
- checkBag agora ignora item esgotado no total; mensagem do WhatsApp marca 'esgotado'.
- BotaoSacola escondido no /painel.
- Dados de teste apagados (ready.list = []).

## Reorganização do menu (Modelos = tipos de caneca) — ago/2026
Decisões com o Diego:
- "Modelos" vira vitrine de TIPOS de caneca em /modelos (nova página).
- /catalogo (modelos já produzidos) SAI do menu, continua vivo e linkado no rodapé + /modelos (URLs indexadas seguem 200).
- /galeria SAI do menu → faixa de fotos na home (já existia) + no /pedido; página completa fica no rodapé.
- Card: foto estampada por padrão, crua no hover (mouse) ou botão "ver crua" (celular).
- Preço: manual no painel > tabela de preços (price_model_key) > "sob consulta".
- Menu final (6): Fazer meu pedido, Modelos prontos, Tipos de caneca, Para empresas, Sobre, Contato.
  (o item de /modelos chama "Tipos de caneca" no menu — "Modelos" sozinho confundia com "Modelos prontos"; a URL segue /modelos)

Feito:
- [x] schema `mugTypes` + migração /tmp/mig5.ts (tabela mug_types criada, 7 tipos semeados)
- [x] api/routes/mug-types.ts (list público) + registro no router
- [x] admin: mugTypes/create/update/remove/reorder
- [x] queries/mug-types.ts + hooks admin
- [x] components/tipo-card.tsx
- [x] pages/modelos.tsx + rota em app.tsx
- [x] faixa-galeria compartilhada (home + /pedido)
- [x] layout.tsx: nav 6 itens + rodapé com Galeria e Catálogo
- [x] pedido-form: ?tipo= preseleciona o modelo
- [x] painel: aba "Tipos de caneca" (aba-tipos.tsx + registro em painel.tsx)
- [x] sitemap /modelos
- [x] tsc (exit 0) + build (2 successful) + playwright /tmp/modelos.py (CONSOLE ERRS: []) + deliver
Falta (com o Diego):
- [ ] subir fotos reais por tipo (estampada + peça crua) na aba "Tipos de caneca"
- [ ] clicar em Publicar

## Popup de novidades — ago/2026

Objetivo: um aviso que o Diego edita sozinho no painel (aba **Popup**) para anunciar
novidade/promoção. Primeiro recado no ar: "a arte é por nossa conta — manda a ideia no WhatsApp".

Decisões (fechadas com o Diego):
- Formato: card no centro no PC, faixa subindo do rodapé no celular (nunca cobre a tela inteira —
  intersticial invasivo no mobile é penalizado pelo Google).
- Quando abre: 6s depois de entrar OU 40% de rolagem, o que vier primeiro.
- Quem fecha só vê de novo depois de 7 dias.
- Botão principal: WhatsApp "Manda sua ideia". "Sou empresa" é link pequeno secundário —
  um recado só por popup.
- Arte: foto real que já está no site (padrão `/images/arte-caricatura.jpg`).
- Nunca aparece em /painel, /pedido, /orcamento, /sacola, /checkout (regra fixa no código,
  não editável no painel de propósito).
- Promoção com prazo some sozinha: startsOn/endsOn vazios = sem limite; fora do período a
  procedure pública devolve null.
- `version` sobe sozinho quando muda título/texto/eyebrow/imagem/ctaLabel → quem já tinha
  fechado volta a ver o novo. Mudar só cor ou tempo não reexibe.
- Config mora como JSON em `settings.home_popup` (mesmo padrão do `home_hero`), sem tabela nova.
- GA4: `popup_visto`, `popup_fechado`, `popup_clique`.

Feito:
- [x] api/lib/popup.ts (PopupConfig, CORES_POPUP, POPUP_PADRAO, lerPopup/lerPopupAtivo/salvarPopup com bump de version)
- [x] rota pública `catalog.popup` + admin `popup` / `updatePopup`
- [x] queries: usePopup(), useAdminPopup(), useUpdatePopup()
- [x] components/popup-novidade.tsx (card md:flex + faixa md:hidden, silêncio de 7 dias em localStorage)
- [x] layout.tsx: <PopupNovidade /> só nas páginas públicas
- [x] painel: aba "Popup" (aba-popup.tsx) com prévia ao vivo, cores, upload de foto e datas
- [x] styles.css: animações pop-in / subir-rodape com prefers-reduced-motion
- [x] ligado no banco (settings.home_popup, enabled:true)
- [x] pb extra na faixa mobile (o selo do rodapé cobria o link "Sou empresa")
- [x] tsc (exit 0) + build (2 successful) + playwright /tmp/popup.py (CONSOLE ERRS: [])
Falta (com o Diego):
- [ ] clicar em Publicar

## Melhorias do site — ago/2026 (lote de 6)

Ordem de ataque (do que rende mais / menos depende do Diego):
1. [x] Velocidade — quebrar o bundle: /painel e páginas secundárias em lazy load.
2. [x] Pedidos parados — lista no painel de quem entrou e sumiu (>48h sem fechar),
       com botão de cutucar no WhatsApp e registro de quando cutucou (coluna nudged_at).
3. [x] Preços de verdade na home — a faixa corporativa hoje é texto fixo; passar a ler
       da tabela de preços (com os overrides do painel) + linha "a partir de R$ X".
4. [x] Avaliações — campo do link do Google no painel, bloco "avalia a gente" no site
       depois do pedido, e cartão impresso com QR pra colocar dentro da caixa.
5. [x] Fotos reais — guia de o que fotografar (shot list) + onde cada foto entra.
6. [x] Google — passo a passo de Search Console, conversão no GA4 e Perfil da Empresa.

### Unificação catálogo + galeria — feito (ago/2026)
- O Diego viu dois botões dizendo a mesma coisa ("Modelos que já fizemos" e "Galeria de
  fotos reais"). Decisão dele: fica **/catalogo**, fotos entram no **mesmo grid** dos
  modelos, **/galeria redireciona**.
- `pages/catalogo.tsx`: passou a ler `useProducts()` + `useGallery()` e intercalar uma foto
  a cada 3 produtos (foto real aparece na primeira tela, não escondida no rodapé).
  Card de foto tem selo "Foto real", abre ampliada com botão "Quero uma assim" no WhatsApp.
  Filtro de categoria e busca também filtram as fotos (por tag/título, sem acento).
  CTA navy que era da galeria veio junto pro fim da página.
- `pages/galeria.tsx` **apagado**. `app.tsx` tem `<Route path="/galeria"><Redirect to="/catalogo" /></Route>`.
- Links atualizados: rodapé (`layout.tsx`), bloco final de `modelos.tsx`, faixa da home e
  do formulário (`faixa-galeria.tsx` → "Ver tudo que já fizemos"), `popup-novidade.tsx`
  (lista de vitrines) e `public/sitemap.xml` (URL removida).
- A aba **Galeria do painel continua igual** — é onde o Diego sobe as fotos; só mudou o
  texto explicando onde elas aparecem agora.
- Validado: `tsc` exit 0, `build` 2/2, `/tmp/unifica.py` (redirect OK, 24 modelos com 12
  fotos no grid, lightbox abre/fecha, busca vazia, 0 links órfãos), `veloc/popup/precos/ads`
  todos com `CONSOLE ERRS: []`. Avaliações restauradas para 5,0 · 6 depois do teste.
- Pendente ligado a isto: marca d'água nas fotos (pedido "para depois").

### 6. Google — feito (o passo a passo)
- Guia em `google.report/content.md`, três tarefas do lado do Diego (nada no código):
  (1) marcar `gerar_lead` como evento-chave no GA4 — inclui o caso de ele ainda não
  aparecer na lista (criar na mão em Eventos-chave → Novo); (2) Search Console com
  propriedade de **Domínio** + TXT na Cloudflare + enviar `sitemap.xml`; (3) Perfil da
  Empresa no Google (nome exato, endereço da banca e não o de Irajá nem o Apt 304,
  categoria, telefone, horário, 5 fotos, descrição).
- Lembrete extra: conferir no Ads se a ação de conversão está como "Principal".
- Avisado que o Search Console vai acusar `/galeria` como redirecionamento por algumas
  semanas — é esperado, não é erro.

### 5. Fotos reais — feito (o guia)
- Guia escrito em `fotos.report/content.md`, em linguagem de leigo: 6 regras de como
  fotografar (luz de janela, altura da peça, fundo liso, 1:1, peça limpa, alça pra direita),
  20 fotos listadas em 3 prioridades e a tabela de onde subir cada uma no painel.
- Lacunas mapeadas contra o site: peças **cruas** por tipo (Painel → Tipos, hoje com buraco),
  mágica revelando, camisa **vestida** (a linha com foto mais fraca), azulejo na parede,
  foto de **lote** (é o que converte empresa), prensa trabalhando (Sobre) e fachada da banca
  do Uruguaiana (Contato + Perfil da Empresa no Google).
- Fechei com "se só puder fazer 3 fotos": camisa vestida, lote e prensa.
- A observação sobre marca d'água entrou no fim do guia (protege pouco; melhor como
  assinatura discreta com @caneca_maneira_of) — segue pendente de implementar.

### 1. Velocidade — feito
- app.tsx: todas as páginas em `lazy()` + `<Suspense>`, menos a home (todo mundo abre).
- ChatWidget partido em dois: `chat-launcher.tsx` (botão leve, faz preload no hover/toque)
  e `ChatPanel` (o peso, só baixa quando abre).
- Resultado: bundle principal 1.264,79 kB → 648,76 kB (gzip 311,76 → 194,59 kB).
  `painel-*.js` (228 kB) e `chat-widget-*.js` (156 kB) agora saem separados.

### 2. Pedidos parados — feito
- Regra única em `web/lib/parados.ts` (48h para virar parado, 3 dias de silêncio depois de
  cutucar) — o contador do topo e a lista usam a mesma conta, não dá pra divergir.
- Coluna `quotes.nudged_at` (nulo = nunca cutucado). Fechado/perdido nunca voltam à fila.
- Painel: bloco "Cobrar hoje" (só aparece se tem fila), chip de filtro "parados", badge com
  o número na aba Pedidos, botões Cutucar / Já falei / Perdido e desfazer da cutucada.
- `cutucar()` abre o WhatsApp com a mensagem pronta ANTES do await, senão o navegador
  bloqueia a aba nova.

### 3. Preços de verdade — feito
- Nenhum preço escrito à mão no site: `loadProductLines()` calcula tudo da tabela viva
  (já com os overrides do painel).
- Home: bloco corporativo lê `usePriceTiers()`; cards das linhas ganharam selo de atacado
  ("15+ peças: R$ X cada").
- O desconto máximo agora é calculado: 60% real (35 → 14). O texto antigo dizia 58%
  inventado.

### 4. Avaliações — feito
- `api/lib/avaliacoes.ts`: nota, quantidade, link do perfil, convite e "conferido em"
  moram em `settings.google_reviews` (mesmo padrão do hero e do popup).
- Aba "Avaliações" no painel: edita os números, prévia do bloco ao vivo, avisa quando faz
  30+ dias que ninguém confere, e salvar já marca a data de hoje.
- Home lê do banco em 3 lugares (selo do topo, bloco da nota e página de contato) com
  fallback pro número conferido do site.ts — nunca fica sem nada.
- O JSON-LD do index.html é corrigido em runtime pela nota salva, então o que o Google lê
  bate com o que o cliente vê.
- Cartaz A6 em PDF (4 por folha A4) com QR do perfil, pra pôr na sacola. jsPDF e o gerador
  de QR entram por import dinâmico — não pesam no site público.

### Google Ads — conversão instalada (pedido do Diego, 21/ago)
- Tag do Google já existia (GA4 G-TMEFC7Q5NM); só faltava o `gtag("config","AW-962817210")`,
  que entrou no index.html junto do rótulo `AW-962817210/KbJcCKK0ysQBELrZjcsD`.
- O snippet que o Google mandou é do tipo "tráfego do site" — dispararia em qualquer visita
  e encheria a conta de conversão que não vale nada. Em vez disso, `gaAdsConversion()`
  dispara junto do `gerar_lead`: WhatsApp, formulário de pedido, sacola de prontos e chat.
- Uma conversão por origem por sessão: quem clica no WhatsApp 3x é 1 lead, não 3.
- Continua carregando só no domínio de produção, pra teste não sujar os dados.
Falta (com o Diego):
- [ ] no Google Ads, deixar essa ação de conversão como "principal" e conferir se aparece
      "tag ativa" 24h depois de publicar.
