import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { gerarResumo } from '../utils/geminiApi';
import CompartilharResumo from '../components/CompartilharResumo';

export default function Resumos() {
  const { data, getAllDisciplinas, addResumo } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [assunto, setAssunto] = useState('');
  const [nivel, setNivel] = useState('completo');
  const [showResumo, setShowResumo] = useState(null);
  const [compartilhando, setCompartilhando] = useState(null);

  const disciplinas = getAllDisciplinas();
  const apiKey = data.configuracoes.apiKey;
  const assuntosDisponiveis = disciplinas.find(d => d.nome === disciplina)?.assuntos || [];

  const handleGerar = async () => {
    if (!disciplina || !assunto) { setError('Selecione disciplina e assunto!'); return; }
    if (!apiKey) { setError('Configure sua chave API do Gemini!'); return; }

    setLoading(true);
    setError('');

    try {
      const conteudo = await gerarResumo({ disciplina, assunto, nivel }, apiKey);
      addResumo({ disciplina, assunto, nivel, conteudo });
    } catch (err) {
      setError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '18px', fontWeight: 700, marginTop: '20px', marginBottom: '8px', color: 'var(--accent-purple)' }}>{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '20px', fontWeight: 700, marginTop: '24px', marginBottom: '10px', color: 'var(--accent-blue)' }}>{line.replace('## ', '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '24px', fontWeight: 800, marginTop: '28px', marginBottom: '12px' }}>{line.replace('# ', '')}</h1>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ marginLeft: '20px', marginBottom: '4px', lineHeight: '1.6' }}>{renderBold(line.replace(/^[-*] /, ''))}</li>;
        if (line.match(/^\d+\./)) return <li key={i} style={{ marginLeft: '20px', marginBottom: '4px', lineHeight: '1.6', listStyleType: 'decimal' }}>{renderBold(line.replace(/^\d+\.\s*/, ''))}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} style={{ marginBottom: '8px', lineHeight: '1.7' }}>{renderBold(line)}</p>;
      });
  };

  const renderBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--accent-blue)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>📝 Resumos com IA</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Resumos completos e didáticos dos seus tópicos de estudo</p>
      </div>

      <Card style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>✨ Gerar Novo Resumo</h3>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <select
            value={disciplina}
            onChange={e => { setDisciplina(e.target.value); setAssunto(''); }}
            style={{
              flex: 1,
              minWidth: '200px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            <option value="">Selecione a disciplina...</option>
            {disciplinas.map((d, i) => (
              <option key={i} value={d.nome}>{d.nome}</option>
            ))}
          </select>

          <select
            value={assunto}
            onChange={e => setAssunto(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            <option value="">Selecione o assunto...</option>
            {assuntosDisponiveis.map((a, i) => (
              <option key={i} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={nivel}
            onChange={e => setNivel(e.target.value)}
            style={{
              width: '150px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            <option value="resumido">Resumido</option>
            <option value="completo">Completo</option>
            <option value="aprofundado">Aprofundado</option>
          </select>

          <Button onClick={handleGerar} loading={loading} disabled={loading} icon="🤖">
            {loading ? 'Gerando...' : 'Gerar Resumo'}
          </Button>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
        {data.resumos.map(resumo => (
          <Card
            key={resumo.id}
            glow
            onClick={() => setShowResumo(resumo)}
            style={{ padding: '20px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>{resumo.assunto}</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resumo.disciplina}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: 600,
                  background: 'rgba(139,92,246,0.1)',
                  color: '#8b5cf6',
                  textTransform: 'uppercase',
                }}>
                  {resumo.nivel}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setCompartilhando(resumo); }}
                  style={{
                    background: 'rgba(79,125,249,0.1)',
                    border: '1px solid rgba(79,125,249,0.3)',
                    color: 'var(--accent-blue)',
                    cursor: 'pointer',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(79,125,249,0.25)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(79,125,249,0.1)'}
                  title="Compartilhar / Exportar"
                >
                  📤
                </button>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {resumo.conteudo?.substring(0, 150)}...
            </p>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              📅 {new Date(resumo.criadoEm).toLocaleDateString('pt-BR')}
            </div>
          </Card>
        ))}
      </div>

      {data.resumos.length === 0 && (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Nenhum resumo gerado</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Selecione uma disciplina e assunto para gerar um resumo completo com IA</p>
        </Card>
      )}

      <Modal
        isOpen={!!showResumo}
        onClose={() => setShowResumo(null)}
        title={`📝 ${showResumo?.assunto || ''}`}
        width="900px"
      >
        {showResumo && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: 'rgba(79,125,249,0.1)', color: '#4f7df9' }}>
                  {showResumo.disciplina}
                </span>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                  {showResumo.nivel}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon="📤"
                onClick={() => setCompartilhando(showResumo)}
              >
                Compartilhar / Exportar
              </Button>
            </div>
            <div style={{ lineHeight: '1.7', fontSize: '14px' }}>
              {renderMarkdown(showResumo.conteudo)}
            </div>
          </div>
        )}
      </Modal>

      {compartilhando && (
        <CompartilharResumo 
          resumo={compartilhando} 
          onClose={() => setCompartilhando(null)}
        />
      )}
    </div>
  );
}