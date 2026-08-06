import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Copy, PartyPopper } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { orpc } from "../lib/api";
import { Skeleton } from "../components/ui/bits";
import { formatPrice, whatsappLink } from "../lib/site";

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  boleto: "Boleto bancário",
};

const shippingLabels: Record<string, string> = {
  retirada: "Retirar no ateliê",
  economico: "Envio econômico",
  expresso: "Envio expresso",
};

export default function PedidoPage() {
  const { code = "" } = useParams<{ code: string }>();
  const query = useQuery(
    orpc.checkout.orderByCode.queryOptions({ input: { code } }),
  );

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-16 md:px-8">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center md:px-8">
        <h1 className="text-4xl">Pedido não encontrado</h1>
        <p className="mt-3 text-navy/65">
          Confere o código ou chama a gente no WhatsApp que localizamos pra você.
        </p>
        <Link to="/" className="btn btn-primary mt-7">
          Voltar para o início
        </Link>
      </div>
    );
  }

  const { order, items } = query.data;

  return (
    <section className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <div className="sticker relative overflow-hidden bg-yellow p-8 text-center md:p-12">
        <div className="pointer-events-none absolute -top-14 -right-10 size-44 rounded-full bg-magenta/25" />
        <div className="relative">
          <span className="mx-auto grid size-16 place-items-center rounded-full border-[3px] border-navy bg-white">
            <PartyPopper className="size-8" strokeWidth={2.5} />
          </span>
          <h1 className="mt-5 text-[clamp(2rem,5vw,3rem)]">
            Pedido feito!{" "}
            <span className="script text-magenta text-[1.1em]">valeu</span>
          </h1>
          <p className="mt-3 text-navy/75">
            Recebemos seu pedido. Em até 24h enviamos a prova digital da arte no
            seu WhatsApp junto com o link de pagamento.
          </p>

          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(order.code)}
            className="btn btn-ghost mt-6 font-mono"
          >
            <Copy className="size-4" strokeWidth={2.5} />
            {order.code}
          </button>
        </div>
      </div>

      <div className="sticker mt-6 p-6">
        <h2 className="font-display text-xl font-bold">O que você pediu</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <img
                src={item.productImage}
                alt={item.productName}
                className="size-16 shrink-0 rounded-xl border-2 border-navy/15 object-cover"
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{item.productName}</p>
                <p className="text-xs text-navy/55">
                  {item.quantity}x ·{" "}
                  {[item.sizeOption, item.colorOption].filter(Boolean).join(" · ") ||
                    "Padrão"}
                </p>
                {item.customText ? (
                  <p className="script text-sm text-magenta">“{item.customText}”</p>
                ) : null}
              </div>
              <span className="font-display font-bold">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-1.5 border-t-[3px] border-dashed border-navy/20 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{shippingLabels[order.shippingMethod] ?? "Frete"}</dt>
            <dd className="font-semibold">
              {order.shippingPrice === 0 ? "Grátis" : formatPrice(order.shippingPrice)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Pagamento</dt>
            <dd className="font-semibold">
              {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t-[3px] border-navy pt-3">
            <dt className="font-display text-lg font-bold">Total</dt>
            <dd className="font-display text-2xl font-extrabold">
              {formatPrice(order.total)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-2xl border-[3px] border-navy/15 bg-cream p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4 text-magenta" strokeWidth={3} />
            Entrega para
          </p>
          <p className="mt-1.5 text-navy/70">
            {order.customerName} · {order.customerPhone}
            <br />
            {order.street}, {order.number}
            {order.complement ? ` — ${order.complement}` : ""} · {order.district}
            <br />
            {order.city}/{order.state} · CEP {order.zip}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={whatsappLink(`Oi! Fiz o pedido ${order.code} no site.`)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-blue"
          >
            <FaWhatsapp className="size-4" />
            Falar sobre o pedido
          </a>
          <Link to="/catalogo" className="btn btn-ghost">
            Continuar comprando
          </Link>
        </div>
      </div>
    </section>
  );
}
