'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface HeroSectionProps {
  stats: { turmas: number; alunos: number; profs: number };
}

export default function HeroSection({ stats }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const slides = ['/img/banner-1.svg', '/img/banner-2.svg'];

  const moveSlide = useCallback((dir: number) => {
    setCurrentSlide(prev => (prev + dir + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play carousel
  useEffect(() => {
    intervalRef.current = setInterval(() => moveSlide(1), 5000);
    return () => clearInterval(intervalRef.current);
  }, [moveSlide]);

  const goToSlide = (i: number) => {
    setCurrentSlide(i);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => moveSlide(1), 5000);
  };

  // Particles canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: { x: number; y: number; r: number; dx: number; dy: number; opacity: number }[] = [];
    const PARTICLE_COUNT = 50;
    let animId: number;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${p.opacity})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(37,99,235,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section id="pub-hero" className="hero-section">
      {/* Particles */}
      <canvas ref={canvasRef} className="hero-particles" />

      {/* Orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 w-full">
        {/* SR-only heading for SEO */}
        <div className="sr-only">
          <h1>O Futuro do seu Filho está Aqui!</h1>
          <p>Bem-vindo ao portal institucional da U.E. Professora Edith Nair Furtado da Silva.</p>
        </div>

        {/* Banner Carousel */}
        <div className="banner-carousel">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Slide 1 */}
            <div className="carousel-slide">
              <img
                src="/img/banner-1.svg"
                alt="Banner institucional da escola"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {/* Slide 2 */}
            <div className="carousel-slide">
              <img
                src="/img/banner-2.svg"
                alt="Unidade Escolar Professora Edith Nair"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Controls */}
          <button className="carousel-btn prev" onClick={() => { moveSlide(-1); clearInterval(intervalRef.current); intervalRef.current = setInterval(() => moveSlide(1), 5000); }}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button className="carousel-btn next" onClick={() => { moveSlide(1); clearInterval(intervalRef.current); intervalRef.current = setInterval(() => moveSlide(1), 5000); }}>
            <i className="fa-solid fa-chevron-right" />
          </button>
          <div className="carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-8">
          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">{stats.turmas}</span>
              <span className="hero-stat-label">Turmas</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">{stats.alunos}</span>
              <span className="hero-stat-label">Alunos</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">{stats.profs}</span>
              <span className="hero-stat-label">Professores</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => document.getElementById('pub-avisos')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 hover:text-white transition-all"
            >
              <i className="fa-solid fa-bell mr-2" />
              Ver Avisos
            </button>
            <a
              href="https://instagram.com/profedithnair"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-pink-400 text-sm font-semibold transition-all"
            >
              <i className="fa-brands fa-instagram mr-1" />
              @profedithnair
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
