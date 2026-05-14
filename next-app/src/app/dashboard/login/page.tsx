'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, register, error, loading, clearError, firebaseUser, session, availableRoles, enterDashboard, userData, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [regCpf, setRegCpf] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regSenha2, setRegSenha2] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  // cpfStatus removed — unused for now
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redirect if already in session
  useEffect(() => {
    if (session) {
      const path = session.role === 'secretaria' ? 'semed' : session.role;
      router.push(`/dashboard/${path}`);
    }
  }, [session, router]);

  // Show role selector if multiple roles
  const showRoleSelector = firebaseUser && !session && availableRoles.length > 1;

  // Particles canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: { x: number; y: number; r: number; dx: number; dy: number; o: number }[] = [];
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5, dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4, o: Math.random() * 0.3 + 0.1,
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${p.o})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) return;
    await login(email, senha);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCpf || regCpf.replace(/\D/g, '').length !== 11) return;
    if (!regEmail) return;
    if (regSenha.length < 6) return;
    if (regSenha !== regSenha2) return;
    await register(regCpf, regEmail, regSenha);
  };

  const formatCPF = (v: string) => {
    let d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length > 9) d = d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    else if (d.length > 6) d = d.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (d.length > 3) d = d.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return d;
  };

  const roleConfig: Record<string, { icon: string; label: string; desc: string; color: string }> = {
    aluno: { icon: 'fa-user-graduate', label: 'Painel do Aluno', desc: 'Ver notas, frequência e avisos', color: '#059669' },
    professor: { icon: 'fa-chalkboard-user', label: 'Painel do Professor', desc: 'Lançar notas, diário, atividades', color: '#2563eb' },
    diretor: { icon: 'fa-crown', label: 'Painel da Direção', desc: 'Gestão completa da escola', color: '#d97706' },
    secretaria: { icon: 'fa-building-columns', label: 'Painel da Secretaria', desc: 'Macrogestão e indicadores', color: '#991b1b' },
  };

  return (
    <div id="login-screen" style={{ display: 'flex' }}>
      <canvas ref={canvasRef} className="login-particles-canvas" />
      <div className="login-grid-bg" />
      <div className="login-glow" />
      <div className="login-glow-2" />

      {/* Loading overlay */}
      {loading && firebaseUser && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(6,14,28,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <i className="fa-solid fa-spinner spin" style={{ fontSize: '2.5rem', color: 'var(--color-accent-light)' }} />
          <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.9rem' }}>Carregando seus dados...</div>
        </div>
      )}

      {/* Role Selector */}
      {showRoleSelector ? (
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon" style={{ background: 'linear-gradient(135deg, #059669, #2563eb)' }}><i className="fa-solid fa-shield-halved" /></div>
            <div className="login-school-name">Olá, {userData?.nome?.split(' ')[0] || 'Usuário'}!</div>
            <div className="login-school-sub">Escolha o painel que deseja acessar</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {availableRoles.map(role => {
              const cfg = roleConfig[role];
              return (
                <button key={role} onClick={() => enterDashboard(role)}
                  className="hero-access-item"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', width: '100%', color: '#fff' }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${cfg.color}22`, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    <i className={`fa-solid ${cfg.icon}`} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{cfg.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.72rem' }}>{cfg.desc}</div>
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '.72rem' }} />
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <button onClick={logout} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.82rem', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <i className="fa-solid fa-right-from-bracket" /> Sair
            </button>
          </div>
        </div>
      ) : (
        /* Login / Register Card */
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon"><i className="fa-solid fa-school" /></div>
            <div className="login-school-name">U.E. Professora Edith Nair<br />Furtado da Silva</div>
            <div className="login-school-sub">Portal Escolar · Viana — MA</div>
            <div className="login-semed"><i className="fa-solid fa-building-columns" /> Secretaria Municipal de Educação</div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 4 }}>
            <button type="button" className={`role-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); clearError(); }} style={{ flex: 1, borderRadius: 8 }}>
              <i className="fa-solid fa-right-to-bracket" /> Entrar
            </button>
            <button type="button" className={`role-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); clearError(); }} style={{ flex: 1, borderRadius: 8 }}>
              <i className="fa-solid fa-user-plus" /> Criar Conta
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error" style={{ display: 'flex' }}>
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="login-field">
                <label className="login-label">Email</label>
                <input type="email" className="login-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
              </div>
              <div className="login-field">
                <label className="login-label">Senha</label>
                <div className="login-input-wrap">
                  <input type={showPwd ? 'text' : 'password'} className="login-input" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite sua senha" autoComplete="current-password" />
                  <button type="button" className="login-eye-btn" onClick={() => setShowPwd(!showPwd)}>
                    <i className={`fa-solid ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner spin" /> Entrando...</> : <><i className="fa-solid fa-right-to-bracket" /> Entrar no Portal</>}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="login-field">
                <label className="login-label">CPF do Aluno</label>
                <input type="text" className="login-input" value={regCpf} onChange={e => setRegCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} autoComplete="off" />
              </div>
              <div className="login-field">
                <label className="login-label">Email</label>
                <input type="email" className="login-input" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
              </div>
              <div className="login-field">
                <label className="login-label">Senha</label>
                <div className="login-input-wrap">
                  <input type={showRegPwd ? 'text' : 'password'} className="login-input" value={regSenha} onChange={e => setRegSenha(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                  <button type="button" className="login-eye-btn" onClick={() => setShowRegPwd(!showRegPwd)}>
                    <i className={`fa-solid ${showRegPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
              <div className="login-field">
                <label className="login-label">Confirmar Senha</label>
                <input type="password" className="login-input" value={regSenha2} onChange={e => setRegSenha2(e.target.value)} placeholder="Repita a senha" autoComplete="new-password" />
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner spin" /> Criando conta...</> : <><i className="fa-solid fa-user-plus" /> Criar Minha Conta</>}
              </button>
            </form>
          )}

          <div className="login-back-link">
            <Link href="/"><i className="fa-solid fa-arrow-left" /> Voltar ao site</Link>
          </div>
        </div>
      )}
    </div>
  );
}

