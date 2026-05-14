'use client';
import { useState } from 'react';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { showToast, Modal, EmptyState, confirm, PageTransition } from '@/components/ui/DashboardUI';
import { saveDocument, removeDocument } from '@/lib/actions';

export default function DirConteudo() {
  useDataRefresh();
  const depoimentos = dbGetAll<Record<string, unknown>>('depoimentos');
  const galeria = dbGetAll<Record<string, unknown>>('galeria');
  const equipe = dbGetAll<Record<string, unknown>>('equipe');
  const [tab, setTab] = useState('depoimentos');
  const [modal, setModal] = useState(''); const [editData, setEditData] = useState<Record<string, string>>({});

  const handleSave = async (col: string) => {
    await saveDocument(col, null, editData);
    showToast('Item salvo!', 'success'); setModal('');
  };
  const handleDelete = async (col: string, id: string) => { if (await confirm('Excluir?')) { await removeDocument(col, id); showToast('Excluído', 'success'); } };

  return (
    <PageTransition>
      <div style={{ background: 'linear-gradient(135deg,var(--purple),#9333ea)', borderRadius: 20, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
        <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}><i className="fa-solid fa-palette" /></div>
        <div><div style={{ fontWeight: 800 }}>Gerenciar Conteúdo do Site</div><div style={{ color: 'rgba(255,255,255,.55)', fontSize: '.82rem' }}>Edite depoimentos, galeria e equipe.</div></div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['depoimentos', 'galeria', 'equipe'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>{t === 'depoimentos' ? '💬 Depoimentos' : t === 'galeria' ? '📷 Galeria' : '👥 Equipe'}</button>
        ))}
      </div>

      {tab === 'depoimentos' && (
        <div className="panel-card"><div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-quote-left" /> Depoimentos</div>
          <button className="btn btn-sm btn-primary" onClick={() => { setEditData({ nome: '', cargo: '', texto: '', cor: '#2563eb' }); setModal('depoimentos'); }}><i className="fa-solid fa-plus" /> Novo</button></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Nome</th><th>Cargo</th><th>Texto</th><th className="text-right">Ações</th></tr></thead>
            <tbody>{depoimentos.map(d => (<tr key={d.id as string}><td>{d.nome as string}</td><td>{d.cargo as string}</td><td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.texto as string}</td>
              <td className="text-right"><button className="btn btn-xs btn-danger" onClick={() => handleDelete('depoimentos', d.id as string)}><i className="fa-solid fa-trash" /></button></td></tr>))}</tbody></table></div></div>
      )}
      {tab === 'galeria' && (
        <div className="panel-card"><div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-camera" /> Galeria</div>
          <button className="btn btn-sm btn-primary" onClick={() => { setEditData({ titulo: '', icone: 'fa-camera', imageUrl: '' }); setModal('galeria'); }}><i className="fa-solid fa-plus" /> Novo</button></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Título</th><th>Ícone</th><th className="text-right">Ações</th></tr></thead>
            <tbody>{galeria.map(g => (<tr key={g.id as string}><td>{g.titulo as string}</td><td><i className={`fa-solid ${g.icone as string}`} /></td>
              <td className="text-right"><button className="btn btn-xs btn-danger" onClick={() => handleDelete('galeria', g.id as string)}><i className="fa-solid fa-trash" /></button></td></tr>))}</tbody></table></div></div>
      )}
      {tab === 'equipe' && (
        <div className="panel-card"><div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-users" /> Equipe</div>
          <button className="btn btn-sm btn-primary" onClick={() => { setEditData({ nome: '', cargo: '', icone: 'fa-user', cor: '#2563eb' }); setModal('equipe'); }}><i className="fa-solid fa-plus" /> Novo</button></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Nome</th><th>Cargo</th><th className="text-right">Ações</th></tr></thead>
            <tbody>{equipe.map(e => (<tr key={e.id as string}><td>{e.nome as string}</td><td>{e.cargo as string}</td>
              <td className="text-right"><button className="btn btn-xs btn-danger" onClick={() => handleDelete('equipe', e.id as string)}><i className="fa-solid fa-trash" /></button></td></tr>))}</tbody></table></div></div>
      )}

      <Modal id="conteudo" open={!!modal} onClose={() => setModal('')} title={`Novo Item`} icon="fa-palette" iconColor="#9333ea" footer={
        <><button className="btn btn-ghost" onClick={() => setModal('')}>Cancelar</button><button className="btn btn-primary" onClick={() => handleSave(modal)}><i className="fa-solid fa-floppy-disk" /> Salvar</button></>
      }>
        {Object.entries(editData).map(([k, v]) => (
          <div key={k} className="form-group"><label className="form-label">{k.charAt(0).toUpperCase() + k.slice(1)}</label>
            {k === 'texto' ? <textarea className="form-control" rows={3} value={v} onChange={e => setEditData(p => ({ ...p, [k]: e.target.value }))} />
              : <input className="form-control" value={v} onChange={e => setEditData(p => ({ ...p, [k]: e.target.value }))} />}</div>
        ))}
      </Modal>
    </PageTransition>
  );
}
