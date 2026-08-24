import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Spinner } from "../ui/bits";
import { brl } from "./bits";

/**
 * Resumo dinâmico da tabela de preços + exportação em PDF.
 *
 * Tudo aqui é calculado a partir dos modelos que vêm do servidor, então
 * qualquer preço que o Diego salvar aparece no resumo e no PDF na hora.
 * O jsPDF é carregado sob demanda (import dinâmico) para não pesar o site
 * inteiro por causa de um botão que só o painel usa.
 */

export type Tier = { min: number; max: number; unit: number; label: string };

export type Modelo = {
  key: string;
  name: string;
  retailFrom: number;
  retailTo: number;
  retailRange: string;
  estimated: boolean;
  tiers: Tier[];
  editado: boolean;
};

function faixaTexto(modelo: Modelo) {
  return modelo.retailFrom === modelo.retailTo
    ? brl(modelo.retailFrom)
    : `${brl(modelo.retailFrom)} a ${brl(modelo.retailTo)}`;
}

/** Menor preço por unidade de um modelo (última faixa de atacado). */
function menorUnitario(modelo: Modelo) {
  return modelo.tiers.reduce(
    (min, tier) => Math.min(min, tier.unit),
    Number.POSITIVE_INFINITY,
  );
}

/** Desconto máximo do atacado em relação ao varejo mais alto. */
function descontoMax(modelo: Modelo) {
  const menor = menorUnitario(modelo);
  if (!Number.isFinite(menor) || modelo.retailTo <= 0) return 0;
  return Math.round((1 - menor / modelo.retailTo) * 100);
}

