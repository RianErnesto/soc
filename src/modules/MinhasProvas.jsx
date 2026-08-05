import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ContagemRegressiva from '../components/ContagemRegressiva';
import { useData } from '../context/DataContext';

// Fases de estudo baseadas em dias restantes
const FASES = [
  { min: 180, cor: '#4f7df9', icone: '🌱', nome: 'Base', descricao: 'Fase de fundação: estude teoria com calma, absorva conceitos, faça muitos resumos e flashcards' },
  { min: 90, cor: '#8b5cf6', icone: '📚', nome: 'Aprofundamento', descricao: 'Fase de aprofundamento: aumente o volume de questões, faça simulados quinzenais, revise erros' },
  { min: 60, cor: '#06b6d4', icone: '🎯', nome: 'Intensificação', descricao: 'Fase intensiva: 50-80 questões/dia, 1 simulado por semana, revisões semanais' },
  { min: 30, cor: '#f59e0b', icone: '⚡', nome: 'Reta Final', descricao: 'Reta final: foque nos erros, faça 2 simulados/semana, revise resumos diariamente' },
  { min: 15, cor: '#ef4444', icone: '🔥', nome: 'Sprint Final', descricao: 'Sprint final: só revisão! Não estude conteúdo novo. Simulados alternados com revisões' },
  { min: 7, cor: '#dc2626', icone: '🚨', nome: 'Última Semana', descricao: 'Última semana: descanse, revise flashcards, cuide da mente e corpo. Você já está pronto!' },
  { min: 3, cor: '#991b1b', icone: '💪', nome: 'Reta de Chegada', descricao: 'Reta de chegada: revise checklist, prepare documentos, durma bem, alimente-se bem' },
  { min: 0, cor: '#7c2d12', icone: '🎓', nome: 'É AGORA!', descricao: 'É HOJE! Vá com confiança! Respire fundo. Você estudou muito e merece essa aprovação!' },
];

const CHECKLIST_PADRAO = [
  '📄 Comprovante de inscrição',
  '🆔 Documento de identidade (RG/CNH)',
  '✍️ Caneta preta esferográfica',
  '⌚ Relógio analógico simples',
  '💧 Garrafa de água transparente',
  '🍫 Lanche leve (barrinha de cereal)',
  '📍 Confirmar local da prova',
  '🚗 Planejar rota até o local',
  '🛌 Dormir bem na noite anterior',
  '🎯 Chegar 1h antes',
];

