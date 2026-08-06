import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import {
  Check,
  ChevronLeft,
  Minus,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useProduct } from "../queries/catalog";
import { useCart } from "../components/cart-context";
import { ProductCard } from "../components/product-card";
import { Skeleton, Stars } from "../components/ui/bits";
import { formatPrice, installments, whatsappLink } from "../lib/site";
import { cn } from "../lib/utils";

const perks = [
  { icon: Truck, text: "Frete grátis acima de R$ 199" },
  { icon: ShieldCheck, text: "Quebrou no transporte? Refazemos" },
  { icon: RefreshCcw, text: "Prova digital antes de produzir" },
];

export default function ProdutoPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const query = useProduct(slug);
  const cart = useCart();

  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = query.data?.product;

  useEffect(() => {
    if (!product) return;
    setColor(product.colorOptions[0] ?? null);
    setSize(product.sizeOptions[0] ?? null);
    setQuantity(1);
    setCustomText("");
  }, [product]);

  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(id);
  }, [added]);

  if (query.isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:px-8 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (query.isError || !product) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center md:px-8">
        <h1 className="text-4xl">Caneca não encontrada</h1>
        <p className="mt-3 text-navy/65">
          Essa página sumiu do balcão. Dá uma olhada no catálogo.
        </p>
        <Link to="/catalogo" className="btn btn-primary mt-7">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  function handleAdd() {
    if (!product) return;
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
      colorOption: color,
      sizeOption: size,
      customText: customText.trim() || null,
    });
    setAdded(true);
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pt-6 md:px-8">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1 text-sm font-semibold text-navy/60 transition hover:text-navy"
        >
          <ChevronLeft className="size-4" strokeWidth={3} />
          voltar ao catálogo
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-8 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
        <div className="reveal">
          <div className="sticker relative overflow-hidden bg-blue/30 p-0">
            <img
              src={product.image}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
              {product.badge ? (
                <span className="tag bg-yellow">{product.badge}</span>
              ) : null}
              {discount ? (
                <span className="tag bg-magenta text-white">-{discount}%</span>
              ) : null}
            </div>
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {perks.map((perk) => (
              <li
                key={perk.text}
                className="flex items-center gap-2 rounded-2xl border-[3px] border-navy/15 bg-white px-3 py-2.5 text-xs font-semibold"
              >
                <perk.icon className="size-4 shrink-0" strokeWidth={2.5} />
                {perk.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-3">
            <Stars value={product.rating} />
            <span className="text-sm text-navy/55">
              {product.rating.toFixed(1)} · {product.reviewCount} avaliações
            </span>
          </div>

          <h1 className="mt-3 text-[clamp(2rem,4.5vw,3.2rem)]">{product.name}</h1>
          <p className="mt-3 text-navy/75">{product.description}</p>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            {product.comparePrice ? (
              <span className="text-lg text-navy/40 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            ) : null}
            <span className="font-display text-5xl leading-none font-extrabold">
              {formatPrice(product.price)}
            </span>
            <span className="mb-1 text-sm text-navy/60">
              ou {installments(product.price)}
            </span>
          </div>

          <ul className="mt-6 space-y-2">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-magenta" strokeWidth={3} />
                {h}
              </li>
            ))}
          </ul>

          <div className="sticker mt-8 space-y-5 p-5">
            {product.sizeOptions.length > 0 ? (
              <div>
                <span className="field-label">Tamanho</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSize(option)}
                      className={cn(
                        "rounded-full border-[3px] border-navy px-4 py-1.5 text-sm font-bold transition",
                        size === option
                          ? "bg-navy text-cream"
                          : "bg-cream hover:bg-yellow",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.colorOptions.length > 0 ? (
              <div>
                <span className="field-label">Cor / acabamento</span>
                <div className="flex flex-wrap gap-2">
                  {product.colorOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setColor(option)}
                      className={cn(
                        "rounded-full border-[3px] border-navy px-4 py-1.5 text-sm font-bold transition",
                        color === option
                          ? "bg-navy text-cream"
                          : "bg-cream hover:bg-yellow",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.allowsCustomArt ? (
              <div>
                <label className="field-label" htmlFor="custom-text">
                  Nome ou frase na caneca (opcional)
                </label>
                <input
                  id="custom-text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value.slice(0, 60))}
                  placeholder="Ex.: Para a melhor mãe do mundo"
                  className="field"
                />
                <p className="mt-1.5 text-xs text-navy/55">
                  {customText.length}/60 · A arte final é enviada por WhatsApp
                  para sua aprovação antes de produzir.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border-[3px] border-navy bg-cream px-1.5 py-1">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid size-8 place-items-center rounded-full transition hover:bg-yellow"
                >
                  <Minus className="size-4" strokeWidth={3} />
                </button>
                <span className="min-w-8 text-center font-display text-lg font-bold">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setQuantity((q) => Math.min(500, q + 1))}
                  className="grid size-8 place-items-center rounded-full transition hover:bg-yellow"
                >
                  <Plus className="size-4" strokeWidth={3} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className={cn("btn flex-1", added ? "btn-blue" : "btn-primary")}
              >
                {added ? (
                  <>
                    <Check className="size-5" strokeWidth={3} />
                    Adicionado!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="size-5" strokeWidth={2.5} />
                    Adicionar ao carrinho · {formatPrice(product.price * quantity)}
                  </>
                )}
              </button>
            </div>

            <a
              href={whatsappLink(
                `Oi! Tenho interesse na ${product.name}. Pode me ajudar?`,
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-navy/65 underline underline-offset-4 transition hover:text-navy"
            >
              <FaWhatsapp className="size-4" />
              Tirar dúvida no WhatsApp
            </a>
          </div>

          {quantity >= 10 ? (
            <div className="mt-4 rounded-2xl border-[3px] border-navy bg-mint px-4 py-3 text-sm font-semibold">
              10+ unidades? Peça um{" "}
              <Link to="/orcamento" className="underline underline-offset-4">
                orçamento por volume
              </Link>{" "}
              e pague menos por peça.
            </div>
          ) : null}
        </div>
      </section>

      {query.data && query.data.related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
          <h2 className="text-3xl">
            Combina com essa{" "}
            <span className="script text-magenta text-[1.1em]">também</span>
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
