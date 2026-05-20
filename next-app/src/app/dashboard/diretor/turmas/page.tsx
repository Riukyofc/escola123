'use client';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { dbGetAll, dbGetAllEscola, dbFind, getEscolaAtiva } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, Modal, confirm, PageTransition } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';
import { turnoIcon } from '@/lib/utils';
import type { Turma, ModalidadeEnsino, NivelEnsino, Professor, Aluno, Disciplina } from '@/lib/types';

export default function DirTurmas() {
  useDataRefresh();
  
  // Get all scoped/reference collections
  const turmas = dbGetAllEscola<Turma>('turmas').filter(t => t.ativo);
  const alunos = dbGetAllEscola<Aluno>('alunos').filter(a => a.ativo);
  const profs = dbGetAllEscola<Professor>('professores').filter(p => p.ativo);
  const modalidades = useMemo(() => dbGetAll<ModalidadeEnsino>('modalidades_ensino').filter(m => m.ativo), []);
  const niveis = useMemo(() => dbGetAll<NivelEnsino>('niveis_ensino').filter(n => n.ativo), []);

  // Filters State
  const [filtroMod, setFiltroMod] = useState('');
  const [filtroTurno, setFiltroTurno] = useState('');

  // Modal & Form State
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [nome, setNome] = useState('');
  const [turno, setTurno] = useState<'manhã' | 'tarde' | 'noite'>('manhã');
  const [modalidadeId, setModalidadeId] = useState('');
  const [nivelEnsinoId, setNivelEnsinoId] = useState('');
  const [serie, setSerie] = useState('');
  const [cargaHorariaSemanal, setCargaHorariaSemanal] = useState(25);
  const [duracaoAulaMinutos, setDuracaoAulaMinutos] = useState(50);
  const [isMultisseriada, setIsMultisseriada] = useState(false);
  const [seriesAgrupadas, setSeriesAgrupadas] = useState<string[]>([]);
  const [isMultietapa, setIsMultietapa] = useState(false);
  const [etapasAgrupadas, setEtapasAgrupadas] = useState<string[]>([]);
  const [isAEE, setIsAEE] = useState(false);
  const [professorIds, setProfessorIds] = useState<string[]>([]);
  const [tagsAEE, setTagsAEE] = useState<string[]>([]);
  const [tagsMaterias, setTagsMaterias] = useState<string[]>([]);
  const [codigoCenso, setCodigoCenso] = useState('');
  const [capacidadeAlunos, setCapacidadeAlunos] = useState(30);
  const [ambienteFisico, setAmbienteFisico] = useState('Sala de aula regular');

  // Cascading options (calculated on-the-fly during render to prevent useEffect infinite loops)
  const filteredNiveis = useMemo(() => {
    if (modalidadeId) {
      const filtered = niveis.filter(n => n.modalidadeId === modalidadeId);
      return [...filtered].sort((a, b) => a.ordemExibicao - b.ordemExibicao);
    }
    return [];
  }, [modalidadeId, niveis]);

  const serieOptions = useMemo(() => {
    if (nivelEnsinoId) {
      const level = niveis.find(n => n.id === nivelEnsinoId);
      if (level && level.subniveis && level.subniveis.length > 0) {
        return level.subniveis;
      }
      return ['unica'];
    }
    return [];
  }, [nivelEnsinoId, niveis]);

  const openNew = () => {
    setEditId(null);
    setNome('');
    setTurno('manhã');
    setModalidadeId('');
    setNivelEnsinoId('');
    setSerie('');
    setCargaHorariaSemanal(25);
    setDuracaoAulaMinutos(50);
    setIsMultisseriada(false);
    setSeriesAgrupadas([]);
    setIsMultietapa(false);
    setEtapasAgrupadas([]);
    setIsAEE(false);
    setProfessorIds([]);
    setTagsAEE([]);
    setTagsMaterias([]);
    setCodigoCenso('');
    setCapacidadeAlunos(30);
    setAmbienteFisico('Sala de aula regular');
    setModal(true);
  };

  const openEdit = (t: Turma) => {
    setEditId(t.id);
    setNome(t.nome);
    setTurno(t.turno);
    setModalidadeId(t.modalidadeId || '');
    setNivelEnsinoId(t.nivelEnsinoId || '');
    setSerie(t.serie || '');
    setCargaHorariaSemanal(t.cargaHorariaSemanal || 25);
    setDuracaoAulaMinutos(t.duracaoAulaMinutos || 50);
    setIsMultisseriada(t.isMultisseriada || false);
    setSeriesAgrupadas(t.seriesAgrupadas || []);
    setIsMultietapa(t.isMultietapa || false);
    setEtapasAgrupadas(t.etapasAgrupadas || []);
    setIsAEE(t.isAEE || false);
    setProfessorIds(t.professorIds || (t.professorId ? [t.professorId] : []));
    setTagsAEE(t.tagsAEE || []);
    setTagsMaterias(t.tagsMaterias || []);
    setCodigoCenso(t.codigoCenso || '');
    setCapacidadeAlunos(t.capacidadeAlunos || 30);
    setAmbienteFisico(t.ambienteFisico || 'Sala de aula regular');
    setModal(true);
  };

  const handleSave = async () => {
    if (!nome) {
      showToast('Nome é obrigatório', 'error');
      return;
    }
    if (!modalidadeId) {
      showToast('Modalidade é obrigatória', 'error');
      return;
    }

    const payload: Partial<Turma> = {
      nome,
      turno,
      modalidadeId,
      nivelEnsinoId: nivelEnsinoId || undefined,
      serie: serie || undefined,
      cargaHorariaSemanal,
      duracaoAulaMinutos,
      isMultisseriada,
      seriesAgrupadas: isMultisseriada ? seriesAgrupadas : [],
      isMultietapa,
      etapasAgrupadas: isMultietapa ? etapasAgrupadas : [],
      isAEE,
      tagsAEE: isAEE ? tagsAEE : [],
      tagsMaterias,
      codigoCenso,
      capacidadeAlunos,
      ambienteFisico,
      professorIds,
      professorId: professorIds[0] || '',
      escolaId: getEscolaAtiva() || 'esc01',
      ativo: true
    };

    await saveDocument('turmas', editId, payload);
    showToast(editId ? 'Turma atualizada!' : 'Turma criada!', 'success');
    setModal(false);
  };

  const handleDelete = async (id: string) => {
    const classAlunos = alunos.filter(a => a.turmaId === id);
    if (classAlunos.length > 0) {
      showToast(`Esta turma possui ${classAlunos.length} alunos vinculados. Reatribua-os antes de excluir.`, 'error');
      return;
    }
    if (await confirm('Excluir esta turma permanentemente?')) {
      await removeDocument('turmas', id);
      showToast('Turma excluída', 'success');
    }
  };

  const toggleSerieAgrupada = (s: string) => {
    setSeriesAgrupadas(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleEtapaAgrupada = (mId: string) => {
    setEtapasAgrupadas(prev => prev.includes(mId) ? prev.filter(x => x !== mId) : [...prev, mId]);
  };

  const toggleProfessor = (pId: string) => {
    setProfessorIds(prev => prev.includes(pId) ? prev.filter(x => x !== pId) : [...prev, pId]);
  };

  const toggleTagAEE = (tag: string) => {
    setTagsAEE(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
  };

  const toggleTagMateria = (tag: string) => {
    setTagsMaterias(prev => prev.includes(tag) ? prev.filter(x => x !== tag) : [...prev, tag]);
  };

  // Filtered turmas list
  let filteredTurmas = turmas;
  if (filtroMod) filteredTurmas = filteredTurmas.filter(t => t.modalidadeId === filtroMod);
  if (filtroTurno) filteredTurmas = filteredTurmas.filter(t => t.turno === filtroTurno);

  return (
    <PageTransition>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="form-control form-select" style={{ minWidth: 180, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={filtroMod} onChange={e => setFiltroMod(e.target.value)}>
            <option value="">Todas as Modalidades</option>
            {modalidades.map(m => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          <select className="form-control form-select" style={{ minWidth: 150, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={filtroTurno} onChange={e => setFiltroTurno(e.target.value)}>
            <option value="">Todos os Turnos</option>
            <option value="manhã">🌅 Manhã</option>
            <option value="tarde">☀️ Tarde</option>
            <option value="noite">🌙 Noite</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus" /> Nova Turma Inteligente
        </button>
      </div>

      {/* Grid / List Panel */}
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title">
            <i className="fa-solid fa-chalkboard" /> Estrutura de Turmas
          </div>
          <span className="badge badge-blue">{filteredTurmas.length}</span>
        </div>
        
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Modalidade</th>
                <th>Etapa / Série</th>
                <th>Turno</th>
                <th className="text-center">C.H. Semanal</th>
                <th>Docentes</th>
                <th className="text-center">Alunos</th>
                <th>Tags</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTurmas.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-folder-open" style={{ fontSize: '2rem', marginBottom: 10, display: 'block', opacity: 0.5 }} />
                      Nenhuma turma encontrada com os filtros selecionados.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTurmas.map(t => {
                  const mod = modalidades.find(m => m.id === t.modalidadeId);
                  const level = niveis.find(n => n.id === t.nivelEnsinoId);
                  const classAlunos = alunos.filter(a => a.turmaId === t.id);
                  
                  // Resolve teacher names
                  const classProfs = t.professorIds && t.professorIds.length > 0
                    ? t.professorIds.map(pid => profs.find(p => p.id === pid)?.nome || '').filter(Boolean)
                    : (t.professorId ? [profs.find(p => p.id === t.professorId)?.nome || ''] : []);

                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.nome}</td>
                      <td>
                        <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                          {mod ? mod.nome : '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '.78rem', fontWeight: 500, display: 'block' }}>
                          {level ? level.sigla : ''} {t.serie && t.serie !== 'unica' ? ` - ${t.serie}` : ''}
                        </span>
                        {t.codigoCenso && (
                          <span style={{ fontSize: '.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: 2 }}>
                            Censo: {t.codigoCenso}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${t.turno === 'manhã' ? 'yellow' : t.turno === 'tarde' ? 'amber' : 'purple'}`}>
                          {turnoIcon(t.turno)} {t.turno}
                        </span>
                      </td>
                      <td className="text-center" style={{ fontWeight: 600 }}>{t.cargaHorariaSemanal || '—'}h</td>
                      <td>
                        <span style={{ fontSize: '.76rem', color: 'var(--text-main)' }}>
                          {classProfs.length > 0 ? classProfs.join(', ') : <span style={{ color: 'var(--text-secondary)' }}>Nenhum</span>}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-blue" style={{ fontWeight: 700 }}>
                          {classAlunos.length}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 220 }}>
                          {t.isMultisseriada && (
                            <span className="badge badge-blue" style={{ fontSize: '.62rem' }}>
                              <i className="fa-solid fa-layer-group" /> Multissérie
                            </span>
                          )}
                          {t.isMultietapa && (
                            <span className="badge badge-purple" style={{ fontSize: '.62rem' }}>
                              <i className="fa-solid fa-arrows-split-up-and-left" /> Multietapa
                            </span>
                          )}
                          {t.isAEE && (
                            <span className="badge" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)', fontSize: '.62rem' }}>
                              <i className="fa-solid fa-heart-pulse" /> AEE
                            </span>
                          )}
                          {t.tagsAEE && t.tagsAEE.map(tag => (
                            <span key={tag} className="badge badge-outline" style={{ borderColor: 'var(--purple)', color: 'var(--purple)', fontSize: '.62rem' }}>
                              {tag}
                            </span>
                          ))}
                          {t.tagsMaterias && t.tagsMaterias.map(tag => (
                            <span key={tag} className="badge badge-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)', fontSize: '.62rem' }}>
                              {tag}
                            </span>
                          ))}
                          {t.ambienteFisico && t.ambienteFisico !== 'Sala de aula regular' && (
                            <span className="badge badge-gray" style={{ fontSize: '.62rem' }}>
                              <i className="fa-solid fa-school" /> {t.ambienteFisico}
                            </span>
                          )}
                          {!t.isMultisseriada && !t.isMultietapa && !t.isAEE && (!t.tagsMaterias || t.tagsMaterias.length === 0) && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '.7rem' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-xs btn-ghost" onClick={() => openEdit(t)}>
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button className="btn btn-xs btn-danger" onClick={() => handleDelete(t.id)}>
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cascading Turma Inteligente Modal */}
      <Modal
        id="turma-inteligente"
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Editar Turma' : 'Nova Turma Inteligente'}
        icon="fa-chalkboard"
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fa-solid fa-floppy-disk" /> Salvar Turma
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Nome da Turma */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Nome da Turma *</label>
            <input className="form-control" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: 6º Ano A - Matutino" />
          </div>

          {/* Modalidade */}
          <div className="form-group">
            <label className="form-label">Modalidade de Ensino *</label>
            <select className="form-control form-select" value={modalidadeId} onChange={e => { setModalidadeId(e.target.value); setNivelEnsinoId(''); setSerie(''); }}>
              <option value="">Selecione...</option>
              {modalidades.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          {/* Nivel */}
          <div className="form-group">
            <label className="form-label">Nível de Ensino</label>
            <select className="form-control form-select" value={nivelEnsinoId} onChange={e => { setNivelEnsinoId(e.target.value); setSerie(''); }} disabled={!modalidadeId}>
              <option value="">Selecione o nível...</option>
              {filteredNiveis.map(n => (
                <option key={n.id} value={n.id}>{n.nome}</option>
              ))}
            </select>
          </div>

          {/* Serie / Subnivel */}
          <div className="form-group">
            <label className="form-label">Série / Etapa</label>
            <select className="form-control form-select" value={serie} onChange={e => setSerie(e.target.value)} disabled={!nivelEnsinoId}>
              <option value="">Selecione a série...</option>
              {serieOptions.map(s => (
                <option key={s} value={s}>{s === 'unica' ? 'Série Única' : s}</option>
              ))}
            </select>
          </div>

          {/* Turno */}
          <div className="form-group">
            <label className="form-label">Turno de Funcionamento</label>
            <select className="form-control form-select" value={turno} onChange={e => setTurno(e.target.value as any)}>
              <option value="manhã">🌅 Manhã</option>
              <option value="tarde">☀️ Tarde</option>
              <option value="noite">🌙 Noite</option>
            </select>
          </div>

          {/* Carga Horaria Semanal */}
          <div className="form-group">
            <label className="form-label">C.H. Semanal (Horas)</label>
            <input type="number" className="form-control" value={cargaHorariaSemanal} onChange={e => setCargaHorariaSemanal(parseInt(e.target.value) || 0)} />
          </div>

          {/* Duracao da Aula */}
          <div className="form-group">
            <label className="form-label">Duração da Aula (Minutos)</label>
            <input type="number" className="form-control" value={duracaoAulaMinutos} onChange={e => setDuracaoAulaMinutos(parseInt(e.target.value) || 0)} />
          </div>

          {/* Codigo Censo/INEP */}
          <div className="form-group">
            <label className="form-label">Código Censo/INEP</label>
            <input className="form-control" value={codigoCenso} onChange={e => setCodigoCenso(e.target.value)} placeholder="Código da Turma no Censo" />
          </div>

          {/* Capacidade de Alunos */}
          <div className="form-group">
            <label className="form-label">Capacidade Máxima (Alunos)</label>
            <input type="number" className="form-control" value={capacidadeAlunos} onChange={e => setCapacidadeAlunos(parseInt(e.target.value) || 0)} />
          </div>

          {/* Ambiente Fisico */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Ambiente Físico (Tipo de Sala)</label>
            <select className="form-control form-select" value={ambienteFisico} onChange={e => setAmbienteFisico(e.target.value)}>
              <option value="Sala de aula regular">Sala de aula regular</option>
              <option value="Sala de recursos (AEE)">Sala de recursos (AEE)</option>
              <option value="Laboratório de Informática">Laboratório de Informática</option>
              <option value="Laboratório de Ciências">Laboratório de Ciências</option>
              <option value="Quadra de Esportes">Quadra de Esportes</option>
              <option value="Biblioteca">Biblioteca</option>
              <option value="Outro ambiente">Outro ambiente</option>
            </select>
          </div>

          {/* Checkboxes Configurações */}
          <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', gap: 20, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '.85rem', fontWeight: 600 }}>
              <input type="checkbox" checked={isMultisseriada} onChange={e => setIsMultisseriada(e.target.checked)} />
              Multisseriada
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '.85rem', fontWeight: 600 }}>
              <input type="checkbox" checked={isMultietapa} onChange={e => setIsMultietapa(e.target.checked)} />
              Multietapa
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '.85rem', fontWeight: 600 }}>
              <input type="checkbox" checked={isAEE} onChange={e => setIsAEE(e.target.checked)} />
              Sala AEE
            </label>
          </div>

          {/* Panel AEE Tags (Exclusive Functions) */}
          {isAEE && (
            <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(168,85,247,0.03)', padding: 12, borderRadius: 8, border: '1px dashed rgba(168,85,247,0.3)' }}>
              <label className="form-label" style={{ marginBottom: 6, display: 'block', color: 'var(--purple)', fontWeight: 700 }}>
                Funções Exclusivas do AEE (Censo Escolar):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  'Atendimento Pedagógico Especializado',
                  'Libras / Tradução e Interpretação',
                  'Sistema Braille / Orientação e Mobilidade',
                  'Comunicação Alternativa e Aumentativa (CAA)',
                  'Enriquecimento Curricular (Altas Habilidades)',
                  'Desenvolvimento de Funções Cognitivas (TEA)',
                  'Autonomia e Mobilidade'
                ].map(tag => (
                  <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.76rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={tagsAEE.includes(tag)} onChange={() => toggleTagAEE(tag)} />
                    {tag}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Panel Censo Subjects Tags */}
          <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(16,185,129,0.03)', padding: 12, borderRadius: 8, border: '1px dashed rgba(16,185,129,0.3)' }}>
            <label className="form-label" style={{ marginBottom: 6, display: 'block', color: 'var(--success)', fontWeight: 700 }}>
              Matérias / Áreas do Conhecimento (Censo Escolar):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                'Língua Portuguesa',
                'Gramática',
                'Natureza e Sociedade',
                'Matemática',
                'História',
                'Geografia',
                'Ciências',
                'Artes',
                'Educação Física',
                'Língua Inglesa',
                'Ensino Religioso'
              ].map(tag => (
                <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.76rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={tagsMaterias.includes(tag)} onChange={() => toggleTagMateria(tag)} />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          {/* Panel Multisseriada */}
          {isMultisseriada && (
            <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px dashed var(--border)' }}>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                Selecione as Séries Agrupadas:
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {serieOptions.filter(s => s !== 'unica').map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem', cursor: 'pointer', padding: '4px 10px', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: 99 }}>
                    <input type="checkbox" checked={seriesAgrupadas.includes(s)} onChange={() => toggleSerieAgrupada(s)} />
                    {s}
                  </label>
                ))}
                {serieOptions.filter(s => s !== 'unica').length === 0 && (
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>Nenhuma série adicional encontrada para este nível.</div>
                )}
              </div>
            </div>
          )}

          {/* Panel Multietapa */}
          {isMultietapa && (
            <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px dashed var(--border)' }}>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                Selecione as Modalidades/Etapas Agrupadas:
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {modalidades.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem', cursor: 'pointer', padding: '4px 10px', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: 99 }}>
                    <input type="checkbox" checked={etapasAgrupadas.includes(m.id)} onChange={() => toggleEtapaAgrupada(m.id)} />
                    {m.nome}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Professores Docentes Multi-Select */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>Professores Vinculados</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 8, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--input-bg)' }}>
              {profs.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-main)' }}>
                  <input type="checkbox" checked={professorIds.includes(p.id)} onChange={() => toggleProfessor(p.id)} />
                  {p.nome}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
