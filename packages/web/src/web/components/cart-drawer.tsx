import { Link } from "wouter";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "./cart-context";
import { formatPrice } from "../lib/site";

const FREE_SHIPPING_FROM = 199;

export function CartDrawer() {
  const cart = useCart();
  const missing = Math.max(0, FREE_SHIPPING_FROM - cart.subtotal);
  const progress = Math.min(100, (cart.subtotal / FREE_SHIPPING_FROM) * 100);

  if (!cart.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Fechar carrinho"
        onClick={cart.close}
        className="absolute inset-0 bg-navy/45 backdrop-blur-[2px]"
      />
      <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l-[3px] border-navy bg-cream shadow-[-10px_0_0_rgba(11,44,94,0.12)]">
        <header className="flex items-center justify-between border-b-[3px] border-navy bg-yellow px-5 py-4">
          <h3 className="flex items-center gap-2 text-2xl">
            <ShoppingBag className="size-6" strokeWidth={2.5} />
            Seu carrinho
          </h3>
          <button
            type="button"
            onClick={cart.close}
            aria-label="Fechar"
            className="rounded-full border-[3px] border-navy bg-white p-1.5 transition hover:bg-cream"
          >
            <X className="size-4" strokeWidth={3} />
          </button>
        </header>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid size-20 place-items-center rounded-full border-[3px] border-navy bg-blue">
              <ShoppingBag className="size-9" strokeWidth={2.5} />
            </div>
            <p className="font-display text-2xl">Carrinho vazio</p>
            <p className="text-sm text-navy/70">
              Escolhe uma caneca maneira e volta aqui.
            </p>
            <Link to="/catalogo" onClick={cart.close} className="btn btn-primary">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b-[3px] border-navy/15 bg-white px-5 py-3">
              {missing > 0 ? (
                <p className="text-xs font-semibold">
                  Faltam <strong>{formatPrice(missing)}</strong> para frete grátis
                </p>
              ) : (
                <p className="text-xs font-bold text-magenta">
                  Frete grátis liberado
                </p>
              )}
              <div className="mt-2 h-2.5 overflow-hidden rounded-full border-2 border-navy bg-cream">
                <div
                  className="h-full rounded-full bg-magenta transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cart.items.map((item) => (
                <li key={item.key} className="sticker flex gap-3 p-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-20 shrink-0 rounded-xl border-2 border-navy/15 bg-cream object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base leading-tight font-bold">
                      {item.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-navy/60">
                      {[item.sizeOption, item.colorOption]
                        .filter(Boolean)
                        .join(" · ") || "Padrão"}
                    </p>
                    {item.customText ? (
                      <p className="script mt-0.5 truncate text-sm text-magenta">
                        “{item.customText}”
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-full border-2 border-navy bg-cream">
                        <button
                          type="button"
                          aria-label="Diminuir"
                          onClick={() =>
                            cart.setQuantity(item.key, item.quantity - 1)
                          }
                          className="grid size-7 place-items-center rounded-full transition hover:bg-yellow"
                        >
                          <Minus className="size-3" strokeWidth={3} />
                        </button>
                        <span className="min-w-5 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar"
                          onClick={() =>
                            cart.setQuantity(item.key, item.quantity + 1)
                          }
                          className="grid size-7 place-items-center rounded-full transition hover:bg-yellow"
                        >
                          <Plus className="size-3" strokeWidth={3} />
                        </button>
                      </div>
                      <span className="font-display font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        type="button"
                        aria-label="Remover"
                        onClick={() => cart.remove(item.key)}
                        className="text-navy/40 transition hover:text-magenta"
                      >
                        <Trash2 className="size-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-3 border-t-[3px] border-navy bg-white px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">Subtotal</span>
                <span className="font-display text-2xl font-extrabold">
                  {formatPrice(cart.subtotal)}
                </span>
              </div>
              <Link
                to="/checkout"
                onClick={cart.close}
                className="btn btn-primary w-full"
              >
                Finalizar pedido
              </Link>
              <button
                type="button"
                onClick={cart.close}
                className="w-full text-center text-xs font-semibold text-navy/60 underline underline-offset-4"
              >
                continuar comprando
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
