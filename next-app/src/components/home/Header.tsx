'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
      setDark(true);
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.body.classList.toggle('dark-mode', next);
    localStorage.setItem('darkMode', String(next));
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  return (
    <header className={`pub-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/img/logo.png"
            alt="Logo U.E. Edith Nair"
            width={42}
            height={42}
            className="rounded-lg"
            priority
          />
          <div className="hidden sm:block">
            <div className="text-white font-extrabold text-sm leading-tight">
              U.E. Professora Edith Nair
            </div>
            <div className="text-white/40 text-xs font-medium">
              Furtado da Silva · Viana — MA
            </div>
          </div>
        </div>

        {/* Hamburger */}
        <button
          className={`lg:hidden flex flex-col gap-[5px] p-2 z-50 ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-[2px] bg-white rounded transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-5 h-[2px] bg-white rounded transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-[2px] bg-white rounded transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>

        {/* Navigation */}
        <nav className={`
          lg:flex items-center gap-1
          ${mobileOpen
            ? 'fixed inset-0 bg-[#0a1628]/98 flex flex-col items-center justify-center gap-6 z-40 backdrop-blur-xl'
            : 'hidden'
          }
        `}>
          {[
            { label: 'Sobre', id: 'pub-sobre' },
            { label: 'Avisos', id: 'pub-avisos' },
            { label: 'Recursos', id: 'pub-features' },
            { label: 'Contato', id: 'pub-footer' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-white/70 hover:text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={toggleDark}
            className="text-white/50 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
            aria-label="Alternar modo escuro"
          >
            <i className={`fa-solid ${dark ? 'fa-sun' : 'fa-moon'}`} />
          </button>

          <a
            href="https://instagram.com/profedithnair"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-pink-400 px-3 py-2 transition-all"
          >
            <i className="fa-brands fa-instagram text-lg" />
          </a>

          <Link
            href="/dashboard"
            className="ml-2 px-5 py-2.5 bg-gradient-to-r from-accent to-blue-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <i className="fa-solid fa-right-to-bracket mr-2" />
            Acessar Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
