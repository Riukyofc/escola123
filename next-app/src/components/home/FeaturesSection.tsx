'use client';

import RevealSection from '@/components/ui/RevealSection';

const features = [
  { icon: 'fa-chart-bar', title: 'Notas por Bimestre', desc: 'Acompanhe o desempenho em todos os bimestres e veja a nota anual calculada automaticamente.', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', shadow: 'rgba(59,130,246,.2)' },
  { icon: 'fa-calendar-check', title: 'Diário Digital', desc: 'Professores registram conteúdos, frequência e observações de forma organizada e segura.', gradient: 'linear-gradient(135deg, #10b981, #34d399)', shadow: 'rgba(16,185,129,.2)' },
  { icon: 'fa-heart-pulse', title: 'AEE Integrado', desc: 'Planos de atendimento educacional especializado acessíveis diretamente no painel do professor.', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)', shadow: 'rgba(236,72,153,.2)' },
  { icon: 'fa-crown', title: 'Painel do Diretor', desc: 'Gestão completa: alunos, professores, turmas, turnos e controle de lançamento de notas.', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', shadow: 'rgba(245,158,11,.2)' },
  { icon: 'fa-lock', title: 'Controle de Acesso', desc: 'O diretor pode fechar o sistema para impedir edições de notas ao final de cada bimestre.', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)', shadow: 'rgba(124,58,237,.2)' },
  { icon: 'fa-bell', title: 'Avisos em Tempo Real', desc: 'Comunicados da direção chegam imediatamente para professores, alunos e responsáveis.', gradient: 'linear-gradient(135deg, #ef4444, #f87171)', shadow: 'rgba(239,68,68,.2)' },
];

export default function FeaturesSection() {
  return (
    <section id="pub-features" style={{ background: 'var(--bg)', padding: '80px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-chip">
              <i className="fa-solid fa-laptop-code" /> Sistema
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: 'var(--fg)', marginTop: 12, lineHeight: 1.2 }}>
              O que você encontra no Portal
            </h2>
            <p style={{ marginTop: 14, fontSize: '.92rem', color: 'var(--fg-muted)', lineHeight: 1.7 }}>
              Um sistema completo para toda a comunidade escolar.
            </p>
          </div>
        </RevealSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <RevealSection key={f.title} delay={(i % 3 + 1) * 100}>
              <div className="feature-card" style={{ height: '100%' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: f.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                  boxShadow: `0 4px 12px ${f.shadow}`,
                }}>
                  <i className={`fa-solid ${f.icon}`} style={{ color: '#fff', fontSize: '1rem' }} />
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
