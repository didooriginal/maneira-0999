# Caneca Maneira — progresso

## Feito
- app_init em /home/user/caneca-maneira
- design.md (paleta da logo: blue #7FB3DC, yellow #FFD100, navy #0B2C5E, cream #FFF6E3, coral #FF6B5A, mint #9BD9C4)
- 9 imagens geradas em packages/web/public/images/ (hero-mugs + 8 mugs)
- schema.ts: categories, products, orders, orderItems, quotes, testimonials, galleryItems
- db:push OK + seed OK (5 categorias, 8 produtos, 6 depoimentos, 8 galeria)
- API routes: catalog.ts, checkout.ts, quotes.ts (ping removido)
- styles.css (fonts Baloo 2 / Caveat Brush / Poppins, sticker/btn/field/tag/marquee)
- index.html (pt-BR + Google Fonts + meta)
- lib/site.ts, components/cart-context.tsx, cart-drawer.tsx, layout.tsx, ui/bits.tsx, product-card.tsx
- queries/catalog.ts
- pages: index.tsx, catalogo.tsx, produto.tsx, checkout.tsx, pedido.tsx

## Faltando
- pages: galeria.tsx, orcamento.tsx, sobre.tsx, contato.tsx, not-found
- app.tsx: rotas + Layout + CartProvider
- lint + typecheck + build
- dev server + deliver

## Placeholders a trocar com o cliente
logo PNG, fotos reais, WhatsApp (5511999999999), email, cidade, preços

## Status final (verificado)
- Páginas concluídas: home, catálogo, produto, checkout, pedido, galeria, orçamento, sobre, contato, 404.
- app.tsx com Provider > CartProvider > Layout + todas as rotas.
- typecheck OK (3 pacotes), build OK.
- oxlint quebra no sandbox (panic no alocador, falha até em 1 arquivo) — problema de ambiente, não do código. konsistent OK.
- Fluxo carrinho -> checkout -> pedido testado no browser: pedido CM-YVW9UZNNK criado.
- Orçamento testado via API: protocolo ORC-YW9M7C71.
- Dev server: http://localhost:5173

## Verificação final (06/08/2026)
- typecheck: OK (turbo --force)
- build: OK (web + desktop)
- lint: oxlint aborta com panic do allocator (bug de ambiente do sandbox, não do código); konsistent passou sem violações
- dev server: rodando em :5173 (tmux session "dev")
- fluxos testados via RPC: catalog.products/categories, checkout.quoteCart, checkout.createOrder, checkout.orderByCode, quotes.create — todos OK
- pedidos/orçamentos de teste apagados do banco
- screenshots verificados: home, catálogo, produto, orçamento, galeria, sobre, contato (0 erros de console)

## Identidade real aplicada (06/08/2026)
- Logo real: packages/web/public/logo.png (do cliente) — header + footer
- Favicon: favicon.png/.ico + apple-touch-icon (do FAVIICO enviado)
- OG image nova: 1200x630, gerada com PIL a partir da logo real + canecas do banner do cliente. Script em /tmp/og.py
- Paleta oficial extraída do banner/logo: blue #7BC7EF, magenta #EC008B, yellow #EEDA10, navy #0D3E77, mint #35C4B5
- Token `coral` renomeado para `magenta` em todo o source
- Dados reais: WhatsApp 5521971766660 / (21) 97176-6660, @canecamaneira, Mercado Popular Uruguaiana Quadra C nº 107, Rio de Janeiro RJ
- Hero alinhado ao slogan oficial: "Personalize do seu jeito" + faixa amarela "Vários modelos e cores diferentes"
- Meta tags completas: OG type/site_name/locale/dimensions/alt + Twitter card

## Catálogo reorganizado (folheto) — verificado
- 6 categorias do folheto no ar (tematicas, coloridas, chopp, criancas, magica, glitter), 16 produtos.
- Ícones das categorias agora com cor de contraste (isDark() em index.tsx) — tile navy não esconde mais o ícone.
- Typo "Pesonalizados" corrigido dentro de public/logo.png.
- Verificado: tsc --noEmit OK, bun run build OK, playwright em 7 rotas + 6 filtros de categoria + 6 páginas de produto = 0 erros / 0 respostas 4xx.
- lint (oxlint) segue abortando por bug de ambiente (SIGABRT no oxc_allocator).

## Rodada: arte + outros produtos + instagram (verificado)
- Nova seção ArtStudio na home (após Featured): caricatura digital, historinha personalizada, arte do zero, prova digital + 2 imagens ilustrativas (arte-caricatura.jpg / arte-historinha.jpg, geradas — trocar por fotos reais).
- Nova seção OtherProducts (após Corporate): Camisas (sublimação + DTF), Azulejos, Quadros.
- Orçamento: select "O que você quer personalizar" com os 6 tipos + caricatura + historinha + camisa/azulejo/quadro.
- Instagram revertido para @caneca_maneira_of.
- tsc OK, build OK, 0 respostas 4xx na home/orçamento/contato.

## Orçamento → WhatsApp (verificado)
- onSubmit em orcamento.tsx: salva no banco e abre wa.me com resumo completo (protocolo, nome, empresa, telefone, e-mail, produto, qtd, prazo, arte, estimativa, observações).
- Tela de sucesso guarda waUrl para reenviar caso o popup seja bloqueado. Botão do form: "Enviar orçamento no WhatsApp".
- Testado com Playwright: popup abriu em api.whatsapp.com/send com o texto completo; registro de teste apagado do banco.
- Campo `message` é obrigatório (min 5) — validação do form.
