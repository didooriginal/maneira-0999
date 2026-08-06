import { Link } from "wouter";
import { Coffee } from "lucide-react";

export default function NaoEncontradoPage() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center">
      <div className="sticker grain relative w-full overflow-hidden bg-blue p-10">
        <Coffee className="mx-auto size-14 floaty" />
        <strong className="mt-4 block font-display text-6xl">404</strong>
        <h1 className="mt-2 text-3xl">
          Essa página{" "}
          <span className="script text-magenta text-[1.15em]">quebrou</span>
        </h1>
        <p className="mt-3 text-navy/75">
          A caneca caiu da bancada. Mas temos várias outras inteirinhas
          esperando por você.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/catalogo" className="btn btn-primary">
            Ver o catálogo
          </Link>
          <Link href="/" className="btn btn-ghost">
            Voltar pra home
          </Link>
        </div>
      </div>
    </div>
  );
}
