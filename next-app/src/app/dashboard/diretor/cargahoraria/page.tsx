'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dbGetAll, dbGetAllEscola, dbFind, getEscolaAtiva } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, Modal, confirm, PageTransition } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';
import type { Turma, ModalidadeEnsino, RegistroCargaHoraria, Professor, BlocoTempo } from '@/lib/types';

interface UIBlockRow {
  id: string;
  inicio: string;
  fim: string;
  atividade: string;
  campoExperiencia?: string;
  tipoAtividadeInfantil?: string;
}

export default function DirCargaHoraria() {
  useDataRefresh();

  // Load data
  const turmas = dbGetAllEscola<Turma>('turmas').filter(t => t.ativo);
  const registros = dbGetAllEscola<RegistroCargaHoraria>('registro_carga_horaria');
  const mods = dbGetAll<ModalidadeEnsino>('modalidades_ensino').filter(m => m.ativo);
  const profs = dbGetAllEscola<Professor>('professores').filter(p => p.ativo);

  // Filters State
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroMod, setFiltroMod] = useState('');

  // Modal State
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [dataRegistro, setDataRegistro] = useState('');
  const [observacao, setObservacao] = useState('');
  const [blockRows, setBlockRows] = useState<UIBlockRow[]>([]);

  // Detect if selected class is Educação Infantil
  const activeTurmaObj = turmas.find(t => t.id === selectedTurmaId);
  const isInfantil = activeTurmaObj?.modalidadeId === 'mod_infantil';

  // Open modal for new record
  const openNew = () => {
    setEditId(null);
    const initialTurmaId = turmas[0]?.id || '';
    setSelectedTurmaId(initialTurmaId);
    setDataRegistro(new Date().toISOString().split('T')[0]);
    setObservacao('');
    
    const initialIsInfantil = turmas[0]?.modalidadeId === 'mod_infantil';
    if (initialIsInfantil) {
      setBlockRows([
        { id: '1', inicio: '07:30', fim: '08:30', atividade: 'Acolhida / Recepção', tipoAtividadeInfantil: 'acolhida', campoExperiencia: 'O eu, o outro e o nós' },
        { id: '2', inicio: '08:30', fim: '09:15', atividade: 'Alimentação / Higiene (Merenda)', tipoAtividadeInfantil: 'alimentacao', campoExperiencia: 'Corpo, gestos e movimentos' },
        { id: '3', inicio: '09:15', fim: '10:00', atividade: 'Atividade Pedagógica Dirigida', tipoAtividadeInfantil: 'atividade_dirigida', campoExperiencia: 'Traços, sons, cores e formas' },
        { id: '4', inicio: '10:00', fim: '10:40', atividade: 'Brincadeira Livre / Parque', tipoAtividadeInfantil: 'brincadeira', campoExperiencia: 'Corpo, gestos e movimentos' },
        { id: '5', inicio: '10:40', fim: '11:15', atividade: 'Higiene / Saída', tipoAtividadeInfantil: 'saida', campoExperiencia: 'O eu, o outro e o nós' }
      ]);
    } else {
      setBlockRows([
        { id: '1', inicio: '07:30', fim: '09:00', atividade: '' },
        { id: '2', inicio: '09:20', fim: '10:50', atividade: '' }
      ]);
    }
    setModal(true);
  };

  // Switch block structure when selected class changes in new record creation
  useEffect(() => {
    if (!modal || editId) return;
    const active = turmas.find(t => t.id === selectedTurmaId);
    if (active?.modalidadeId === 'mod_infantil') {
      setBlockRows([
        { id: '1', inicio: '07:30', fim: '08:30', atividade: 'Acolhida / Recepção', tipoAtividadeInfantil: 'acolhida', campoExperiencia: 'O eu, o outro e o nós' },
        { id: '2', inicio: '08:30', fim: '09:15', atividade: 'Alimentação / Higiene (Merenda)', tipoAtividadeInfantil: 'alimentacao', campoExperiencia: 'Corpo, gestos e movimentos' },
        { id: '3', inicio: '09:15', fim: '10:00', atividade: 'Atividade Pedagógica Dirigida', tipoAtividadeInfantil: 'atividade_dirigida', campoExperiencia: 'Traços, sons, cores e formas' },
        { id: '4', inicio: '10:00', fim: '10:40', atividade: 'Brincadeira Livre / Parque', tipoAtividadeInfantil: 'brincadeira', campoExperiencia: 'Corpo, gestos e movimentos' },
        { id: '5', inicio: '10:40', fim: '11:15', atividade: 'Higiene / Saída', tipoAtividadeInfantil: 'saida', campoExperiencia: 'O eu, o outro e o nós' }
      ]);
    } else {
      setBlockRows([
        { id: '1', inicio: '07:30', fim: '09:00', atividade: '' },
        { id: '2', inicio: '09:20', fim: '10:50', atividade: '' }
      ]);
    }
  }, [selectedTurmaId, modal, editId]);

  // Open modal to edit existing record
  const openEdit = (r: RegistroCargaHoraria) => {
    setEditId(r.id);
    setSelectedTurmaId(r.turmaId);
    setDataRegistro(r.data);
    setObservacao(r.observacao || '');
    setBlockRows((r.blocos || []).map((b, i) => ({
      id: String(i + 1),
      inicio: b.inicio,
      fim: b.fim,
      atividade: b.atividade,
      campoExperiencia: (b as any).campoExperiencia || '',
      tipoAtividadeInfantil: (b as any).tipoAtividadeInfantil || ''
    })));
    setModal(true);
  };

  // Add block row
  const addBlockRow = () => {
    const nextId = String(Date.now() + Math.random());
    setBlockRows(prev => [...prev, {
      id: nextId,
      inicio: '07:30',
      fim: '09:00',
      atividade: isInfantil ? 'Atividade Pedagógica Dirigida' : '',
      tipoAtividadeInfantil: isInfantil ? 'atividade_dirigida' : '',
      campoExperiencia: isInfantil ? 'O eu, o outro e o nós' : ''
    }]);
  };

  // Remove block row
  const removeBlockRow = (id: string) => {
    if (blockRows.length <= 1) {
      showToast('A carga horária deve ter pelo menos um bloco.', 'error');
      return;
    }
    setBlockRows(prev => prev.filter(row => row.id !== id));
  };

  // Update block values
  const updateBlockRow = (id: string, field: keyof UIBlockRow, value: string) => {
    setBlockRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  // Live calculator for total minutes of current blockRows
  const calculateTotalMinutes = (): number => {
    let total = 0;
    blockRows.forEach(row => {
      if (row.inicio && row.fim) {
        const [ih, im] = row.inicio.split(':').map(Number);
        const [fh, fm] = row.fim.split(':').map(Number);
        const diff = (fh * 60 + fm) - (ih * 60 + im);
        if (diff > 0) total += diff;
      }
    });
    return total;
  };

  const handleSave = async () => {
    if (!selectedTurmaId) {
      showToast('Selecione a turma', 'error');
      return;
    }
    if (!dataRegistro) {
      showToast('Data do registro é obrigatória', 'error');
      return;
    }

    const compiledBlocks: BlocoTempo[] = [];
    let totalMins = 0;

    for (const r of blockRows) {
      if (!r.inicio || !r.fim) continue;
      const [ih, im] = r.inicio.split(':').map(Number);
      const [fh, fm] = r.fim.split(':').map(Number);
      const diff = (fh * 60 + fm) - (ih * 60 + im);
      if (diff <= 0) {
        showToast('O horário de fim deve ser posterior ao início.', 'error');
        return;
      }
      compiledBlocks.push({
        inicio: r.inicio,
        fim: r.fim,
        atividade: r.atividade || (isInfantil ? 'Atividade Pedagógica Dirigida' : 'Aula regular'),
        minutos: diff,
        campoExperiencia: r.campoExperiencia || undefined,
        tipoAtividadeInfantil: r.tipoAtividadeInfantil || undefined
      } as any);
      totalMins += diff;
    }

    if (compiledBlocks.length === 0) {
      showToast('Nenhum bloco de tempo válido inserido.', 'error');
      return;
    }

    const payload: Partial<RegistroCargaHoraria> = {
      escolaId: getEscolaAtiva() || 'esc01',
      turmaId: selectedTurmaId,
      data: dataRegistro,
      blocos: compiledBlocks,
      totalMinutos: totalMins,
      professorId: '',
      observacao,
      criadoEm: new Date().toISOString()
    };

    await saveDocument('registro_carga_horaria', editId, payload);
    showToast(editId ? 'Carga horária atualizada!' : 'Carga horária registrada!', 'success');
    setModal(false);
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Remover este registro de carga horária?')) {
      await removeDocument('registro_carga_horaria', id);
      showToast('Registro removido.', 'success');
    }
  };

  // Helper function to calculate progress
  const getProgress = (t: Turma) => {
    const mod = mods.find(m => m.id === t.modalidadeId);
    const metaAnual = mod?.cargaHorariaAnualMinima || 800;
    
    const regs = registros.filter(r => r.turmaId === t.id);
    const mins = regs.reduce((sum, r) => sum + (r.totalMinutos || 0), 0);
    const horasRealizada = Math.round((mins / 60) * 10) / 10;
    const percent = metaAnual > 0 ? Math.round((horasRealizada / metaAnual) * 100) : 0;

    const now = new Date();
    const anoInicio = new Date(now.getFullYear(), 1, 1);
    const anoFim = new Date(now.getFullYear(), 11, 15);
    const totalMs = anoFim.getTime() - anoInicio.getTime();
    const passedMs = Math.max(0, now.getTime() - anoInicio.getTime());
    const proporcao = Math.min(passedMs / totalMs, 1);
    const metaEsperada = Math.round(metaAnual * proporcao);
    const deficit = Math.max(0, Math.round(metaEsperada - horasRealizada));

    return {
      meta: metaAnual,
      realizada: horasRealizada,
      percent: Math.min(percent, 100),
      deficit,
      minutosTotal: mins,
      diasRegistrados: regs.length
    };
  };

  // Apply filters to turmas
  let filteredTurmas = turmas;
  if (filtroTurma) filteredTurmas = filteredTurmas.filter(t => t.id === filtroTurma);
  if (filtroMod) filteredTurmas = filteredTurmas.filter(t => t.modalidadeId === filtroMod);

  // Compute stats
  let totalPercent = 0;
  filteredTurmas.forEach(t => {
    totalPercent += getProgress(t).percent;
  });
  const mediaRede = filteredTurmas.length > 0 ? Math.round(totalPercent / filteredTurmas.length) : 0;

  // Apply filters to registros
  let filteredRegistros = registros;
  if (filtroTurma) filteredRegistros = filteredRegistros.filter(r => r.turmaId === filtroTurma);
  if (filtroMod) {
    const matchedTurmaIds = turmas.filter(t => t.modalidadeId === filtroMod).map(t => t.id);
    filteredRegistros = filteredRegistros.filter(r => matchedTurmaIds.includes(r.turmaId));
  }
  // Sort by date desc
  filteredRegistros = [...filteredRegistros].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <PageTransition>
      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="stat-card" style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)' }}>
          <div className="stat-card-title">Turmas Monitoradas</div>
          <div className="stat-card-value" style={{ color: 'var(--secondary)' }}>{filteredTurmas.length}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Filtradas pelo escopo atual</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)' }}>
          <div className="stat-card-title">Cumprimento Médio</div>
          <div className="stat-card-value" style={{ color: mediaRede >= 75 ? '#10b981' : mediaRede >= 50 ? '#f59e0b' : '#ef4444' }}>
            {mediaRede}%
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Proporção da meta anual realizada</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--panel-bg)', border: '1px solid var(--border)' }}>
          <div className="stat-card-title">Total de Lançamentos</div>
          <div className="stat-card-value">{filteredRegistros.length}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>Registros de carga horária diária</div>
        </div>
      </div>

      {/* Filter and Add Button Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="form-control form-select" style={{ minWidth: 180, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={filtroMod} onChange={e => setFiltroMod(e.target.value)}>
            <option value="">Todas as Modalidades</option>
            {mods.map(m => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          <select className="form-control form-select" style={{ minWidth: 180, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} value={filtroTurma} onChange={e => setFiltroTurma(e.target.value)}>
            <option value="">Todas as Turmas</option>
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus" /> Registrar Carga Horária
        </button>
      </div>

      {/* Class Progress Grid */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-main)' }}>Progresso por Turma</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
        {filteredTurmas.length === 0 ? (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 8 }}>
            Sem turmas registradas.
          </div>
        ) : (
          filteredTurmas.map(t => {
            const prog = getProgress(t);
            const mod = mods.find(m => m.id === t.modalidadeId);
            const barColor = prog.percent >= 90 ? '#10b981' : prog.percent >= 70 ? '#f59e0b' : '#ef4444';
            const statusIcon = prog.deficit > 0 ? '⚠️' : '✅';
            const statusText = prog.deficit > 0 ? `Déficit: ${prog.deficit}h` : 'Em dia';

            return (
              <div key={t.id} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--panel-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--text-main)' }}>{t.nome}</div>
                    <div style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{mod ? mod.nome : ''}</div>
                  </div>
                  <span style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: 99, background: `${barColor}15`, color: barColor, fontWeight: 700, border: `1px solid ${barColor}30`, whiteSpace: 'nowrap' }}>
                    {statusIcon} {statusText}
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ background: barColor, height: '100%', width: `${Math.min(prog.percent, 100)}%`, borderRadius: 99, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--text-muted)' }}>
                  <span>{prog.realizada}h / {prog.meta}h</span>
                  <span style={{ fontWeight: 800, color: barColor }}>{prog.percent}%</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: '.65rem', color: 'var(--text-muted)' }}>
                  <span><i className="fa-solid fa-calendar-days" /> {prog.diasRegistrados} dias</span>
                  <span><i className="fa-solid fa-clock" /> {prog.minutosTotal} min registrados</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Daily Records Panel */}
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title">
            <i className="fa-solid fa-scroll" /> Histórico de Lançamentos Diários
          </div>
          <span className="badge badge-blue">{filteredRegistros.length}</span>
        </div>
        
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Turma</th>
                <th>Blocos Registrados</th>
                <th className="text-center">Minutos Úteis</th>
                <th>Responsável</th>
                <th>Observações</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistros.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                    Nenhum lançamento diário de carga horária encontrado.
                  </td>
                </tr>
              ) : (
                filteredRegistros.map(r => {
                  const t = turmas.find(x => x.id === r.turmaId);
                  const p = profs.find(x => x.id === r.professorId);
                  const isInfantilClass = t?.modalidadeId === 'mod_infantil';
                  const dateFormatted = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{dateFormatted}</td>
                      <td>{t ? t.nome : '—'}</td>
                      <td>
                        {isInfantilClass ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(r.blocos || []).map((b, idx) => (
                              <div 
                                key={idx} 
                                style={{ 
                                  fontSize: '.68rem', 
                                  border: '1px solid var(--border)', 
                                  display: 'inline-flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  background: 'var(--body-bg)',
                                  minWidth: 120
                                }}
                              >
                                <span style={{ fontWeight: 800, color: 'var(--amber)' }}>{b.inicio} - {b.fim}</span>
                                <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '.65rem', marginTop: 1 }}>{b.atividade}</span>
                                {(b as any).campoExperiencia && (
                                  <span style={{ fontSize: '.58rem', color: 'var(--text-muted)', marginTop: 2, borderTop: '1px solid var(--border)', paddingTop: 1, width: '100%' }}>
                                    BNCC: {(b as any).campoExperiencia}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(r.blocos || []).map((b, idx) => (
                              <span 
                                key={idx} 
                                className="badge badge-outline" 
                                style={{ 
                                  fontSize: '.7rem', 
                                  borderColor: 'var(--border)', 
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: 'var(--body-bg)'
                                }}
                              >
                                <strong>{b.inicio}-{b.fim}</strong>: {b.atividade}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="badge badge-purple" style={{ fontWeight: 700 }}>
                          {r.totalMinutos || 0} min
                        </span>
                      </td>
                      <td style={{ fontSize: '.78rem' }}>{p ? p.nome : 'Direção / Coordenação'}</td>
                      <td style={{ fontSize: '.75rem', color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.observacao || '—'}
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-xs btn-ghost" onClick={() => openEdit(r)}>
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button className="btn btn-xs btn-danger" onClick={() => handleDelete(r.id)}>
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

      {/* Carga Horaria Modal */}
      <Modal
        id="bloco-tempo"
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Editar Carga Horária' : 'Registrar Carga Horária'}
        icon="fa-business-time"
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <i className="fa-solid fa-floppy-disk" /> Gravar Registro
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Selecionar Turma */}
          <div className="form-group">
            <label className="form-label">Selecione a Turma *</label>
            <select className="form-control form-select" value={selectedTurmaId} onChange={e => setSelectedTurmaId(e.target.value)}>
              <option value="">Selecione...</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          {/* Data do Registro */}
          <div className="form-group">
            <label className="form-label">Data de Realização *</label>
            <input type="date" className="form-control" value={dataRegistro} onChange={e => setDataRegistro(e.target.value)} />
          </div>

          {/* Blocos de Carga Horária */}
          <div style={{ gridColumn: 'span 2', marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Grade de Aulas / Atividades Realizadas
              </span>
              <button type="button" className="btn btn-xs btn-primary" onClick={addBlockRow}>
                <i className="fa-solid fa-plus" /> Adicionar Bloco
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {blockRows.map((row) => (
                <div key={row.id} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8, flexWrap: 'wrap' }}>
                  <input
                    type="time"
                    className="form-control"
                    style={{ width: 90, fontSize: '.78rem' }}
                    value={row.inicio}
                    onChange={e => updateBlockRow(row.id, 'inicio', e.target.value)}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>➡️</span>
                  <input
                    type="time"
                    className="form-control"
                    style={{ width: 90, fontSize: '.78rem' }}
                    value={row.fim}
                    onChange={e => updateBlockRow(row.id, 'fim', e.target.value)}
                  />

                  {isInfantil ? (
                    <>
                      {/* Presets dropdown */}
                      <select
                        className="form-control form-select"
                        style={{ flex: '1 1 150px', fontSize: '.78rem', background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                        value={row.tipoAtividadeInfantil || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const labelMap: Record<string, string> = {
                            acolhida: 'Acolhida / Recepção',
                            alimentacao: 'Alimentação / Higiene (Merenda)',
                            brincadeira: 'Brincadeira Livre / Parque',
                            atividade_dirigida: 'Atividade Pedagógica Dirigida',
                            sono: 'Repouso / Sono',
                            saida: 'Higiene / Saída',
                            outro: 'Outra Atividade'
                          };
                          updateBlockRow(row.id, 'tipoAtividadeInfantil', val);
                          if (val !== 'outro') {
                            updateBlockRow(row.id, 'atividade', labelMap[val] || '');
                          }
                        }}
                      >
                        <option value="">Selecione a atividade rotineira...</option>
                        <option value="acolhida">Acolhida / Recepção</option>
                        <option value="alimentacao">Alimentação / Higiene (Merenda)</option>
                        <option value="brincadeira">Brincadeira Livre / Parque</option>
                        <option value="atividade_dirigida">Atividade Pedagógica Dirigida</option>
                        <option value="sono">Repouso / Sono</option>
                        <option value="saida">Higiene / Saída</option>
                        <option value="outro">Outra Atividade (Customizada)</option>
                      </select>

                      {/* Custom input if "outro" is selected */}
                      {(row.tipoAtividadeInfantil === 'outro' || !row.tipoAtividadeInfantil) && (
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Descreva a atividade..."
                          style={{ flex: '1 1 120px', fontSize: '.78rem' }}
                          value={row.atividade}
                          onChange={e => updateBlockRow(row.id, 'atividade', e.target.value)}
                        />
                      )}

                      {/* BNCC Experience Fields */}
                      <select
                        className="form-control form-select"
                        style={{ flex: '1 1 180px', fontSize: '.75rem', background: 'var(--panel-bg)', borderColor: 'var(--border)' }}
                        value={row.campoExperiencia || ''}
                        onChange={e => updateBlockRow(row.id, 'campoExperiencia', e.target.value)}
                      >
                        <option value="">Sem Campo BNCC (Rotina)</option>
                        <option value="O eu, o outro e o nós">O eu, o outro e o nós</option>
                        <option value="Corpo, gestos e movimentos">Corpo, gestos e movimentos</option>
                        <option value="Traços, sons, cores e formas">Traços, sons, cores e formas</option>
                        <option value="Escuta, fala, pensamento e imaginação">Escuta, fala, pensamento e imaginação</option>
                        <option value="Espaços, tempos, quantidades, relações e transformações">Espaços, tempos, relações...</option>
                      </select>
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Descrição da atividade..."
                      style={{ flex: 1, fontSize: '.78rem' }}
                      value={row.atividade}
                      onChange={e => updateBlockRow(row.id, 'atividade', e.target.value)}
                    />
                  )}

                  <button type="button" className="btn btn-xs" style={{ color: '#ef4444', background: 'none', border: 'none', padding: 4 }} onClick={() => removeBlockRow(row.id)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total Minutes Live Indicator */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, fontSize: '.8rem', fontWeight: 700, color: 'var(--secondary)' }}>
              Total Calculado: {calculateTotalMinutes()} minutos ({Math.floor(calculateTotalMinutes() / 60)}h {calculateTotalMinutes() % 60}min)
            </div>
          </div>

          {/* Observações */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Observações / Notas Extras</label>
            <textarea className="form-control" style={{ resize: 'none', height: 60 }} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Informe eventuais observações..." />
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
}
