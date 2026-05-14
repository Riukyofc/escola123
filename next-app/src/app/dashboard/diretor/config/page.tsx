'use client';
import { useState, useEffect } from 'react';
import { getConfig, dbGet } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, PageTransition } from '@/components/ui/DashboardUI';
import { saveSingleton, toggleSistema } from '@/lib/actions';
import type { Escola } from '@/lib/types';

export default function DirConfig() {
  useDataRefresh();
  const cfg = getConfig();
  const escola = dbGet<Escola>('escola');
  const [nome, setNome] = useState(''); const [cidade, setCidade] = useState(''); const [wpp, setWpp] = useState(''); const [email, setEmail] = useState('');
  const [notaMin, setNotaMin] = useState('5'); const [bim, setBim] = useState('1'); const [senhaProf, setSenhaProf] = useState(''); const [senhaDir, setSenhaDir] = useState('');
  const [sistemaAberto, setSistemaAberto] = useState(true);

  useEffect(() => {
    setNotaMin(String(cfg.notaMinima ?? 5)); setBim(String(cfg.bimestreAtual ?? 1));
    setSenhaProf(cfg.senhaProf || ''); setSenhaDir(cfg.senhaDir || '');
    setSistemaAberto(!cfg.sistemaFechado);
    if (escola) {
      setNome(escola.nome || ''); setCidade(escola.cidade || '');
      setWpp(escola.whatsapp || ''); setEmail(escola.email || '');
    }
  }, []);

  const saveEscola = async () => { await saveSingleton('escola', { nome, cidade, whatsapp: wpp, email }); showToast('Dados salvos!', 'success'); };
  const saveConfig = async () => { await saveSingleton('config', { notaMinima: parseFloat(notaMin), bimestreAtual: parseInt(bim), senhaProf, senhaDir }); showToast('Config salva!', 'success'); };
  const handleToggle = async () => { const newState = !sistemaAberto; setSistemaAberto(newState); await toggleSistema(!newState); showToast(newState ? 'Sistema aberto!' : 'Sistema fechado!', 'success'); };

  return (
    <PageTransition>
      <div className="system-control-card">
        <div className="system-toggle-big">
          <div><div className="system-toggle-title">{sistemaAberto ? '🟢 Sistema Aberto' : '🔴 Sistema Fechado'}</div>
            <div className="system-toggle-desc">{sistemaAberto ? 'Professores podem lançar notas e frequência' : 'Lançamentos bloqueados para professores'}</div></div>
          <label className="big-toggle"><input type="checkbox" checked={sistemaAberto} onChange={handleToggle} /><span className="big-toggle-slider" /></label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="responsive-2col">
        <div className="panel-card"><div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-school" /> Dados da Escola</div></div>
          <div className="panel-card-body">
            <div className="form-group"><label className="form-label">Nome da Escola</label><input className="form-control" value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Cidade / Estado</label><input className="form-control" value={cidade} onChange={e => setCidade(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">WhatsApp</label><input className="form-control" value={wpp} onChange={e => setWpp(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={saveEscola}><i className="fa-solid fa-floppy-disk" /> Salvar</button>
          </div></div>

        <div className="panel-card"><div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-sliders" /> Configurações Gerais</div></div>
          <div className="panel-card-body">
            <div className="form-group"><label className="form-label">Nota Mínima</label><input type="number" className="form-control" value={notaMin} onChange={e => setNotaMin(e.target.value)} min="0" max="10" step="0.5" /></div>
            <div className="form-group"><label className="form-label">Bimestre Atual</label><select className="form-control form-select" value={bim} onChange={e => setBim(e.target.value)}>
              {[1,2,3,4].map(b => <option key={b} value={String(b)}>{b}º Bimestre</option>)}</select></div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
            <div className="form-group"><label className="form-label">Senha Professores</label><input className="form-control" value={senhaProf} onChange={e => setSenhaProf(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Senha Diretor(a)</label><input className="form-control" value={senhaDir} onChange={e => setSenhaDir(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={saveConfig}><i className="fa-solid fa-floppy-disk" /> Salvar</button>
          </div></div>
      </div>
    </PageTransition>
  );
}
