'use client';

import RevealSection from '@/components/ui/RevealSection';

export default function MapSection() {
  return (
    <section id="pub-mapa" className="py-20 pb-0" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-4">
        <RevealSection>
          <div className="text-center mb-12">
            <div className="section-chip" style={{ background: '#d1fae5', color: '#059669' }}>
              <i className="fa-solid fa-map-location-dot" /> Localização
            </div>
            <h2 className="text-2xl md:text-3xl font-black mt-3" style={{ color: 'var(--fg)' }}>
              Como Chegar
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--fg-muted)' }}>
              Viana, Maranhão — Brasil
            </p>
          </div>
        </RevealSection>

        <RevealSection>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15932.5!2d-44.99!3d-2.77!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7f58f1f2f2f2f2f%3A0x0!2sViana%2C%20MA!5e0!3m2!1spt-BR!2sbr!4v1"
              width="100%"
              height="350"
              style={{ border: 0, borderRadius: '16px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa da escola"
            />
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
