"use client";

// Botão por agora sem funcionalidade — só a marcar o lugar para quando existirem dados de equipas.
export default function AdminEquipas({ transparente }: { transparente?: boolean }) {
  return (
    <button
      type="button"
      disabled
      title="Brevemente disponível"
      className={
        transparente
          ? "cursor-not-allowed rounded-lg border border-dashed border-line bg-surface px-3 py-1.5 text-center text-sm font-medium text-inksoft"
          : "cursor-not-allowed rounded-lg border border-line px-3 py-1.5 text-left text-sm font-medium text-inksoft"
      }
    >
      Equipas
    </button>
  );
}
