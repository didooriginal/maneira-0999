# Caneca Maneira — Design System

Brand: **Caneca Maneira** — canecas personalizadas. Público: consumidor final (presentes,
datas comemorativas) + empresas (brindes corporativos).

Mood: **colorido, divertido, artesanal e acolhedor**. Inspiração de layout: blocos coloridos
grandes, cards com preço em destaque, tipografia display bold misturada com script manuscrito,
contornos escuros e sombras sólidas (estilo "sticker / neo-retro").

## Cores (da logo)

| Token | Hex | Uso |
|---|---|---|
| `--cm-blue` | `#7FB3DC` | Azul caneca — cor dominante, blocos e fundos de seção |
| `--cm-yellow` | `#FFD100` | Amarelo — CTAs, destaques, badges |
| `--cm-navy` | `#0B2C5E` | Azul escuro — texto, contornos, footer |
| `--cm-cream` | `#FFF6E3` | Creme — fundo base do site |
| `--cm-coral` | `#FF6B5A` | Coral — acento de energia (tags, promoções) |
| `--cm-mint` | `#9BD9C4` | Verde menta — acento secundário |
| `--cm-white` | `#FFFFFF` | Cards |

Regra: creme domina o fundo; azul e amarelo alternam em blocos de seção; coral e menta
aparecem em doses pequenas (badges, ícones, detalhes). Nunca gradiente roxo, nunca cinza puro.

## Tipografia

- **Display / títulos**: `Baloo 2` (700/800) — arredondada, divertida. Uppercase em headings curtos.
- **Script / destaque**: `Caveat Brush` — usada em 1-2 palavras por título e em selos.
- **Corpo / UI**: `Poppins` (400/500/600).

Escala: hero `clamp(2.75rem, 7vw, 5.5rem)`, h2 `clamp(2rem, 4vw, 3.25rem)`, corpo `1rem/1.7`.

## Componentes

- **Sticker card**: fundo branco, `border: 3px solid var(--cm-navy)`, `border-radius: 24px`,
  sombra sólida `6px 6px 0 var(--cm-navy)`. Hover: translada `-4px,-4px`, sombra `10px 10px 0`.
- **Botão primário**: fundo amarelo, texto navy, mesmo contorno + sombra sólida, `rounded-full`.
- **Botão secundário**: fundo azul, texto navy.
- **Badge/tag**: pill coral ou menta, texto navy, uppercase, `text-xs font-bold tracking-wide`.
- **Marquee**: faixa navy com texto amarelo rolando, separadores por ícone.
- **Blob/onda**: divisores de seção com SVG ondulado, nunca corte reto entre blocos coloridos.

## Layout

- Container `max-w-7xl`, padding lateral `px-5 md:px-8`.
- Grids assimétricos: hero 7/5, seções alternando alinhamento.
- Ritmo vertical generoso: `py-20 md:py-28` por seção.
- Elementos decorativos rotacionados levemente (`-2deg` a `3deg`) para o ar divertido.

## Motion

Uma orquestração no load: reveals escalonados (fade + translateY 16px, delay 60ms por item)
via CSS. Hover states rápidos (150ms). Marquee contínuo. Sem animações espalhadas.

## UX

- WhatsApp flutuante fixo no canto inferior direito em todas as páginas.
- Carrinho persistido em localStorage, drawer lateral.
- Todo estado de carregamento tem skeleton; botões de mutação desabilitam + spinner.
- Textos em português do Brasil.

## Placeholders pendentes do cliente

Logo PNG, fotos reais das canecas, número de WhatsApp, e-mail, cidade, preços definitivos.
