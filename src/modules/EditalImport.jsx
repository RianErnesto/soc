import React, { useState, useRef } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';
import { parseEdital } from '../utils/geminiApi';

export default function EditalImport() {
  const { data, addEdital, removeEdital } = useData();
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [cargosSelecionados, setCargosSelecionados] = useState({});
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [expandedCargo, setExpandedCargo] = useState(null);
  const [editalDetalhes, setEditalDetalhes] = useState(null);
  const [progresso, setProgresso] = useState(null);
  const fileInputRef = useRef();

  const apiKey = data.configuracoes.apiKey;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setTexto(ev.target.result); setError(''); };
    reader.onerror = () => setError('Erro ao ler arquivo');
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      setError('Por enquanto suporta arquivos .txt. Copie e cole o conteúdo do PDF no campo de texto.');
    }
  };

  const analisarEdital = async () => {
    if (!texto.trim()) { setError('Cole ou importe o conteúdo programático do edital'); return; }
    if (!apiKey) { setError('Configure sua chave API do Gemini em Configurações antes de continuar!'); return; }
    setLoading(true);
    setError('');
    setProgresso(null);
    try {
      const parsed = await parseEdital(texto, apiKey, (atual, total) => {
        setProgresso({ atual, total });
      });
      setResultado(parsed);
      setStep(2);
      const initialSelection = {};
      parsed.cargos?.forEach((_, i) => { initialSelection[i] = false; });
      setCargosSelecionados(initialSelection);
    } catch (err) {
      setError(`Erro ao analisar edital: ${err.message}`);
    } finally {
      setLoading(false);
      setProgresso(null);
    }
  };

  const confirmarSelecao = () => {
    const cargosEscolhidos = resultado.cargos
      .filter((_, i) => cargosSelecionados[i])
      .map(c => ({ ...c, selecionado: true }));
    if (cargosEscolhidos.length === 0) { setError('Selecione pelo menos um cargo!'); return; }
    const edital = {
      nome: resultado.concurso || 'Concurso',
      banca: resultado.banca || 'Não identificada',
      cargos: cargosEscolhidos,
      textoOriginal: texto.substring(0, 500),
    };
    addEdital(edital);
    setTexto('');
    setResultado(null);
    setStep(1);
    setCargosSelecionados({});
    setExpandedCargo(null);
  };

  const toggleCargo = (index) => {
    setCargosSelecionados(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const selecionarTodosCargos = () => {
    const todos = {};
    resultado.cargos?.forEach((_, i) => { todos[i] = true; });
    setCargosSelecionados(todos);
  };

  const desmarcarTodosCargos = () => {
    setCargosSelecionados({});
  };

  const totalSelecionados = Object.values(cargosSelecionados).filter(Boolean).length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>📋 Importação de Editais</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Importe o conteúdo programático do edital para alimentar todo o sistema</p>
      </div>

      {data.editais.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 700 }}>
            ✅ Editais Importados ({data.editais.length})
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {data.editais.map(edital => (
              <Card key={edital.id} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>{edital.nome}</h4>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>🏛️ Banca: {edital.banca}</span>
                      <span>👤 {edital.cargos?.length} cargo(s)</span>
                      <span>📚 {edital.cargos?.reduce((acc, c) => acc + (c.disciplinas?.length || 0), 0)} disciplinas</span>
                      <span>📝 {edital.cargos?.reduce((acc, c) => acc + c.disciplinas?.reduce((a, d) => a + (d.assuntos?.length || 0), 0), 0)} assuntos</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" size="sm" onClick={() => { setShowModal(true); setEditalDetalhes(edital); }}>👁️ Ver</Button>
                    <Button variant="danger" size="sm" onClick={() => removeEdital(edital.id)}>🗑️</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <Card style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>
              {data.editais.length > 0 ? 'Adicionar Novo Edital' : 'Importar Conteúdo Programático'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Cole o conteúdo programático do edital ou importe um arquivo de texto
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', justifyContent: 'center' }}>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon="📁">
              Importar Arquivo (.txt)
            </Button>
            <input ref={fileInputRef} type="file" accept=".txt,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>

          <textarea
            value={texto}
            onChange={e => { setTexto(e.target.value); setError(''); }}
            placeholder="Cole aqui o conteúdo programático do edital..."
            style={{
              width: '100%',
              minHeight: '300px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
            }}
          />

          {texto && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              📊 {texto.length.toLocaleString()} caracteres
              {texto.length > 20000 && (
                <span style={{ marginLeft: '12px', color: 'var(--accent-orange)' }}>
                  ⚡ Edital grande — será dividido em partes para processamento (mais lento, mas captura todos os cargos)
                </span>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <Button onClick={analisarEdital} loading={loading} disabled={!texto.trim() || loading} size="lg" icon="🤖">
              {loading ? 'Analisando com IA...' : 'Analisar Edital com IA'}
            </Button>
          </div>

          {loading && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <div className="shimmer-loading" style={{ height: '20px', borderRadius: '10px', marginBottom: '8px' }} />
              <div className="shimmer-loading" style={{ height: '20px', borderRadius: '10px', width: '80%', margin: '0 auto 8px' }} />
              <div className="shimmer-loading" style={{ height: '20px', borderRadius: '10px', width: '60%', margin: '0 auto' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px' }}>
                {progresso 
                  ? `🤖 Processando parte ${progresso.atual} de ${progresso.total}... (editais grandes são divididos em partes)`
                  : '🤖 A IA está lendo e analisando o edital...'}
              </p>
              {progresso && (
                <div style={{
                  marginTop: '12px',
                  height: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  maxWidth: '400px',
                  margin: '12px auto 0',
                }}>
                  <div style={{
                    width: `${(progresso.atual / progresso.total) * 100}%`,
                    height: '100%',
                    background: 'var(--gradient-1)',
                    borderRadius: '10px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              )}
              {progresso && (
                <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Aguarde... Isso pode levar alguns minutos para editais muito grandes.
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {step === 2 && resultado && (
        <Card style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>🏛️ {resultado.concurso}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Banca: {resultado.banca} • {resultado.cargos?.length} cargo(s) encontrado(s)
            </p>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'rgba(79,125,249,0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(79,125,249,0.15)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>
              {totalSelecionados > 0 
                ? `✅ ${totalSelecionados} cargo(s) selecionado(s)` 
                : 'Selecione os cargos que deseja estudar:'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="sm" onClick={selecionarTodosCargos}>
                ☑️ Selecionar todos
              </Button>
              <Button variant="ghost" size="sm" onClick={desmarcarTodosCargos}>
                ⬜ Desmarcar todos
              </Button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {resultado.cargos?.map((cargo, i) => (
              <div key={i}>
                <Card
                  onClick={() => toggleCargo(i)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    background: cargosSelecionados[i] ? 'rgba(79,125,249,0.12)' : 'var(--bg-card)',
                    borderColor: cargosSelecionados[i] ? 'var(--accent-blue)' : 'var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      border: `2px solid ${cargosSelecionados[i] ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      background: cargosSelecionados[i] ? 'var(--accent-blue)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', color: '#fff', flexShrink: 0,
                    }}>
                      {cargosSelecionados[i] && '✓'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{cargo.nome}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Nível: {cargo.nivel} • {cargo.disciplinas?.length} disciplinas • {cargo.disciplinas?.reduce((a, d) => a + (d.assuntos?.length || 0), 0)} assuntos
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setExpandedCargo(expandedCargo === i ? null : i); }}>
                      {expandedCargo === i ? '▲' : '▼'} Detalhes
                    </Button>
                  </div>
                </Card>

                {expandedCargo === i && (
                  <div style={{ margin: '0 12px', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 12px 12px', border: '1px solid var(--border-color)', borderTop: 'none' }}>
                    {['basico', 'especifico'].map(tipo => {
                      const discs = cargo.disciplinas?.filter(d => d.tipo === tipo);
                      if (!discs?.length) return null;
                      return (
                        <div key={tipo} style={{ marginBottom: '16px' }}>
                          <h5 style={{
                            fontWeight: 700,
                            marginBottom: '10px',
                            color: tipo === 'basico' ? 'var(--accent-blue)' : 'var(--accent-purple)',
                            textTransform: 'uppercase',
                            fontSize: '12px',
                            letterSpacing: '1px',
                          }}>
                            {tipo === 'basico' ? '📘 Conhecimentos Básicos' : '📗 Conhecimentos Específicos'}
                          </h5>
                          {discs.map((disc, di) => (
                            <div key={di} style={{ marginBottom: '12px', paddingLeft: '12px' }}>
                              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                                {disc.nome}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {disc.assuntos?.map((assunto, ai) => (
                                  <span key={ai} style={{
                                    padding: '2px 10px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                  }}>
                                    {assunto}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => { setStep(1); setResultado(null); }}>
              ← Voltar
            </Button>
            <Button onClick={confirmarSelecao} icon="✅" size="lg" disabled={totalSelecionados === 0}>
              Confirmar Seleção ({totalSelecionados})
            </Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditalDetalhes(null); }}
        title={editalDetalhes?.nome || 'Detalhes do Edital'}
        width="800px"
      >
        {editalDetalhes?.cargos?.map((cargo, ci) => (
          <div key={ci} style={{ marginBottom: '24px' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '16px', color: 'var(--accent-blue)' }}>
              👤 {cargo.nome} ({cargo.nivel})
            </h4>
            {cargo.disciplinas?.map((disc, di) => (
              <div key={di} style={{ marginBottom: '16px', paddingLeft: '16px' }}>
                <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>
                  {disc.tipo === 'basico' ? '📘' : '📗'} {disc.nome}
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {disc.assuntos?.map((a, ai) => (
                    <span key={ai} style={{
                      padding: '3px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      background: 'rgba(79,125,249,0.08)',
                      color: 'var(--text-secondary)',
                      border: '1px solid rgba(79,125,249,0.2)',
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </Modal>
    </div>
  );
}