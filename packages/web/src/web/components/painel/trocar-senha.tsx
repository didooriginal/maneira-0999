import { useState } from "react";
import { Eye, EyeOff, KeyRound, Save, X } from "lucide-react";
import { useChangePassword } from "../../queries/admin";
import { Spinner } from "../ui/bits";
import { Aviso, Campo, mensagemDeErro } from "./bits";

/**
 * Troca da senha do painel.
 *
 * A senha nova é guardada no banco como hash (nunca em texto puro). Depois de
 * trocar, o painel já continua logado com a senha nova — sem precisar entrar
 * de novo.
 */
export function TrocarSenha({
  password,
  onTrocada,
}: {
  password: string;
  onTrocada: (nova: string) => void;
}) {
  const trocar = useChangePassword();

  const [aberto, setAberto] = useState(false);
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [vendo, setVendo] = useState(false);
  const [aviso, setAviso] = useState<
    { tipo: "ok" | "erro"; texto: string } | null
  >(null);

  function limpar() {
    setAtual("");
    setNova("");
    setConfirma("");
    setVendo(false);
  }

  async function salvar() {
    setAviso(null);

    if (!atual) {
      setAviso({ tipo: "erro", texto: "Digite a senha que você usa hoje." });
      return;
    }
    if (nova.trim().length < 8) {
      setAviso({
        tipo: "erro",
        texto: "A senha nova precisa ter pelo menos 8 caracteres.",
      });
      return;
    }
    if (!/[a-zA-Z]/.test(nova) || !/[0-9]/.test(nova)) {
      setAviso({ tipo: "erro", texto: "Misture letras e números na senha nova." });
      return;
    }
    if (nova !== confirma) {
      setAviso({ tipo: "erro", texto: "As duas senhas novas não são iguais." });
      return;
    }

    try {
      await trocar.mutateAsync({
        password: atual,
        novaSenha: nova.trim(),
      });
      onTrocada(nova.trim());
      limpar();
      setAberto(false);
      setAviso({
        tipo: "ok",
        texto:
          "Senha trocada! A antiga não funciona mais. Anote a nova em lugar seguro.",
      });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(error) });
    }
  }

  const tipoCampo = vendo ? "text" : "password";

  return (
    <div className="mt-12 border-t-[3px] border-dashed border-navy/20 pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl border-[3px] border-navy bg-cream">
          <KeyRound className="size-5" strokeWidth={2.5} />
        </span>
        <div className="mr-auto">
          <h3 className="font-display text-lg font-extrabold">
            Senha do painel
          </h3>
          <p className="text-xs text-navy/60">
            Troque de vez em quando, principalmente se alguém que não trabalha
            mais com você souber a senha.
          </p>
        </div>
        <button
          type="button"
          className={aberto ? "btn btn-ghost" : "btn btn-blue"}
          onClick={() => {
            setAberto((v) => !v);
            setAviso(null);
            limpar();
          }}
        >
          {aberto ? (
            <>
              <X className="size-4" /> Cancelar
            </>
          ) : (
            <>
              <KeyRound className="size-4" /> Trocar senha
            </>
          )}
        </button>
      </div>

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {aberto ? (
        <div className="sticker mt-4 max-w-xl p-5">
          <div className="grid gap-4">
            <Campo label="Senha de agora">
              <input
                className="field"
                type={tipoCampo}
                autoComplete="current-password"
                value={atual}
                onChange={(event) => setAtual(event.target.value)}
              />
            </Campo>

            <Campo
              label="Senha nova"
              hint="Pelo menos 8 caracteres, com letras e números."
            >
              <input
                className="field"
                type={tipoCampo}
                autoComplete="new-password"
                value={nova}
                onChange={(event) => setNova(event.target.value)}
              />
            </Campo>

            <Campo label="Repita a senha nova">
              <input
                className="field"
                type={tipoCampo}
                autoComplete="new-password"
                value={confirma}
                onChange={(event) => setConfirma(event.target.value)}
              />
            </Campo>

            <button
              type="button"
              className="inline-flex w-fit items-center gap-2 text-xs font-bold text-navy/60 underline"
              onClick={() => setVendo((v) => !v)}
            >
              {vendo ? (
                <>
                  <EyeOff className="size-4" /> Esconder o que digitei
                </>
              ) : (
                <>
                  <Eye className="size-4" /> Ver o que digitei
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary mt-5"
            disabled={trocar.isPending}
            onClick={() => void salvar()}
          >
            {trocar.isPending ? (
              <>
                <Spinner /> Salvando...
              </>
            ) : (
              <>
                <Save className="size-4" /> Salvar senha nova
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-navy/55">
            Se um dia você esquecer, dá para entrar com a senha de reserva que
            fica guardada no servidor — é só me chamar.
          </p>
        </div>
      ) : null}
    </div>
  );
}
