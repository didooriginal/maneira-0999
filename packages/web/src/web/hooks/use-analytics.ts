import { useEffect, useRef } from "react";
import { gaEvent, gaPageView } from "../lib/ga";

/**
 * Analytics do Runable (já injetado pelo plugin do Vite) + Google Analytics 4.
 * Usamos para medir o funil: visita -> orçamento -> WhatsApp.
 * Todo evento vai para os dois destinos, com o mesmo nome.
 */

declare global {
  interface Window {
    stonks?: {
      event: (name: string, props?: Record<string, unknown>) => void;
      view: (path?: string, props?: Record<string, unknown>) => void;
    };
  }
}

export function useAnalytics() {
  return {
    trackEvent: (name: string, props?: Record<string, unknown>) => {
      window.stonks?.event(name, props);
      gaEvent(name, props);
    },
    trackView: (path?: string, props?: Record<string, unknown>) => {
      window.stonks?.view(path, props);
      gaPageView(path ?? window.location.pathname);
    },
  };
}

/**
 * Registra a visualização da rota atual uma vez.
 * O ref evita contagem dobrada pelo StrictMode em desenvolvimento.
 */
export function usePageView(path: string, props?: Record<string, unknown>) {
  const sent = useRef<string | null>(null);

  useEffect(() => {
    // path vazio = ainda carregando os dados da rota; espera o título final.
    if (!path) return;
    if (sent.current === path) return;
    sent.current = path;
    window.stonks?.view(path, props);
    gaPageView(path);
    // Só na entrada da rota.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
}