export default function MinhasProvas() {
  const { data, adicionarProva, atualizarProva, removerProva, favoritarProva, adicionarItemChecklist, toggleChecklistItem, removerItemChecklist } = useData();
  const provas = data.provas || [];
  const estatisticas = data.estatisticas || {};

  const [modoAdicionar, setModoAdicionar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [provaDetalhes, setProvaDetalhes] = useState(null);
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  
  // Estado do formulário
  const [nome, setNome] = useState('');
  const [banca, setBanca] = useState('');
  const [data_, setData_] = useState('');
  const [hora, setHora] = useState('08:00');
  const [local, setLocal] = useState('');
  const [cargo, setCargo] = useState('');
  const [notaMeta, setNotaMeta] = useState(70);

  const limparForm = () => {
    setNome(''); setBanca(''); setData_(''); setHora('08:00');
    setLocal(''); setCargo(''); setNotaMeta(70);
    setModoAdicionar(false); setEditando(null);
  };

  const abrirEdicao = (prova) => {
    setNome(prova.nome || '');
    setBanca(prova.banca || '');
    setData_(prova.data ? prova.data.split('T')[0] : '');
    setHora(prova.hora || '08:00');
    setLocal(prova.local || '');
    setCargo(prova.cargo || '');
    setNotaMeta(prova.notaMeta || 70);
    setEditando(prova.id);
    setModoAdicionar(true);
  };

  const salvar = () => {
    if (!nome.trim() || !data_) {
      alert('Preencha pelo menos o nome e a data da prova!');
      return;
    }

    const dataCompleta = new Date(`${data_}T${hora}:00`).toISOString();

    const prova = {
      nome: nome.trim(),
      banca: banca.trim() || 'Não informada',
      data: dataCompleta,
      hora,
      local: local.trim(),
      cargo: cargo.trim(),
      notaMeta: Number(notaMeta),
    };

    if (editando) {
      atualizarProva(editando, prova);
    } else {
      adicionarProva(prova);
    }

    limparForm();
  };

  const excluir = (id) => {
    if (window.confirm('Excluir esta prova? Não poderá recuperar.')) {
      removerProva(id);
    }
  };

  const adicionarChecklistPadrao = (provaId) => {
    if (window.confirm('Adicionar checklist padrão (10 itens essenciais)?')) {
      CHECKLIST_PADRAO.forEach(item => {
        adicionarItemChecklist(provaId, item);
      });
    }
  };

  const adicionarItem = () => {
    if (!novoItemChecklist.trim() || !provaDetalhes) return;
    adicionarItemChecklist(provaDetalhes.id, novoItemChecklist.trim());
    setNovoItemChecklist('');
  };

  // Calcula dias restantes
  const calcularDiasRestantes = (dataProva) => {
    if (!dataProva) return null;
    const agora = new Date();
    const prova = new Date(dataProva);
    return Math.ceil((prova - agora) / (1000 * 60 * 60 * 24));
  };

  // Retorna a fase atual
  const getFase = (dias) => {
    if (dias === null || dias < 0) return null;
    return FASES.find(f => dias >= f.min) || FASES[FASES.length - 1];
  };

  // Calcula meta de questões por dia
  const calcularMetaQuestoes = (dias, notaMeta) => {
    if (!dias || dias < 1) return 0;
    const acertosAtuais = estatisticas.acertos || 0;
    const totalAtual = estatisticas.totalQuestoes || 0;
    const taxaAtual = totalAtual > 0 ? (acertosAtuais / totalAtual) * 100 : 0;
    
    // Estimativa: quanto mais baixa a taxa, mais questões precisa fazer
    let base = 20;
    if (taxaAtual < notaMeta) {
      const diferenca = notaMeta - taxaAtual;
      base = 20 + Math.round(diferenca * 0.8);
    }
    
    // Ajuste por urgência
    if (dias <= 30) base = Math.round(base * 1.5);
    if (dias <= 15) base = Math.round(base * 1.3);
    if (dias <= 7) base = Math.max(base, 40);
    
    return Math.min(base, 100); // Máximo 100
  };

  // Ordena provas: favorita primeiro, depois por data
  const provasOrdenadas = [...provas].sort((a, b) => {
    if (a.favorita && !b.favorita) return -1;
    if (!a.favorita && b.favorita) return 1;
    return new Date(a.data) - new Date(b.data);
  });

  const provaFavorita = provas.find(p => p.favorita);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
            📅 Minhas Provas
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gerencie todas as suas provas com contagem regressiva e checklist personalizados
          </p>
        </div>
        <Button variant="primary" icon="➕" onClick={() => setModoAdicionar(true)}>
          Adicionar Prova
        </Button>
      </div>

      {/* PROVA FAVORITA EM DESTAQUE */}
      {provaFavorita && !modoAdicionar && (
        <Card style={{ 
          padding: '32px', 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(79,125,249,0.15), rgba(139,92,246,0.15))',
          borderColor: 'var(--accent-blue)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
                ⭐ PROVA PRINCIPAL
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                {provaFavorita.nome}
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {provaFavorita.banca && <span>🏛️ {provaFavorita.banca}</span>}
                {provaFavorita.cargo && <span>👤 {provaFavorita.cargo}</span>}
                <span>📅 {new Date(provaFavorita.data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                {provaFavorita.hora && <span>🕐 {provaFavorita.hora}</span>}
              </div>
              {provaFavorita.local && (
                <div style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  📍 {provaFavorita.local}
                </div>
              )}
            </div>
          </div>

          {/* Contagem Regressiva Gigante */}
          <ContagemRegressiva dataProva={provaFavorita.data} />

          {/* Fase atual e recomendações */}
          {(() => {
            const dias = calcularDiasRestantes(provaFavorita.data);
            const fase = getFase(dias);
            const meta = calcularMetaQuestoes(dias, provaFavorita.notaMeta || 70);
            
            if (!fase || dias === null || dias < 0) return null;

            return (
              <div style={{ 
                marginTop: '20px', 
                padding: '20px', 
                background: `${fase.cor}15`, 
                border: `1px solid ${fase.cor}`,
                borderRadius: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '36px' }}>{fase.icone}</span>
                  <div>
                    <div style={{ fontSize: '11px', color: fase.cor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      FASE ATUAL
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: fase.cor }}>
                      {fase.nome}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '14px' }}>
                  {fase.descricao}
                </p>
                
                <div style={{ 
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}>
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: fase.cor }}>🎯 Meta recomendada:</strong>
                    <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>
                      {meta} questões/dia para atingir {provaFavorita.notaMeta || 70}%
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setProvaDetalhes(provaFavorita)}>
                    Ver detalhes
                  </Button>
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      {/* FORMULÁRIO ADICIONAR/EDITAR */}
      {modoAdicionar && (
        <Card style={{ padding: '28px', marginBottom: '24px', borderColor: 'var(--accent-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '18px' }}>
              {editando ? '✏️ Editar Prova' : '➕ Nova Prova'}
            </h3>
            <Button variant="ghost" size="sm" onClick={limparForm}>✕ Cancelar</Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                📝 Nome da Prova *
              </label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: CAIXA 2025, TRT-SP..."
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                🏛️ Banca
              </label>
              <input
                type="text"
                value={banca}
                onChange={e => setBanca(e.target.value)}
                placeholder="Ex: CESPE, FCC, Cesgranrio..."
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                👤 Cargo
              </label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Ex: Técnico Bancário..."
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                📅 Data *
              </label>
              <input
                type="date"
                value={data_}
                onChange={e => setData_(e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                🕐 Horário
              </label>
              <input
                type="time"
                value={hora}
                onChange={e => setHora(e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                🎯 Nota Meta (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={notaMeta}
                onChange={e => setNotaMeta(e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                📍 Local da Prova
              </label>
              <input
                type="text"
                value={local}
                onChange={e => setLocal(e.target.value)}
                placeholder="Ex: Escola Municipal João da Silva, Rua Tal, 123 - Bairro"
                style={{
                  width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
            </div>
          </div>

          <Button variant="primary" onClick={salvar} icon="💾" style={{ width: '100%' }}>
            {editando ? 'Atualizar Prova' : 'Salvar Prova'}
          </Button>
        </Card>
      )}

      {/* LISTA DE PROVAS */}
      {provas.length === 0 && !modoAdicionar ? (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '16px' }}>📅</div>
          <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '20px' }}>
            Cadastre suas provas!
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            Adicione as datas das suas provas para acompanhar contagem regressiva, receber estratégias personalizadas por fase e gerenciar checklist do dia da prova!
          </p>
          <Button variant="primary" icon="➕" size="lg" onClick={() => setModoAdicionar(true)}>
            Adicionar Primeira Prova
          </Button>
        </Card>
      ) : (
        provas.length > 1 && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>
              📋 Todas as Provas ({provas.length})
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {provasOrdenadas.filter(p => !p.favorita).map(prova => {
                const dias = calcularDiasRestantes(prova.data);
                const fase = getFase(dias);
                
                return (
                  <Card key={prova.id} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontWeight: 700, fontSize: '16px' }}>{prova.nome}</h4>
                          {fase && (
                            <span style={{ 
                              padding: '2px 10px', 
                              borderRadius: '20px', 
                              fontSize: '10px', 
                              fontWeight: 700,
                              background: `${fase.cor}20`,
                              color: fase.cor,
                              border: `1px solid ${fase.cor}`,
                            }}>
                              {fase.icone} {fase.nome}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {prova.banca && <span>🏛️ {prova.banca}</span>}
                          {prova.cargo && <span>👤 {prova.cargo}</span>}
                          <span>📅 {new Date(prova.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      
                      <ContagemRegressiva dataProva={prova.data} compacta={true} />

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button variant="ghost" size="sm" onClick={() => favoritarProva(prova.id)} title="Marcar como principal">
                          ⭐
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setProvaDetalhes(prova)}>
                          👁️ Detalhes
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicao(prova)}>
                          ✏️
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => excluir(prova.id)}>
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* MODAL DE DETALHES DA PROVA */}
      <Modal
        isOpen={!!provaDetalhes}
        onClose={() => setProvaDetalhes(null)}
        title={provaDetalhes?.nome || 'Detalhes'}
        width="800px"
      >
        {provaDetalhes && (
          <div>
            {/* Info */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '12px',
              marginBottom: '20px',
            }}>
              <div style={{ padding: '12px', background: 'rgba(79,125,249,0.06)', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Banca</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>🏛️ {provaDetalhes.banca}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Cargo</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>👤 {provaDetalhes.cargo || 'Não informado'}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(236,72,153,0.06)', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Data & Hora</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>
                  📅 {new Date(provaDetalhes.data).toLocaleDateString('pt-BR')}
                  {provaDetalhes.hora && <> • 🕐 {provaDetalhes.hora}</>}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(245,158,11,0.06)', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Meta</div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>🎯 {provaDetalhes.notaMeta || 70}%</div>
              </div>
            </div>

            {provaDetalhes.local && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
                <strong>📍 Local:</strong> {provaDetalhes.local}
              </div>
            )}

            {/* Contagem */}
            <div style={{ marginBottom: '20px' }}>
              <ContagemRegressiva dataProva={provaDetalhes.data} />
            </div>

            {/* CHECKLIST */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700 }}>
                  ✅ Checklist para o Dia da Prova ({(provaDetalhes.checklist || []).length})
                </h4>
                {(!provaDetalhes.checklist || provaDetalhes.checklist.length === 0) && (
                  <Button variant="secondary" size="sm" onClick={() => adicionarChecklistPadrao(provaDetalhes.id)} icon="✨">
                    Usar checklist padrão
                  </Button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={novoItemChecklist}
                  onChange={e => setNovoItemChecklist(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && adicionarItem()}
                  placeholder="Adicionar item ao checklist..."
                  style={{
                    flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                  }}
                />
                <Button variant="primary" size="sm" onClick={adicionarItem} icon="➕">
                  Adicionar
                </Button>
              </div>

              {(provaDetalhes.checklist || []).length > 0 ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  {(() => {
                    const checklistAtual = provas.find(p => p.id === provaDetalhes.id)?.checklist || [];
                    return checklistAtual.map(item => (
                      <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        background: item.concluido ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${item.concluido ? 'var(--accent-green)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                      }}>
                        <button
                          onClick={() => toggleChecklistItem(provaDetalhes.id, item.id)}
                          style={{
                            width: '22px', height: '22px', borderRadius: '6px',
                            border: `2px solid ${item.concluido ? 'var(--accent-green)' : 'var(--border-color)'}`,
                            background: item.concluido ? 'var(--accent-green)' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '12px', flexShrink: 0,
                          }}
                        >
                          {item.concluido && '✓'}
                        </button>
                        <span style={{ 
                          flex: 1, 
                          fontSize: '13px',
                          textDecoration: item.concluido ? 'line-through' : 'none',
                          opacity: item.concluido ? 0.6 : 1,
                        }}>
                          {item.texto}
                        </span>
                        <button
                          onClick={() => removerItemChecklist(provaDetalhes.id, item.id)}
                          style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', fontSize: '14px', padding: '2px',
                          }}
                          title="Remover"
                        >
                          🗑️
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                  Nenhum item no checklist. Adicione manualmente ou use o padrão!
                </div>
              )}

              {(provaDetalhes.checklist || []).length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {(provas.find(p => p.id === provaDetalhes.id)?.checklist || []).filter(i => i.concluido).length}/{(provas.find(p => p.id === provaDetalhes.id)?.checklist || []).length} concluídos
                </div>
              )}
            </div>

            {/* Botões finais */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              {!provaDetalhes.favorita && (
                <Button variant="secondary" onClick={() => { favoritarProva(provaDetalhes.id); setProvaDetalhes(null); }} icon="⭐">
                  Definir como Principal
                </Button>
              )}
              <Button variant="secondary" onClick={() => { abrirEdicao(provaDetalhes); setProvaDetalhes(null); }} icon="✏️">
                Editar
              </Button>
              <Button variant="danger" onClick={() => { excluir(provaDetalhes.id); setProvaDetalhes(null); }} icon="🗑️">
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}