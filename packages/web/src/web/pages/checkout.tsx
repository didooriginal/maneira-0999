import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import {
  Barcode,
  CheckCircle2,
  CreditCard,
  Lock,
  QrCode,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "../components/cart-context";
import { useCreateOrder, useShippingOptions } from "../queries/catalog";
import { Spinner } from "../components/ui/bits";
import { formatPrice } from "../lib/site";
import { cn } from "../lib/utils";

type ShippingKey = "retirada" | "economico" | "expresso";
type PaymentKey = "pix" | "cartao" | "boleto";

interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDoc: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  notes: string;
}

const FREE_SHIPPING_FROM = 199;

const payments: { key: PaymentKey; label: string; hint: string; icon: typeof QrCode }[] = [
  { key: "pix", label: "Pix", hint: "5% de desconto na confirmação", icon: QrCode },
  { key: "cartao", label: "Cartão", hint: "até 3x sem juros", icon: CreditCard },
  { key: "boleto", label: "Boleto", hint: "compensa em até 2 dias úteis", icon: Barcode },
];

export default function CheckoutPage() {
  const cart = useCart();
  const [, navigate] = useLocation();
  const shipping = useShippingOptions();
  const createOrder = useCreateOrder();

  const [shippingMethod, setShippingMethod] = useState<ShippingKey>("economico");
  const [paymentMethod, setPaymentMethod] = useState<PaymentKey>("pix");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>();

  const freeShipping = cart.subtotal >= FREE_SHIPPING_FROM;
  const shippingPrice = useMemo(() => {
    const option = shipping.data?.find((o) => o.key === shippingMethod);
    return freeShipping ? 0 : (option?.price ?? 0);
  }, [shipping.data, shippingMethod, freeShipping]);

  const total = cart.subtotal + shippingPrice;

  async function onSubmit(values: CheckoutForm) {
    const result = await createOrder.mutateAsync({
      ...values,
      customerDoc: values.customerDoc || undefined,
      complement: values.complement || undefined,
      notes: values.notes || undefined,
      state: values.state.toUpperCase(),
      shippingMethod,
      paymentMethod,
      items: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        colorOption: i.colorOption,
        sizeOption: i.sizeOption,
        customText: i.customText,
      })),
    });
    cart.clear();
    navigate(`/pedido/${result.code}`);
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center md:px-8">
        <div className="mx-auto grid size-20 place-items-center rounded-full border-[3px] border-navy bg-blue">
          <ShoppingBag className="size-9" strokeWidth={2.5} />
        </div>
        <h1 className="mt-6 text-4xl">Carrinho vazio</h1>
        <p className="mt-3 text-navy/65">
          Coloca uma caneca no carrinho para finalizar o pedido.
        </p>
        <Link to="/catalogo" className="btn btn-primary mt-7">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
      <span className="tag bg-white">Checkout</span>
      <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)]">
        Falta pouco pra sua{" "}
        <span className="script text-magenta text-[1.1em]">caneca maneira</span>
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-start"
      >
        <div className="space-y-6">
          <fieldset className="sticker space-y-4 p-6">
            <legend className="font-display text-xl font-bold">
              1. Seus dados
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="customerName">
                  Nome completo
                </label>
                <input
                  id="customerName"
                  className="field"
                  placeholder="Como no documento"
                  {...register("customerName", { required: true, minLength: 3 })}
                />
                {errors.customerName ? (
                  <p className="mt-1 text-xs font-semibold text-magenta">
                    Informe seu nome completo
                  </p>
                ) : null}
              </div>
              <div>
                <label className="field-label" htmlFor="customerEmail">
                  E-mail
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  className="field"
                  placeholder="voce@email.com"
                  {...register("customerEmail", { required: true })}
                />
                {errors.customerEmail ? (
                  <p className="mt-1 text-xs font-semibold text-magenta">
                    E-mail inválido
                  </p>
                ) : null}
              </div>
              <div>
                <label className="field-label" htmlFor="customerPhone">
                  WhatsApp
                </label>
                <input
                  id="customerPhone"
                  className="field"
                  placeholder="(11) 90000-0000"
                  {...register("customerPhone", { required: true, minLength: 8 })}
                />
                {errors.customerPhone ? (
                  <p className="mt-1 text-xs font-semibold text-magenta">
                    Precisamos do WhatsApp para enviar a prova da arte
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="customerDoc">
                  CPF ou CNPJ (opcional)
                </label>
                <input id="customerDoc" className="field" {...register("customerDoc")} />
              </div>
            </div>
          </fieldset>

          <fieldset className="sticker space-y-4 p-6">
            <legend className="font-display text-xl font-bold">
              2. Entrega
            </legend>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="zip">CEP</label>
                <input
                  id="zip"
                  className="field"
                  placeholder="00000-000"
                  {...register("zip", { required: true, minLength: 5 })}
                />
              </div>
              <div className="sm:col-span-4">
                <label className="field-label" htmlFor="street">Rua</label>
                <input
                  id="street"
                  className="field"
                  {...register("street", { required: true })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="number">Número</label>
                <input
                  id="number"
                  className="field"
                  {...register("number", { required: true })}
                />
              </div>
              <div className="sm:col-span-4">
                <label className="field-label" htmlFor="complement">
                  Complemento
                </label>
                <input id="complement" className="field" {...register("complement")} />
              </div>
              <div className="sm:col-span-3">
                <label className="field-label" htmlFor="district">Bairro</label>
                <input
                  id="district"
                  className="field"
                  {...register("district", { required: true })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="city">Cidade</label>
                <input
                  id="city"
                  className="field"
                  {...register("city", { required: true })}
                />
              </div>
              <div className="sm:col-span-1">
                <label className="field-label" htmlFor="state">UF</label>
                <input
                  id="state"
                  maxLength={2}
                  className="field uppercase"
                  {...register("state", { required: true, minLength: 2 })}
                />
              </div>
            </div>

            {(errors.zip || errors.street || errors.number || errors.district || errors.city || errors.state) ? (
              <p className="text-xs font-semibold text-magenta">
                Preencha o endereço completo para calcularmos a entrega.
              </p>
            ) : null}

            <div className="grid gap-2 pt-2">
              {shipping.isLoading ? (
                <p className="text-sm text-navy/60">Carregando fretes...</p>
              ) : (
                shipping.data?.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setShippingMethod(option.key as ShippingKey)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border-[3px] px-4 py-3 text-left transition",
                      shippingMethod === option.key
                        ? "border-navy bg-yellow"
                        : "border-navy/20 bg-white hover:border-navy",
                    )}
                  >
                    <span>
                      <span className="block font-display font-bold">
                        {option.label}
                      </span>
                      <span className="block text-xs text-navy/60">
                        {option.eta}
                      </span>
                    </span>
                    <span className="font-display font-extrabold">
                      {freeShipping || option.price === 0
                        ? "Grátis"
                        : formatPrice(option.price)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </fieldset>

          <fieldset className="sticker space-y-4 p-6">
            <legend className="font-display text-xl font-bold">
              3. Pagamento
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {payments.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setPaymentMethod(option.key)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl border-[3px] px-4 py-3 text-left transition",
                    paymentMethod === option.key
                      ? "border-navy bg-blue"
                      : "border-navy/20 bg-white hover:border-navy",
                  )}
                >
                  <option.icon className="size-5" strokeWidth={2.5} />
                  <span className="font-display font-bold">{option.label}</span>
                  <span className="text-xs text-navy/60">{option.hint}</span>
                </button>
              ))}
            </div>
            <p className="flex items-center gap-2 text-xs text-navy/60">
              <Lock className="size-3.5" strokeWidth={2.5} />
              O pedido é registrado agora e enviamos o link de pagamento no
              WhatsApp junto com a prova da arte.
            </p>

            <div>
              <label className="field-label" htmlFor="notes">
                Observações do pedido (opcional)
              </label>
              <textarea
                id="notes"
                rows={3}
                className="field resize-y"
                placeholder="Data de entrega desejada, detalhes da arte, embalagem presente..."
                {...register("notes")}
              />
            </div>
          </fieldset>
        </div>

        <aside className="sticker sticky top-24 space-y-4 p-6">
          <h2 className="font-display text-xl font-bold">Resumo</h2>

          <ul className="space-y-3">
            {cart.items.map((item) => (
              <li key={item.key} className="flex gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-14 shrink-0 rounded-xl border-2 border-navy/15 object-cover"
                />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-xs text-navy/55">
                    {item.quantity}x ·{" "}
                    {[item.sizeOption, item.colorOption].filter(Boolean).join(" · ") ||
                      "Padrão"}
                  </p>
                </div>
                <span className="font-display font-bold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-1.5 border-t-[3px] border-dashed border-navy/20 pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete</span>
              <span className="font-semibold">
                {shippingPrice === 0 ? "Grátis" : formatPrice(shippingPrice)}
              </span>
            </div>
            {freeShipping ? (
              <p className="flex items-center gap-1.5 text-xs font-bold text-magenta">
                <CheckCircle2 className="size-3.5" strokeWidth={3} />
                Frete grátis aplicado
              </p>
            ) : null}
          </div>

          <div className="flex items-baseline justify-between border-t-[3px] border-navy pt-4">
            <span className="font-display text-lg font-bold">Total</span>
            <span className="font-display text-3xl font-extrabold">
              {formatPrice(total)}
            </span>
          </div>

          {createOrder.isError ? (
            <p className="rounded-2xl border-[3px] border-magenta bg-magenta/10 px-3 py-2 text-xs font-semibold text-magenta">
              Não conseguimos registrar o pedido. Tenta de novo ou chama no
              WhatsApp.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={createOrder.isPending}
            className="btn btn-primary w-full"
          >
            {createOrder.isPending ? (
              <>
                <Spinner />
                Registrando...
              </>
            ) : (
              "Finalizar pedido"
            )}
          </button>

          <p className="text-center text-xs text-navy/55">
            Você recebe a prova digital da arte antes da produção começar.
          </p>
        </aside>
      </form>
    </section>
  );
}
