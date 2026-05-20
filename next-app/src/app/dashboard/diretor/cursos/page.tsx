'use client';

import { useState } from 'react';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { PageTransition } from '@/components/ui/DashboardUI';
import type { ModalidadeEnsino, NivelEnsino } from '@/lib/types';

export default function DiretorCursos() {
  useDataRefresh();

  const modalidades = dbGetAll<ModalidadeEnsino>('modalidades_ensino').filter(m => m.ativo);
  const niveis = dbGetAll<NivelEnsino>('niveis_ensino').filter(n => n.ativo);

  const [selectedMod, setSelectedMod] = useState<string>('');

  const filteredNiveis = niveis.filter(n => !selectedMod || n.modalidadeId === selectedMod);

  return (
    <PageTransition>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--amber) 0%, #b45309 100%)',
        borderRadius: 20,
        padding: '24px 30px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        color: '#fff'
      }}>
        <div style={{
          width: 52,
          height: 52,
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem'
        }}>
          <i className="fa-solid fa-graduation-cap" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Cursos & Níveis de Ensino</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '.85rem', margin: '4px 0 0 0' }}>
            Modalidades pedagógicas regulamentadas, limites de idade e diretrizes de carga horária para o Censo Escolar.
          </p>
        </div>
      </div>

      {/* Filter and overview metrics */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-body" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Filtrar Modalidade:</span>
              <select 
                className="form-control form-select" 
                style={{ minWidth: 220, background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                value={selectedMod}
                onChange={e => setSelectedMod(e.target.value)}
              >
                <option value="">Todas as Modalidades</option>
                {modalidades.map(m => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <span className="badge badge-outline" style={{ borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                <strong>{modalidades.length}</strong> Modalidades
              </span>
              <span className="badge badge-outline" style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}>
                <strong>{niveis.length}</strong> Níveis / Segmentos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Modalidades */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 20 }}>
        {modalidades.filter(m => !selectedMod || m.id === selectedMod).map(mod => {
          const modNiveis = niveis.filter(n => n.modalidadeId === mod.id);
          
          return (
            <div key={mod.id} className="panel-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="panel-card-header" style={{ borderBottom: '1px solid var(--border)', background: 'var(--body-bg)', padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-book" style={{ color: 'var(--amber)' }} />
                  <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '.95rem' }}>{mod.nome}</div>
                </div>
                <span className="badge badge-gray" style={{ fontSize: '.65rem', textTransform: 'uppercase' }}>
                  {mod.codigo}
                </span>
              </div>

              <div className="panel-card-body" style={{ padding: 20, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Configuration / Regulatory parameters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '.78rem', background: 'var(--body-bg)', padding: 12, borderRadius: 8 }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Carga Horária Mínima:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{mod.cargaHorariaAnualMinima || 'N/A'} h/ano</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Mínimo de Dias Letivos:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{mod.diasLetivosMinimos || 'N/A'} dias</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Registro de Carga Horária:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                      {mod.registroCargaHoraria === 'grade_fixa' ? 'Grade de Horário Fixa' : 'Diário Manual Contínuo'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Avaliação Acadêmica:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                      {mod.usaNotasBimestrais ? 'Notas Bimestrais (0-10)' : mod.usaCamposExperiencia ? 'Campos de Experiência / Parecer' : 'Apenas Parecer Descritivo'}
                    </div>
                  </div>
                </div>

                {/* Subniveis and Segments */}
                <div>
                  <div style={{ fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Segmentos & Etapas (Censo Escolar)
                  </div>
                  
                  {modNiveis.length === 0 ? (
                    <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Nenhum nível regulamentado para esta modalidade.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {modNiveis.map(niv => (
                        <div key={niv.id} style={{ border: '1px solid var(--border)', padding: 10, borderRadius: 8, background: 'var(--surface)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: '.82rem', color: 'var(--text-main)' }}>
                              {niv.nome} <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>({niv.sigla})</span>
                            </span>
                            {niv.idadeMinimaMeses !== undefined && niv.idadeMinimaMeses !== null && (
                              <span style={{ fontSize: '.7rem', color: 'var(--text-secondary)' }}>
                                {Math.floor(niv.idadeMinimaMeses / 12)} a {Math.floor((niv.idadeMaximaMeses || 0) / 12)} anos
                              </span>
                            )}
                          </div>
                          
                          {/* Render exact stages/subniveis */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {niv.subniveis.map(sub => (
                              <span key={sub} className="badge badge-outline" style={{ fontSize: '.68rem', background: 'var(--body-bg)' }}>
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </PageTransition>
  );
}
