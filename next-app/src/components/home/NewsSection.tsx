'use client';

import RevealSection from '@/components/ui/RevealSection';
import type { Aviso } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface NewsSectionProps {
  avisos: Aviso[];
}

const tipoIcon: Record<string, string> = { info: 'fa-circle-info', urgente: 'fa-triangle-exclamation', sucesso: 'fa-circle-check', geral: 'fa-bullhorn' };
const tipoLabel: Record<string, string> = { info: 'Informativo', urgente: 'Urgente', sucesso: 'Destaque', geral: 'Geral' };

export default function NewsSection({ avisos }: NewsSectionProps) {
  const publicAvisos = avisos.filter(a => a.ativo && !a.turmaId);

  return (
    <section id="pub-avisos" className="py-20" style={{ background: 'var(--section-alt)' }}>
      <div className="max-w-5xl mx-auto px-4">
        <RevealSection>
          <div className="text-center mb-12">
            <div className="section-chip" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
              <i className="fa-solid fa-bell" /> Comunicados
            </div>
            <h2 className="text-2xl md:text-3xl font-black mt-3" style={{ color: 'var(--fg)' }}>
              Avisos e Comunicados
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--fg-muted)' }}>
              Fique por dentro de tudo que acontece na escola.
            </p>
          </div>
        </RevealSection>

        {publicAvisos.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--fg-muted)' }}>
            <i className="fa-solid fa-bell-slash text-4xl opacity-30 block mb-3" />
            <div className="font-bold">Nenhum aviso no momento</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publicAvisos.map((av, i) => (
              <RevealSection key={av.id} delay={(i % 3 + 1) * 100}>
                <div className={`aviso-card ${av.tipo || 'geral'}`}>
                  <span className={`aviso-badge badge-${av.tipo || 'geral'}`}>
                    <i className={`fa-solid ${tipoIcon[av.tipo] || 'fa-bullhorn'}`} />
                    {tipoLabel[av.tipo] || 'Geral'}
                  </span>
                  <div className="font-bold mt-3 text-sm" style={{ color: 'var(--fg)' }}>{av.titulo}</div>
                  <div className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{av.corpo}</div>
                  <div className="mt-3 text-xs flex items-center gap-1.5" style={{ color: 'var(--fg-muted)' }}>
                    <i className="fa-regular fa-calendar" />
                    {formatDate(av.dataCriacao)}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
