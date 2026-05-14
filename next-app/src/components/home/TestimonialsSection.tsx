'use client';

import RevealSection from '@/components/ui/RevealSection';
import type { Depoimento } from '@/lib/types';

interface TestimonialsSectionProps {
  depoimentos: Depoimento[];
}

export default function TestimonialsSection({ depoimentos }: TestimonialsSectionProps) {
  const items = depoimentos
    .filter(d => d.ativo !== false)
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  return (
    <section id="pub-depoimentos" className="py-20" style={{ background: 'var(--section-alt)' }}>
      <div className="max-w-5xl mx-auto px-4">
        <RevealSection>
          <div className="text-center mb-12">
            <div className="section-chip" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed' }}>
              <i className="fa-solid fa-quote-left" /> Depoimentos
            </div>
            <h2 className="text-2xl md:text-3xl font-black mt-3" style={{ color: 'var(--fg)' }}>
              O que dizem sobre nós
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--fg-muted)' }}>
              Vozes da nossa comunidade escolar.
            </p>
          </div>
        </RevealSection>

        {items.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--fg-muted)' }}>
            <i className="fa-solid fa-quote-left text-4xl opacity-30 block mb-3" />
            <div className="font-bold">Nenhum depoimento</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((d, i) => (
              <RevealSection key={d.id} delay={(i % 3 + 1) * 100}>
                <div className="testimonial-card h-full flex flex-col">
                  <div className="text-accent/20 mb-3">
                    <i className="fa-solid fa-quote-left text-2xl" />
                  </div>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--fg-muted)' }}>
                    {d.texto}
                  </p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
                    <div
                      className="testimonial-avatar"
                      style={{ background: `linear-gradient(135deg, ${d.cor1}, ${d.cor2})` }}
                    >
                      {d.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--fg)' }}>{d.nome}</div>
                      <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{d.cargo}</div>
                    </div>
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
