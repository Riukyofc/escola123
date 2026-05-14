'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import WavesDivider from '@/components/ui/WavesDivider';
import AboutSection from '@/components/home/AboutSection';
import NewsSection from '@/components/home/NewsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import GallerySection from '@/components/home/GallerySection';
import ImpactSection from '@/components/home/ImpactSection';
import TeamSection from '@/components/home/TeamSection';
import MapSection from '@/components/home/MapSection';
import Footer from '@/components/home/Footer';
import WhatsAppFab from '@/components/home/WhatsAppFab';
import { loadAllData, dbGetAll, dbGet, isDataLoaded } from '@/lib/data';
import type { Aviso, Depoimento, GaleriaItem, EquipeMembro, Escola, Turma, Aluno, Professor, Disciplina } from '@/lib/types';

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [equipe, setEquipe] = useState<EquipeMembro[]>([]);
  const [escola, setEscola] = useState<Escola | null>(null);
  const [heroStats, setHeroStats] = useState({ turmas: 0, alunos: 0, profs: 0 });
  const [impactStats, setImpactStats] = useState({ alunos: 0, turmas: 0, profs: 0, disciplinas: 0 });

  useEffect(() => {
    async function init() {
      try {
        await loadAllData();
      } catch (e) {
        console.warn('Usando dados seed:', e);
      }

      // Arrays cacheados
      const allTurmas = dbGetAll<Turma>('turmas');
      const allAlunos = dbGetAll<Aluno>('alunos');
      const allProfs = dbGetAll<Professor>('professores');
      const allDiscs = dbGetAll<Disciplina>('disciplinas');

      // Filtros calculados rapidamente
      let activeTurmas = 0;
      let activeAlunos = 0;
      let activeProfs = 0;
      let activeDiscs = 0;
      
      for(let i=0; i<allTurmas.length; i++) if(allTurmas[i].ativo) activeTurmas++;
      for(let i=0; i<allAlunos.length; i++) if(allAlunos[i].ativo) activeAlunos++;
      for(let i=0; i<allProfs.length; i++) if(allProfs[i].ativo) activeProfs++;
      for(let i=0; i<allDiscs.length; i++) if(allDiscs[i].ativo) activeDiscs++;

      setAvisos(dbGetAll<Aviso>('avisos'));
      setDepoimentos(dbGetAll<Depoimento>('depoimentos'));
      setGaleria(dbGetAll<GaleriaItem>('galeria'));
      setEquipe(dbGetAll<EquipeMembro>('equipe'));
      setEscola(dbGet<Escola>('escola'));
      
      setHeroStats({ turmas: activeTurmas, alunos: activeAlunos, profs: activeProfs });
      setImpactStats({ alunos: activeAlunos, turmas: activeTurmas, profs: activeProfs, disciplinas: activeDiscs });
      setLoaded(true);
    }
    init();
  }, []);

  return (
    <>
      {/* Skip to content */}
      <a href="#pub-hero" className="skip-link">Pular para o conteúdo</a>

      <Header />
      <HeroSection stats={heroStats} />
      <WavesDivider />
      <AboutSection />
      <NewsSection avisos={avisos} />
      <FeaturesSection />
      <TestimonialsSection depoimentos={depoimentos} />
      <GallerySection galeria={galeria} />
      <ImpactSection stats={impactStats} />
      <TeamSection equipe={equipe} />
      <MapSection />
      <Footer escola={escola} />
      <WhatsAppFab />
    </>
  );
}
