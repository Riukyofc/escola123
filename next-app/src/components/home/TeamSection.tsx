'use client';

import RevealSection from '@/components/ui/RevealSection';
import type { EquipeMembro } from '@/lib/types';

interface TeamSectionProps {
  equipe: EquipeMembro[];
}

export default function TeamSection({ equipe }: TeamSectionProps) {
  const items = equipe
    .filter(e => e.ativo !== false)
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  return (
    <section id="pub-equipe" className="py-20" style={{ background: 'var(--section-alt)' }}>
      <div className="max-w-5xl mx-auto px-4">
        <RevealSection>
          <div className="text-center mb-12">
            <div className="section-chip" style={{ background: '#fef3c7', color: '#d97706' }}>
              <i className="fa-solid fa-users" /> Equipe
            </div>
            <h2 className="text-2xl md:text-3xl font-black mt-3" style={{ color: 'var(--fg)' }}>
              Nossa Comunidade Escolar
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--fg-muted)' }}>
              Conheça os profissionais dedicados à formação de nossos alunos.
            </p>
          </div>
        </RevealSection>

        {items.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--fg-muted)' }}>
            <i className="fa-solid fa-users text-4xl opacity-30 block mb-3" />
            <div className="font-bold">Nenhum membro</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((e, i) => (
              <RevealSection key={e.id} delay={(i % 3 + 1) * 100}>
                <div className="team-card h-full">
                  <div
                    className="team-avatar"
                    style={{ background: `linear-gradient(135deg, ${e.cor1}, ${e.cor2})` }}
                  >
                    <i className={`fa-solid ${e.icone || 'fa-user'}`} />
                  </div>
                  <div className="font-bold text-sm mt-2" style={{ color: 'var(--fg)' }}>{e.nome}</div>
                  <div className="text-xs font-semibold mt-1" style={{ color: 'var(--fg-muted)' }}>{e.cargo}</div>
                  {e.descricao && (
                    <div className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--fg-muted)', opacity: 0.7 }}>
                      {e.descricao}
                    </div>
                  )}
                </div>
              </RevealSection>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
