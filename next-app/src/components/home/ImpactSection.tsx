'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import RevealSection from '@/components/ui/RevealSection';

interface ImpactSectionProps {
  stats: { alunos: number; turmas: number; profs: number; disciplinas: number };
}

function AnimatedCounter({ target, label, icon, suffix }: { target: number; label: string; icon: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(0, target, {
        duration: 2,
        ease: 'easeOut',
        onUpdate: (val) => {
          if (ref.current) ref.current.textContent = Math.round(val).toString() + (suffix || '');
        }
      });
      return () => controls.stop();
    }
  }, [inView, target, suffix]);

  return (
    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <i className={`fa-solid ${icon}`} style={{ color: '#fbbf24', fontSize: '1.2rem' }} />
      </div>
      <div ref={ref} className="impact-num">0</div>
      <div className="impact-label">{label}</div>
    </div>
  );
}

export default function ImpactSection({ stats }: ImpactSectionProps) {
  return (
    <section id="pub-numeros" className="impact-section" style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative orbs */}
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent)', top: -80, right: -80, filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.1), transparent)', bottom: -60, left: -60, filter: 'blur(60px)' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>
              <i className="fa-solid fa-chart-line" /> Nossos Números
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              Impacto Real na Educação
            </h2>
          </div>
        </RevealSection>
        <RevealSection delay={100}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
            <AnimatedCounter target={stats.alunos} label="Alunos Matriculados" icon="fa-user-graduate" />
            <AnimatedCounter target={stats.turmas} label="Turmas Ativas" icon="fa-chalkboard" />
            <AnimatedCounter target={stats.profs} label="Professores" icon="fa-chalkboard-user" />
            <AnimatedCounter target={stats.disciplinas} label="Disciplinas" icon="fa-layer-group" />
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
