'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { dbGetAll } from '@/lib/data';
import { useDataRefresh } from '@/lib/hooks';
import { StatCard, EmptyState, Modal, PageTransition, showToast, confirm } from '@/components/ui/DashboardUI';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils';
import { saveDocument, removeDocument } from '@/lib/actions';
import { generateRelatorioFinanceiro } from '@/lib/reports';

export default function SemedFinanceiro() {
  useDataRefresh();
  const repasses = dbGetAll<Record<string, unknown>>('repasses_financeiros');
  const total = repasses.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  const [modal, setModal] = useState(false);
  const [desc, setDesc] = useState('');
  const [fonte, setFonte] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(todayISO());

  const handleSave = async () => {
    if (!desc || !valor) return;
    await saveDocument('repasses_financeiros', null, {
      descricao: desc, fonte, valor: parseFloat(valor), data,
    });
    showToast('Repasse cadastrado!', 'success');
    setModal(false); setDesc(''); setFonte(''); setValor('');
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Excluir este repasse?')) {
      await removeDocument('repasses_financeiros', id);
      showToast('Repasse removido', 'success');
    }
  };

  return (
    <PageTransition>
      <div className="stats-row" style={{ marginBottom: 20 }}>
        <StatCard label="Total Repassado" value={formatCurrency(total)} icon="fa-money-bill-wave" color="green" />
        <StatCard label="Qtd Repasses" value={repasses.length} icon="fa-file-invoice-dollar" color="blue" />
      </div>

      <div className="panel-card" style={{ marginBottom: 16 }}>
        <div className="panel-card-body" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => generateRelatorioFinanceiro()}><i className="fa-solid fa-file-pdf" /> Exportar PDF</button>
            <button className="btn btn-primary" onClick={() => setModal(true)}><i className="fa-solid fa-plus" /> Novo Repasse</button>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header"><div className="panel-card-title"><i className="fa-solid fa-money-bill-wave" /> Repasses Financeiros</div></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Descrição</th><th>Fonte</th><th className="text-right">Valor</th><th>Data</th><th className="text-right">Ações</th></tr></thead>
            <tbody>
              {repasses.length === 0 ? <tr><td colSpan={5}><EmptyState icon="fa-money-bill-wave" title="Nenhum repasse" desc="Clique em 'Novo Repasse' para cadastrar" /></td></tr> :
              repasses.map((r, i) => (
                <motion.tr key={r.id as string} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <td style={{ fontWeight: 600 }}>{r.descricao as string || '—'}</td>
                  <td>{r.fonte as string || '—'}</td>
                  <td className="text-right" style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(Number(r.valor) || 0)}</td>
                  <td>{formatDate(r.data as string)}</td>
                  <td className="text-right">
                    <button className="btn btn-xs btn-danger" onClick={() => handleDelete(r.id as string)}><i className="fa-solid fa-trash" /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal id="repasse" open={modal} onClose={() => setModal(false)} title="Novo Repasse" icon="fa-money-bill-wave" iconColor="var(--success)" size="sm" footer={
        <><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-floppy-disk" /> Salvar</button></>
      }>
        <div className="form-group"><label className="form-label">Descrição *</label><input className="form-control" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: FUNDEB 2026" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Fonte</label><input className="form-control" value={fonte} onChange={e => setFonte(e.target.value)} placeholder="Ex: Federal" /></div>
          <div className="form-group"><label className="form-label">Valor (R$) *</label><input type="number" className="form-control" value={valor} onChange={e => setValor(e.target.value)} step="0.01" min="0" /></div>
        </div>
        <div className="form-group"><label className="form-label">Data</label><input type="date" className="form-control" value={data} onChange={e => setData(e.target.value)} /></div>
      </Modal>
    </PageTransition>
  );
}
