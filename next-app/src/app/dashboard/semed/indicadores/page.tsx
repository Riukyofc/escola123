'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { StatCard, PageTransition } from '@/components/ui/DashboardUI';
import { showToast } from '@/components/ui/DashboardUI';
import type { EscolaRede, Aluno, Turma } from '@/lib/types';

export default function SemedIndicadores() {
  useDataRefresh();

  // Load all required collections
  const escolas = dbGetAll<EscolaRede>('escolas_rede').filter(e => e.ativa);
  const allAlunos = dbGetAll<Aluno>('alunos').filter(a => a.ativo);
  const allTurmas = dbGetAll<Turma>('turmas').filter(t => t.ativo);

  // School Selection Filter State
  const [filtroEscola, setFiltroEscola] = useState('');

  // Required properties lists for compliance auditing
  const schoolRequiredFields = ['codigoINEP', 'nome', 'endereco', 'cidade', 'estado', 'telefone', 'email', 'dependenciaAdm'];
  const infraRequiredFields = ['agua', 'esgoto', 'energia'];
  const studentRequiredFields = ['nome', 'dataNascimento', 'sexo', 'corRaca', 'cpf', 'turmaId', 'certidaoNascimento'];

  // 1. Filter schools & compute scoped students
  const { filteredEscolas, filteredAlunos, schoolScores, studentScores, globalPercent, fullyValidatedEscolas } = useMemo(() => {
    const fEscolas = filtroEscola ? escolas.filter(e => e.id === filtroEscola) : escolas;
    
    // Alunos belonging to filtered schools
    const fAlunos = allAlunos.filter(a => {
      const classObj = allTurmas.find(t => t.id === a.turmaId);
      const schoolId = a.escolaId || classObj?.escolaId;
      return fEscolas.some(e => e.id === schoolId);
    });

    let totalChecks = 0;
    let passedChecks = 0;

    // School level compliance calculations
    const sScores = fEscolas.map(e => {
      let checks = 0;
      let passed = 0;
      
      schoolRequiredFields.forEach(f => {
        checks++;
        if ((e as any)[f]) passed++;
      });
      
      infraRequiredFields.forEach(f => {
        checks++;
        if (e.infraestrutura && (e.infraestrutura as any)[f]) passed++;
      });

      totalChecks += checks;
      passedChecks += passed;

      return {
        escola: e,
        checks,
        passed,
        percent: checks > 0 ? Math.round((passed / checks) * 100) : 0
      };
    });

    // Student level compliance calculations
    const stScores = fEscolas.map(e => {
      const schoolStudents = allAlunos.filter(a => {
        const classObj = allTurmas.find(t => t.id === a.turmaId);
        return a.escolaId === e.id || classObj?.escolaId === e.id;
      });

      let checks = 0;
      let passed = 0;

      schoolStudents.forEach(a => {
        studentRequiredFields.forEach(f => {
          checks++;
          if ((a as any)[f]) passed++;
        });
      });

      totalChecks += checks;
      passedChecks += passed;

      return {
        escola: e,
        total: schoolStudents.length,
        checks,
        passed,
        percent: checks > 0 ? Math.round((passed / checks) * 100) : 0,
        missingDN: schoolStudents.filter(a => !a.dataNascimento).length,
        missingSexo: schoolStudents.filter(a => !a.sexo).length,
        missingCor: schoolStudents.filter(a => !a.corRaca).length,
        missingCert: schoolStudents.filter(a => !a.certidaoNascimento).length,
        missingCPF: schoolStudents.filter(a => !a.cpf).length
      };
    });

    const gPercent = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    const fullyValidated = sScores.filter(s => s.percent === 100).length;

    return {
      filteredEscolas: fEscolas,
      filteredAlunos: fAlunos,
      schoolScores: sScores,
      studentScores: stScores,
      globalPercent: gPercent,
      fullyValidatedEscolas: fullyValidated
    };
  }, [filtroEscola, escolas, allAlunos, allTurmas]);

  // Alunos with missing fields for warnings table
  const incompleteStudents = useMemo(() => {
    const list: { aluno: Aluno; missing: string[]; turmaName: string; escolaName: string }[] = [];
    filteredAlunos.forEach(a => {
      const missing: string[] = [];
      if (!a.dataNascimento) missing.push('Dt. Nasc.');
      if (!a.sexo) missing.push('Sexo');
      if (!a.corRaca) missing.push('Cor/Raça');
      if (!a.certidaoNascimento) missing.push('Certidão');
      if (!a.cpf) missing.push('CPF');

      if (missing.length > 0) {
        const t = allTurmas.find(x => x.id === a.turmaId);
        const schoolId = a.escolaId || t?.escolaId;
        const e = escolas.find(x => x.id === schoolId);
        list.push({
          aluno: a,
          missing,
          turmaName: t?.nome || '—',
          escolaName: e?.nomeAbreviado || '—'
        });
      }
    });
    return list;
  }, [filteredAlunos, allTurmas, escolas]);

  // Exporter to CSV
  const handleExportCSV = () => {
    let csv = '\uFEFFNome,Matricula,CPF,Data Nascimento,Sexo,Cor/Raca,Deficiencia,Transporte,Turma,Escola\n';
    filteredAlunos.forEach(a => {
      const t = allTurmas.find(x => x.id === a.turmaId);
      const schoolId = a.escolaId || t?.escolaId;
      const e = escolas.find(x => x.id === schoolId);
      
      csv += `"${a.nome}","${a.matricula}","${a.cpf || ''}","${a.dataNascimento || ''}","${a.sexo || ''}","${a.corRaca || ''}","${a.deficiencia ? 'Sim' : 'Não'}","${a.transporte || 'Não Utiliza'}","${t?.nome || ''}","${e?.nomeAbreviado || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `educacenso_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exportação concluída com sucesso!', 'success');
  };

  const getScoreColor = (p: number) => {
    return p >= 90 ? '#10b981' : p >= 70 ? '#f59e0b' : '#ef4444';
  };

  return (
    <PageTransition>
      {/* Top Action Filter Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <select 
            className="form-control form-select" 
            style={{ minWidth: 220, background: 'var(--panel-bg)', borderColor: 'var(--border)' }} 
            value={filtroEscola} 
            onChange={e => setFiltroEscola(e.target.value)}
          >
            <option value="">Rede de Ensino Completa</option>
            {escolas.map(e => (
              <option key={e.id} value={e.id}>{e.nomeAbreviado || e.nome}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => showToast('PDF de Auditoria em processamento.', 'info')}>
            <i className="fa-solid fa-file-pdf" /> Relatório PDF
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <i className="fa-solid fa-file-csv" /> Exportar Dados Censo (CSV)
          </button>
        </div>
      </div>

      {/* Auditoria Summary Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Compliance Meter */}
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--panel-bg)', textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Qualidade Global
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: getScoreColor(globalPercent) }}>
            {globalPercent}%
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6, overflow: 'hidden', marginTop: 8 }}>
            <div style={{ background: getScoreColor(globalPercent), height: '100%', width: `${globalPercent}%`, borderRadius: 99 }} />
          </div>
        </div>

        {/* Validated Schools Counter */}
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--panel-bg)', textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Escolas Validadas
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb' }}>
            {fullyValidatedEscolas} / {filteredEscolas.length}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 8 }}>Cadastros 100% em dia</div>
        </div>

        {/* Student Count */}
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--panel-bg)', textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Alunos Escaneados
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#059669' }}>
            {filteredAlunos.length}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 8 }}>Registrados no escopo</div>
        </div>

        {/* AEE Recursos Count */}
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--panel-bg)', textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Alunos AEE
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#a855f7' }}>
            {filteredAlunos.filter(a => a.deficiencia).length}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 8 }}>Com necessidades especiais</div>
        </div>

        {/* Transport Count */}
        <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--panel-bg)', textAlign: 'center' }}>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Transporte Público
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>
            {filteredAlunos.filter(a => a.transporte && a.transporte !== 'nenhum').length}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 8 }}>Dependentes de rota rural</div>
        </div>
      </div>

      {/* Compliance Checklist Cards (Schools & Students side-by-side) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Schools checklist panel */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title"><i className="fa-solid fa-building-flag" /> Conformidade Escolar</div>
          </div>
          <div className="panel-card-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {schoolScores.map(({ escola, percent }) => {
              const infra = escola.infraestrutura || {};
              return (
                <div key={escola.id} style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '.84rem', color: 'var(--secondary)' }}>{escola.nomeAbreviado}</span>
                    <span className="badge" style={{ background: `${getScoreColor(percent)}15`, color: getScoreColor(percent), border: `1px solid ${getScoreColor(percent)}30`, fontSize: '.68rem', fontWeight: 700 }}>
                      {percent}% OK
                    </span>
                  </div>
                  <div style={{ fontSize: '.76rem', color: 'var(--text-main)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>Código INEP:</span>
                      <span style={{ fontWeight: 600, color: escola.codigoINEP ? '#10b981' : '#ef4444' }}>{escola.codigoINEP ? 'Preenchido' : 'Faltante'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>Endereço Completo:</span>
                      <span style={{ fontWeight: 600, color: (escola.endereco && escola.cidade) ? '#10b981' : '#ef4444' }}>{(escola.endereco && escola.cidade) ? 'OK' : 'Faltante'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>Telefone & E-mail:</span>
                      <span style={{ fontWeight: 600, color: (escola.telefone && escola.email) ? '#10b981' : '#ef4444' }}>{(escola.telefone && escola.email) ? 'OK' : 'Faltante'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>Dependência Administrativa:</span>
                      <span style={{ fontWeight: 600, color: escola.dependenciaAdm ? '#10b981' : '#ef4444' }}>{escola.dependenciaAdm ? 'OK' : 'Faltante'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>Serviços de Infraestrutura (Água/Esgoto/Energia):</span>
                      <span style={{ fontWeight: 600, color: (infra.agua && infra.esgoto && infra.energia) ? '#10b981' : '#ef4444' }}>
                        {(infra.agua && infra.esgoto && infra.energia) ? 'OK' : 'Incompleto'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Students checklist panel */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div className="panel-card-title"><i className="fa-solid fa-users-viewfinder" /> Conformidade Alunos</div>
          </div>
          <div className="panel-card-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {studentScores.map(s => (
              <div key={s.escola.id} style={{ marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: '.84rem', color: 'var(--secondary)' }}>{s.escola.nomeAbreviado} ({s.total} Alunos)</span>
                  <span className="badge" style={{ background: `${getScoreColor(s.percent)}15`, color: getScoreColor(s.percent), border: `1px solid ${getScoreColor(s.percent)}30`, fontSize: '.68rem', fontWeight: 700 }}>
                    {s.percent}% OK
                  </span>
                </div>
                <div style={{ fontSize: '.76rem', color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>Data de Nascimento:</span>
                    <span style={{ fontWeight: 600, color: s.missingDN === 0 ? '#10b981' : '#ef4444' }}>{s.missingDN === 0 ? 'Tudo OK' : `Falta em ${s.missingDN} alunos`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>Gênero/Sexo:</span>
                    <span style={{ fontWeight: 600, color: s.missingSexo === 0 ? '#10b981' : '#ef4444' }}>{s.missingSexo === 0 ? 'Tudo OK' : `Falta em ${s.missingSexo} alunos`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>Cor / Raça:</span>
                    <span style={{ fontWeight: 600, color: s.missingCor === 0 ? '#10b981' : '#ef4444' }}>{s.missingCor === 0 ? 'Tudo OK' : `Falta em ${s.missingCor} alunos`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>CPF (Diferencial Censo):</span>
                    <span style={{ fontWeight: 600, color: s.missingCPF === 0 ? '#10b981' : '#ef4444' }}>{s.missingCPF === 0 ? 'Tudo OK' : `Falta em ${s.missingCPF} alunos`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>Nº Certidão de Nascimento:</span>
                    <span style={{ fontWeight: 600, color: s.missingCert === 0 ? '#10b981' : '#ef4444' }}>{s.missingCert === 0 ? 'Tudo OK' : `Falta em ${s.missingCert} alunos`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Infrastructure Grid */}
      <div className="panel-card" style={{ marginBottom: 20 }}>
        <div className="panel-card-header">
          <div className="panel-card-title"><i className="fa-solid fa-sheet-plastic" /> Matriz de Infraestrutura de Rede</div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Escola</th>
                <th className="text-center">Água</th>
                <th className="text-center">Esgoto</th>
                <th className="text-center">Internet</th>
                <th className="text-center">Acessibilidade</th>
                <th className="text-center">Biblioteca</th>
                <th className="text-center">Lab. Informática</th>
                <th className="text-center">Banheiro PNE</th>
                <th className="text-center">Sala AEE</th>
              </tr>
            </thead>
            <tbody>
              {filteredEscolas.map(e => {
                const i = e.infraestrutura || {};
                const boolBadge = (v: any) => v ? <span className="badge badge-green">✓</span> : <span className="badge badge-red">✗</span>;
                const textBadge = (v: any) => v ? <span style={{ fontSize: '.7rem', color: 'var(--text-main)', fontWeight: 600 }}>{v}</span> : <span className="badge badge-red">✗</span>;

                return (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700 }}>{e.nomeAbreviado}</td>
                    <td className="text-center">{textBadge(i.agua)}</td>
                    <td className="text-center">{textBadge(i.esgoto)}</td>
                    <td className="text-center">{boolBadge(i.internet)}</td>
                    <td className="text-center">{boolBadge(i.acessibilidade)}</td>
                    <td className="text-center">{boolBadge(i.biblioteca)}</td>
                    <td className="text-center">{boolBadge(i.laboratorioInformatica)}</td>
                    <td className="text-center">{boolBadge(i.banheiroPNE)}</td>
                    <td className="text-center">{boolBadge(i.salaRecursos)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incomplete Profiles Warnings Table */}
      <div className="panel-card">
        <div className="panel-card-header">
          <div className="panel-card-title" style={{ color: 'var(--danger)' }}>
            <i className="fa-solid fa-triangle-exclamation" /> Perfis de Alunos com Dados Pendentes para o Censo
          </div>
          <span className="badge badge-red">{incompleteStudents.length}</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome do Aluno</th>
                <th>Escola</th>
                <th>Turma</th>
                <th>Campos Faltantes</th>
                <th className="text-center">Status Censo</th>
              </tr>
            </thead>
            <tbody>
              {incompleteStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#10b981', fontWeight: 700 }}>
                    ✨ Sensacional! Todos os registros de alunos no escopo possuem os dados obrigatórios completos.
                  </td>
                </tr>
              ) : (
                incompleteStudents.map(item => (
                  <tr key={item.aluno.id}>
                    <td style={{ fontWeight: 700 }}>{item.aluno.nome}</td>
                    <td>{item.escolaName}</td>
                    <td>{item.turmaName}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {item.missing.map(m => (
                          <span key={m} className="badge" style={{ background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', fontSize: '.6rem' }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-red" style={{ fontSize: '.64rem', fontWeight: 800 }}>
                        Pendente
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
