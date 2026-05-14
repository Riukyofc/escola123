'use client';

import RevealSection from '@/components/ui/RevealSection';
import Image from 'next/image';

const pillars = [
  { icon: 'fa-users', title: 'Comunidade Unida', desc: 'Alunos, professores, pais e diretores trabalhando juntos para o crescimento de todos.', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { icon: 'fa-seedling', title: 'Educação de Qualidade', desc: 'Ensino dedicado ao desenvolvimento integral dos nossos estudantes.', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { icon: 'fa-star', title: 'Inclusão & Acessibilidade', desc: 'AEE — Atendimento Educacional Especializado para todos os que precisam.', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { icon: 'fa-award', title: 'Gestão Transparente', desc: 'Notas, frequência e comunicados acessíveis para alunos e responsáveis.', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
];

export default function AboutSection() {
  return (
    <section id="pub-sobre" style={{ background: 'var(--bg)', padding: '80px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-chip">
              <i className="fa-solid fa-school" /> Nossa Escola
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: 'var(--fg)', marginTop: 12, lineHeight: 1.2 }}>
              Sobre a U.E. Professora Edith Nair
            </h2>
            <p style={{ marginTop: 14, maxWidth: 600, margin: '14px auto 0', fontSize: '.92rem', color: 'var(--fg-muted)', lineHeight: 1.7 }}>
              Uma escola comprometida com a excelência na educação, formando cidadãos críticos e preparados para o futuro. Localizada em Viana — MA, somos referência em ensino público de qualidade.
            </p>
          </div>
        </RevealSection>

        {/* Hero Image + Info Row */}
        <RevealSection delay={100}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center', marginBottom: 48 }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '16/10', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}>
              <Image src="/img/banner-escola.png" alt="Escola Edith Nair" fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--fg)', marginBottom: 12 }}>
                <i className="fa-solid fa-graduation-cap" style={{ color: '#2563eb', marginRight: 8 }} />
                Educação para Transformar
              </h3>
              <p style={{ fontSize: '.88rem', color: 'var(--fg-muted)', lineHeight: 1.8, marginBottom: 16 }}>
                Nossa missão é oferecer uma educação inclusiva, moderna e comprometida com o desenvolvimento humano integral. Com professores dedicados e infraestrutura em constante evolução, preparamos nossos alunos não apenas para provas, mas para a vida.
              </p>
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { num: '20+', label: 'Anos de história' },
                  { num: '100%', label: 'Público' },
                  { num: 'AEE', label: 'Inclusivo' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, background: 'linear-gradient(135deg, #2563eb, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{item.num}</div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {pillars.map((f, i) => (
            <RevealSection key={f.title} delay={(i + 1) * 100}>
              <div className="feature-card" style={{ height: '100%' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: f.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: `0 4px 12px ${f.gradient.includes('#3b82f6') ? 'rgba(59,130,246,.25)' : f.gradient.includes('#10b981') ? 'rgba(16,185,129,.25)' : f.gradient.includes('#f59e0b') ? 'rgba(245,158,11,.25)' : 'rgba(239,68,68,.25)'}` }}>
                  <i className={`fa-solid ${f.icon}`} style={{ color: '#fff', fontSize: '1rem' }} />
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"],
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
