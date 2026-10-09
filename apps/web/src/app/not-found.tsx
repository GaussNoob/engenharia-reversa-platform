import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/Brand";
import styles from "./not-found.module.css";
export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};
export default function NotFound() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Brand />
        <Link className="text-link" href="/entrar">
          Entrar no Núcleo <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            HTTP / 404 · ENDEREÇO NÃO RESOLVIDO
          </span>
          <h1>
            Este caminho
            <br />
            não leva a uma página<span>.</span>
          </h1>
          <p>
            O endereço pode ter mudado ou ter sido digitado incorretamente. Você
            pode voltar ao início ou encontrar uma nova bancada para explorar.
          </p>
          <div className={styles.actions}>
            <Link className="button" href="/">
              <ArrowLeft size={16} aria-hidden="true" />
              Voltar ao início
            </Link>
            <Link className="button button-secondary" href="/laboratorios">
              Explorar laboratórios
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={styles.diagram} aria-hidden="true">
          <div className={styles.address}>
            OFFSET <span>0x00000194</span>
          </div>
          <div className={styles.number}>
            404<span>_</span>
          </div>
          <div className={styles.trace}>
            <span>REFERÊNCIA NÃO ENCONTRADA</span>
            <i />
            <span>NULL</span>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
        <span>Núcleo — Engenharia Reversa</span>
        <span>Continue investigando.</span>
      </footer>
    </div>
  );
}