function hoje() {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ResumoPrecos({ modelos }: { modelos: Modelo[] }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const resumo = useMemo(() => {
    if (modelos.length === 0) return null;

    const varejoMin = Math.min(...modelos.map((m) => m.retailFrom));
    const varejoMax = Math.max(...modelos.map((m) => m.retailTo));
    const atacadoMin = Math.min(...modelos.map(menorUnitario));
    const editados = modelos.filter((m) => m.editado).length;

    const maisCaro = modelos.reduce((a, b) =>
      b.retailTo > a.retailTo ? b : a,
    );
    const maisBarato = modelos.reduce((a, b) =>
      b.retailFrom < a.retailFrom ? b : a,
    );
    const maiorDesconto = modelos.reduce((a, b) =>
      descontoMax(b) > descontoMax(a) ? b : a,
    );

    return {
      total: modelos.length,
      varejoMin,
      varejoMax,
      atacadoMin,
      editados,
      maisCaro,
      maisBarato,
      maiorDesconto,
    };
  }, [modelos]);

  async function baixarPdf() {
    setErro(null);
    setGerando(true);
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableMod.default;

      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const margem = 40;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Caneca Maneira — Tabela de preços", margem, 50);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(
        `Gerada em ${hoje()} · ${modelos.length} modelos · uso interno`,
        margem,
        68,
      );
      doc.setTextColor(0);

      // Resumo geral
      if (resumo) {
        autoTable(doc, {
          startY: 88,
          head: [["Resumo geral", ""]],
          body: [
            ["Modelos na tabela", String(resumo.total)],
            [
              "Varejo (menor / maior)",
              `${brl(resumo.varejoMin)} — ${brl(resumo.varejoMax)}`,
            ],
            ["Menor preço no atacado", brl(resumo.atacadoMin)],
            [
              "Mais em conta",
              `${resumo.maisBarato.name} (${brl(resumo.maisBarato.retailFrom)})`,
            ],
            [
              "Mais caro",
              `${resumo.maisCaro.name} (${brl(resumo.maisCaro.retailTo)})`,
            ],
            [
              "Maior desconto no atacado",
              `${resumo.maiorDesconto.name} (até ${descontoMax(resumo.maiorDesconto)}% off)`,
            ],
            ["Modelos com preço editado por você", String(resumo.editados)],
          ],
          theme: "grid",
          headStyles: { fillColor: [13, 62, 119], textColor: 255 },
          styles: { fontSize: 10, cellPadding: 6 },
          columnStyles: { 0: { cellWidth: 220, fontStyle: "bold" } },
          margin: { left: margem, right: margem },
        });
      }

      // Visão geral de varejo
      autoTable(doc, {
        startY:
          (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
            .finalY + 24,
        head: [["Modelo", "Varejo", "Atacado a partir de", "Desconto máx."]],
        body: modelos.map((modelo) => [
          modelo.name,
          faixaTexto(modelo),
          brl(menorUnitario(modelo)),
          `${descontoMax(modelo)}%`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [236, 0, 139], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 5 },
        margin: { left: margem, right: margem },
      });

      // Detalhe por modelo
      for (const modelo of modelos) {
        autoTable(doc, {
          startY:
            (doc as unknown as { lastAutoTable: { finalY: number } })
              .lastAutoTable.finalY + 22,
          head: [[`${modelo.name} — varejo ${faixaTexto(modelo)}`, "", ""]],
          body: modelo.tiers.map((tier) => [
            tier.label,
            `${tier.min} a ${tier.max === 100000 ? "+" : tier.max} un.`,
            `${brl(tier.unit)} / un.`,
          ]),
          theme: "grid",
          headStyles: { fillColor: [123, 199, 239], textColor: 20 },
          styles: { fontSize: 9, cellPadding: 5 },
          columnStyles: {
            1: { cellWidth: 110 },
            2: { cellWidth: 110, halign: "right" },
          },
          margin: { left: margem, right: margem },
        });
      }

      // Rodapé em todas as páginas
      const paginas = doc.getNumberOfPages();
      for (let i = 1; i <= paginas; i += 1) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          `Caneca Maneira · canecamaneira.com.br · página ${i} de ${paginas}`,
          margem,
          doc.internal.pageSize.getHeight() - 20,
        );
      }

      const data = new Date().toISOString().slice(0, 10);
      doc.save(`caneca-maneira-tabela-de-precos-${data}.pdf`);
    } catch {
      setErro("Não consegui gerar o PDF agora. Tenta de novo.");
    } finally {
      setGerando(false);
    }
  }

  if (!resumo) return null;

  const cards = [
    { label: "Modelos na tabela", valor: String(resumo.total), cor: "bg-yellow" },
    {
      label: "Varejo vai de",
      valor: `${brl(resumo.varejoMin)} a ${brl(resumo.varejoMax)}`,
      cor: "bg-blue",
    },
    {
      label: "Menor preço no atacado",
      valor: brl(resumo.atacadoMin),
      cor: "bg-mint",
    },
    {
      label: "Editados por você",
      valor: `${resumo.editados} de ${resumo.total}`,
      cor: "bg-magenta/25",
    },
  ];

  return (
    <div className="sticker mt-6 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-lg font-extrabold">
          Resumo de todos os preços
        </h3>
        <span className="tag bg-cream">Atualiza sozinho</span>
        <button
          type="button"
          className="btn btn-primary ml-auto !px-4 !py-2 !text-sm"
          disabled={gerando}
          onClick={() => void baixarPdf()}
        >
          {gerando ? (
            <>
              <Spinner /> Gerando...
            </>
          ) : (
            <>
              <Download className="size-4" /> Baixar PDF
            </>
          )}
        </button>
      </div>

      {erro ? (
        <p className="mt-3 rounded-2xl border-[3px] border-magenta bg-magenta/10 p-3 text-sm font-semibold">
          {erro}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border-[3px] border-navy p-3 ${card.cor}`}
          >
            <p className="font-display text-lg leading-tight font-extrabold">
              {card.valor}
            </p>
            <p className="mt-1 text-xs font-semibold">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 -mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="border-b-[3px] border-navy pb-2">Modelo</th>
              <th className="border-b-[3px] border-navy pb-2">Varejo</th>
              <th className="border-b-[3px] border-navy pb-2">
                Atacado a partir de
              </th>
              <th className="border-b-[3px] border-navy pb-2 text-right">
                Desconto máx.
              </th>
            </tr>
          </thead>
          <tbody>
            {modelos.map((modelo) => (
              <tr key={modelo.key} className="border-b border-navy/15">
                <td className="py-2 pr-3 font-semibold">
                  {modelo.name}
                  {modelo.editado ? (
                    <span className="ml-2 text-xs font-normal text-navy/55">
                      editado
                    </span>
                  ) : null}
                </td>
                <td className="py-2 pr-3">{faixaTexto(modelo)}</td>
                <td className="py-2 pr-3">{brl(menorUnitario(modelo))}</td>
                <td className="py-2 text-right font-semibold">
                  {descontoMax(modelo)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs text-navy/55">
        <FileText className="mt-0.5 size-4 shrink-0" />
        O PDF sai com o resumo, a visão geral e todas as faixas de atacado de
        cada modelo — bom para mandar para cliente empresa no WhatsApp.
      </p>
    </div>
  );
}
