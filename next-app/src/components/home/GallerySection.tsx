'use client';

import { useState } from 'react';
import RevealSection from '@/components/ui/RevealSection';
import type { GaleriaItem } from '@/lib/types';

interface GallerySectionProps {
  galeria: GaleriaItem[];
}

export default function GallerySection({ galeria }: GallerySectionProps) {
  const [lightbox, setLightbox] = useState<GaleriaItem | null>(null);
  const items = galeria
    .filter(g => g.ativo !== false)
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  return (
    <>
      <section id="pub-galeria" className="py-20" style={{ background: 'var(--section-alt)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <RevealSection>
            <div className="text-center mb-12">
              <div className="section-chip" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <i className="fa-solid fa-camera" /> Galeria
              </div>
              <h2 className="text-2xl md:text-3xl font-black mt-3" style={{ color: 'var(--fg)' }}>
                Momentos da Nossa Escola
              </h2>
              <p className="mt-3 text-sm" style={{ color: 'var(--fg-muted)' }}>
                Registros do dia a dia escolar, eventos e conquistas da comunidade.
              </p>
            </div>
          </RevealSection>

          {items.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--fg-muted)' }}>
              <i className="fa-solid fa-camera text-4xl opacity-30 block mb-3" />
              <div className="font-bold">Nenhuma foto</div>
            </div>
          ) : (
            <RevealSection>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map(g => (
                  <div
                    key={g.id}
                    className="gallery-item"
                    onClick={() => setLightbox(g)}
                  >
                    <div
                      className="gallery-placeholder"
                      style={{ background: `linear-gradient(135deg, ${g.corFundo1}, ${g.corFundo2})` }}
                    >
                      <i className={`fa-solid ${g.icone}`} style={{ fontSize: '2.5rem', color: g.corIcone }} />
                      <span>{g.titulo}</span>
                    </div>
                    <div className="gallery-overlay">
                      <i className="fa-solid fa-expand" />
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox-overlay open"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white text-2xl z-10"
            onClick={() => setLightbox(null)}
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <div
            className="w-[80vw] max-w-lg aspect-square rounded-2xl flex flex-col items-center justify-center gap-4"
            style={{ background: `linear-gradient(135deg, ${lightbox.corFundo1}, ${lightbox.corFundo2})` }}
            onClick={e => e.stopPropagation()}
          >
            <i className={`fa-solid ${lightbox.icone}`} style={{ fontSize: '4rem', color: lightbox.corIcone }} />
            <span className="font-bold text-lg" style={{ color: 'var(--fg)' }}>{lightbox.titulo}</span>
          </div>
        </div>
      )}
    </>
  );
}
