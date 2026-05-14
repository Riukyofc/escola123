'use client';

import Image from 'next/image';
import type { Escola } from '@/lib/types';

interface FooterProps {
  escola: Escola | null;
}

export default function Footer({ escola }: FooterProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="pub-footer" className="site-footer">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/img/logo.png"
                alt="Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <div className="text-white font-bold text-sm leading-tight">
                U.E. Professora Edith Nair<br />Furtado da Silva
              </div>
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              Comprometida com a excelência na educação e com o desenvolvimento integral de nossos alunos.
            </p>
            <div className="mt-4">
              <a
                href="https://instagram.com/profedithnair"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
              >
                <i className="fa-brands fa-instagram" /> @profedithnair
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="text-white font-bold text-sm mb-4 uppercase tracking-wide">
              Acesso Rápido
            </div>
            <div className="flex flex-col gap-2">
              <a href="/dashboard/login" className="text-white/40 hover:text-white text-sm transition-colors">
                Portal do Aluno
              </a>
              <a href="/dashboard/login" className="text-white/40 hover:text-white text-sm transition-colors">
                Portal do Professor
              </a>
              <a href="/dashboard/login" className="text-white/40 hover:text-white text-sm transition-colors">
                Portal do Diretor
              </a>
              <button
                onClick={() => scrollTo('pub-avisos')}
                className="text-left text-white/40 hover:text-white text-sm transition-colors"
              >
                Avisos da Escola
              </button>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-white font-bold text-sm mb-4 uppercase tracking-wide">
              Contato
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-white/40 text-sm">
                <i className="fa-solid fa-map-marker-alt w-4" />
                <span>{escola?.cidade || 'Viana, Maranhão'}</span>
              </div>
              <div className="flex items-center gap-3 text-white/40 text-sm">
                <i className="fa-brands fa-whatsapp w-4" />
                <span>{escola?.whatsapp || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-white/40 text-sm">
                <i className="fa-solid fa-envelope w-4" />
                <span>{escola?.email || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <span className="text-white/25 text-xs">
            © 2026 U.E. Professora Edith Nair Furtado da Silva. Todos os direitos reservados.
          </span>
          <span className="text-white/25 text-xs">
            Desenvolvido para a Secretaria Municipal de Educação · Viana · MA
          </span>
        </div>
      </div>
    </footer>
  );
}
