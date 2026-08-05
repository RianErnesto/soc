import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useData } from '../context/DataContext';

export default function CadernoErros() {
  const { data, atualizarErroCaderno, marcarErroDominado, removerErroCaderno, limparDominados } = useData();
  const erros = data.cadernoErros || [];

  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroAssunto, setFiltroAssunto] = useState('');
  const [filtroBanca, setFiltroBanca] = useState('');
  const [filtroDificuldade, setFiltroDificuldade] = useState('');
  const [mostrarDominados, setMostrarDominados] = useState(false);
  const [busca, setBusca] = useState('');
  const [erroSelecionado, setErroSelecionado] = useState(null);
  const [anotacaoEdicao, setAnotacaoEdicao] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showConfirmLimpar, setShowConfirmLimpar] = useState(false);
  const [ordenacao, setOrdenacao] = useState('recentes'); // recentes | frequentes | dificeis

  // Listas para filtros
  const disciplinasUnicas = [...new Set(erros.map(e => e.disciplina))].filter(Boolean).sort();
  const assuntosUnicos = [...new Set(
    erros
      .filter(e => !filtroDisciplina || e.disciplina === filtroDisciplina)
      .map(e => e.assunto)
  )].filter(Boolean).sort();
  const bancasUnicas = [...new Set(erros.map(e => e.banca))].filter(Boolean).sort();

  // Aplicar filtros
  let errosFiltrados = erros.filter(e => {
    if (!mostrarDominados && e.dominado) return false;
    if (mostrarDominados && !e.dominado) return false;
    if (filtroDisciplina && e.disciplina !== filtroDisciplina) return false;
    if (filtroAssunto && e.assunto !== filtroAssunto) return false;
    if (filtroBanca && e.banca !== filtroBanca) return false;
    if (filtroDificuldade && e.dificuldade !== filtroDificuldade) return false;
    if (busca) {
      const b = busca.toLowerCase();
      if (!e.enunciado?.toLowerCase().includes(b) && 
          !e.assunto?.toLowerCase().includes(b) &&
          !e.anotacao?.toLowerCase().includes(b) &&
          !e.tags?.some(t => t.toLowerCase().includes(b))) return false;
    }
    return true;
  });

  // Ordenação
  if (ordenacao === 'recentes') {
    errosFiltrados.sort((a, b) => new Date(b.dataErro) - new Date(a.dataErro));
  } else if (ordenacao === 'frequentes') {
    errosFiltrados.sort((a, b) => (b.vezesErrou || 1) - (a.vezesErrou || 1));
  } else if (ordenacao === 'dificeis') {
    const ordem = { 'muito difícil': 4, 'difícil': 3, 'média': 2, 'fácil': 1 };
    errosFiltrados.sort((a, b) => (ordem[b.dificuldade] || 2) - (ordem[a.dificuldade] || 2));
  }

  // Estatísticas
  const totalErros = erros.filter(e => !e.dominado).length;
  const totalDominados = erros.filter(e => e.dominado).length;
  const errosPorDisciplina = {};
  erros.filter(e => !e.dominado).forEach(e => {
    errosPorDisciplina[e.disciplina] = (errosPorDisciplina[e.disciplina] || 0) + 1;
  });
  const disciplinaComMaisErros = Object.entries(errosPorDisciplina)
    .sort((a, b) => b[1] - a[1])[0];

  // Abrir modal de detalhes
  const abrirDetalhes = (erro) => {
    setErroSelecionado(erro);
    setAnotacaoEdicao(erro.anotacao || '');
    setTagInput('');
  };

  const salvarAnotacao = () => {
    if (erroSelecionado) {
      atualizarErroCaderno(erroSelecionado.id, { anotacao: anotacaoEdicao });
      setErroSelecionado({ ...erroSelecionado, anotacao: anotacaoEdicao });
    }
  };

  const adicionarTag = () => {
    if (!tagInput.trim() || !erroSelecionado) return;
    const novaTag = tagInput.trim().toLowerCase();
    const tagsAtuais = erroSelecionado.tags || [];
    if (!tagsAtuais.includes(novaTag)) {
      const novasTags = [...tagsAtuais, novaTag];
      atualizarErroCaderno(erroSelecionado.id, { tags: novasTags });
      setErroSelecionado({ ...erroSelecionado, tags: novasTags });
    }
    setTagInput('');
  };

  const removerTag = (tag) => {
    if (!erroSelecionado) return;
    const novasTags = (erroSelecionado.tags || []).filter(t => t !== tag);
    atualizarErroCaderno(erroSelecionado.id, { tags: novasTags });
    setErroSelecionado({ ...erroSelecionado, tags: novasTags });
  };

  const handleDominar = () => {
    if (erroSelecionado) {
      marcarErroDominado(erroSelecionado.id);
      setErroSelecionado(null);
    }
  };

  const handleRemover = () => {
    if (erroSelecionado && window.confirm('Tem certeza que quer remover permanentemente essa questão do caderno?')) {
      removerErroCaderno(erroSelecionado.id);
      setErroSelecionado(null);
    }
  };

  const limparFiltros = () => {
    setFiltroDisciplina('');
    setFiltroAssunto('');
    setFiltroBanca('');
    setFiltroDificuldade('');
    setBusca('');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>📓 Caderno de Erros</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Suas questões erradas registradas automaticamente. Revise para nunca mais errar!
        </p>
      </div>

      {/* ESTATÍSTICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), transparent)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>❌</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-red)' }}>{totalErros}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Erros pendentes</div>
        </Card>
        <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), transparent)', borderColor: 'rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>💪</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-green)' }}>{totalDominados}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Já dominados</div>
        </Card>
        {disciplinaComMaisErros && (
          <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), transparent)', borderColor: 'rgba(245,158,11,0.3)' }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>🎯</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-orange)', lineHeight: '1.3' }}>
              {disciplinaComMaisErros[0].length > 25 
                ? disciplinaComMaisErros[0].substring(0, 25) + '...' 
                : disciplinaComMaisErros[0]}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
              Ponto fraco ({disciplinaComMaisErros[1]} erros)
            </div>
          </Card>
        )}
        <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), transparent)', borderColor: 'rgba(139,92,246,0.3)' }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>📊</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-purple)' }}>
            {erros.length > 0 ? Math.round((totalDominados / erros.length) * 100) : 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Superados</div>
        </Card>
      </div>

      {/* DICA MOTIVACIONAL */}
      {totalErros > 0 && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(79,125,249,0.08)',
          border: '1px solid rgba(79,125,249,0.2)',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
        }}>
          💡 <strong style={{ color: 'var(--accent-blue)' }}>Dica de ouro:</strong> Revise 5 erros por dia. Após entender bem uma questão, marque como <strong>"Dominei"</strong>. Assim, seu caderno fica sempre limpo e focado no que você ainda precisa aprender.
        </div>
      )}

      {/* FILTROS */}
      {erros.length > 0 && (
        <Card style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px' }}>🔍 Filtros e Busca</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                🔄 Limpar filtros
              </Button>
              {totalDominados > 0 && (
                <Button 
                  variant={mostrarDominados ? 'success' : 'secondary'} 
                  size="sm" 
                  onClick={() => setMostrarDominados(!mostrarDominados)}
                >
                  {mostrarDominados ? '💪 Vendo dominados' : '❌ Vendo pendentes'}
                </Button>
              )}
            </div>
          </div>

          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar por palavras no enunciado, assunto, anotação ou tags..."
            style={{
              width: '100%',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <select
              value={filtroDisciplina}
              onChange={e => { setFiltroDisciplina(e.target.value); setFiltroAssunto(''); }}
              style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
              }}
            >
              <option value="">📚 Todas disciplinas</option>
              {disciplinasUnicas.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={filtroAssunto}
              onChange={e => setFiltroAssunto(e.target.value)}
              style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
              }}
            >
              <option value="">🎯 Todos assuntos</option>
              {assuntosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select
              value={filtroBanca}
              onChange={e => setFiltroBanca(e.target.value)}
              style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
              }}
            >
              <option value="">🏛️ Todas bancas</option>
              {bancasUnicas.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select
              value={filtroDificuldade}
              onChange={e => setFiltroDificuldade(e.target.value)}
              style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
              }}
            >
              <option value="">⚡ Todas dificuldades</option>
              <option value="fácil">Fácil</option>
              <option value="média">Média</option>
              <option value="difícil">Difícil</option>
              <option value="muito difícil">🔥 Muito difícil</option>
            </select>

            <select
              value={ordenacao}
              onChange={e => setOrdenacao(e.target.value)}
              style={{
                background: 'var(--bg-primary)', border: '1px solid var(--accent-purple)',
                borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
              }}
            >
              <option value="recentes">📅 Mais recentes</option>
              <option value="frequentes">🔁 Mais errados</option>
              <option value="dificeis">🔥 Mais difíceis</option>
            </select>
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Exibindo <strong style={{ color: 'var(--accent-blue)' }}>{errosFiltrados.length}</strong> de {erros.length} questões
          </div>
        </Card>
      )}

      {/* LISTA DE ERROS */}
      {erros.length === 0 ? (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📓</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Caderno vazio! 🎉</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
            Ainda não há erros registrados. Toda vez que você errar uma questão nos módulos de <strong>Questões</strong> ou <strong>Simulado</strong>, ela virá automaticamente para cá!
          </p>
        </Card>
      ) : errosFiltrados.length === 0 ? (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Nenhum erro encontrado</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {mostrarDominados 
              ? 'Você ainda não dominou nenhum erro. Continue estudando!'
              : 'Nenhum erro corresponde aos filtros aplicados.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {errosFiltrados.map(erro => (
            <Card
              key={erro.id}
              onClick={() => abrirDetalhes(erro)}
              style={{
                padding: '18px 20px',
                cursor: 'pointer',
                background: erro.dominado 
                  ? 'rgba(16,185,129,0.05)' 
                  : erro.vezesErrou > 1 
                    ? 'rgba(239,68,68,0.05)' 
                    : 'var(--bg-card)',
                borderColor: erro.dominado 
                  ? 'rgba(16,185,129,0.3)'
                  : erro.vezesErrou > 1
                    ? 'rgba(239,68,68,0.3)'
                    : 'var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                    📚 {erro.disciplina}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: 'rgba(79,125,249,0.1)', color: 'var(--accent-blue)' }}>
                    🎯 {erro.assunto}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: 'rgba(245,158,11,0.1)', color: 'var(--accent-orange)' }}>
                    🏛️ {erro.banca}
                  </span>
                  {erro.vezesErrou > 1 && (
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'var(--accent-red)', color: '#fff' }}>
                      🔁 Errou {erro.vezesErrou}x
                    </span>
                  )}
                  {erro.dominado && (
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'var(--accent-green)', color: '#fff' }}>
                      💪 Dominado
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(erro.dataErro).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <p style={{ 
                fontSize: '14px', 
                color: 'var(--text-primary)', 
                lineHeight: '1.6', 
                marginBottom: '10px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {erro.enunciado}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--accent-red)' }}>❌ Marcou: <strong>{erro.respostaUsuario}</strong></span>
                  <span style={{ color: 'var(--accent-green)' }}>✅ Correta: <strong>{erro.respostaCorreta}</strong></span>
                </div>
                {erro.tags && erro.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {erro.tags.slice(0, 3).map(t => (
                      <span key={t} style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {erro.anotacao && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--accent-orange)',
                  fontStyle: 'italic',
                }}>
                  📌 {erro.anotacao.length > 100 ? erro.anotacao.substring(0, 100) + '...' : erro.anotacao}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Botão limpar dominados */}
      {totalDominados > 0 && mostrarDominados && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          {!showConfirmLimpar ? (
            <Button variant="danger" onClick={() => setShowConfirmLimpar(true)} icon="🗑️">
              Remover todos os dominados ({totalDominados})
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--accent-red)', fontWeight: 600 }}>
                Confirmar remoção de {totalDominados} questões dominadas?
              </span>
              <Button variant="danger" size="sm" onClick={() => { limparDominados(); setShowConfirmLimpar(false); }}>
                Sim, remover
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowConfirmLimpar(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE DETALHES */}
      <Modal
        isOpen={!!erroSelecionado}
        onClose={() => setErroSelecionado(null)}
        title={`📓 Revisão detalhada`}
        width="900px"
      >
        {erroSelecionado && (
          <div>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontWeight: 700 }}>
                📚 {erroSelecionado.disciplina}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', background: 'rgba(79,125,249,0.1)', color: 'var(--accent-blue)' }}>
                🎯 {erroSelecionado.assunto}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', background: 'rgba(245,158,11,0.1)', color: 'var(--accent-orange)' }}>
                🏛️ {erroSelecionado.banca}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', background: 'rgba(236,72,153,0.1)', color: 'var(--accent-pink)', textTransform: 'capitalize' }}>
                ⚡ {erroSelecionado.dificuldade}
              </span>
            </div>

            {/* Enunciado */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                📝 Enunciado
              </h4>
              <p style={{ fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {erroSelecionado.enunciado}
              </p>
            </div>

            {/* Alternativas */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🎯 Alternativas
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {erroSelecionado.alternativas?.map(alt => {
                  const isCorrect = alt.letra === erroSelecionado.respostaCorreta;
                  const isUserAnswer = alt.letra === erroSelecionado.respostaUsuario;
                  
                  let bg = 'var(--bg-primary)';
                  let border = 'var(--border-color)';
                  let color = 'var(--text-primary)';
                  let badge = '';
                  
                  if (isCorrect) {
                    bg = 'rgba(16,185,129,0.12)';
                    border = 'var(--accent-green)';
                    color = 'var(--accent-green)';
                    badge = '✅ Correta';
                  }
                  if (isUserAnswer && !isCorrect) {
                    bg = 'rgba(239,68,68,0.12)';
                    border = 'var(--accent-red)';
                    color = 'var(--accent-red)';
                    badge = '❌ Sua resposta';
                  }
                  
                  return (
                    <div key={alt.letra} style={{
                      padding: '12px 16px',
                      background: bg,
                      border: `2px solid ${border}`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '13px', flexShrink: 0,
                        background: isCorrect ? 'var(--accent-green)' : isUserAnswer ? 'var(--accent-red)' : 'rgba(255,255,255,0.05)',
                        color: (isCorrect || isUserAnswer) ? '#fff' : 'var(--text-secondary)',
                      }}>
                        {alt.letra}
                      </span>
                      <span style={{ flex: 1, color, fontSize: '13px' }}>{alt.texto}</span>
                      {badge && <span style={{ fontSize: '11px', fontWeight: 700, color }}>{badge}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explicação */}
            {erroSelecionado.explicacao && (
              <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(79,125,249,0.06)', border: '1px solid rgba(79,125,249,0.2)', borderRadius: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  💡 Explicação Detalhada
                </h4>
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {erroSelecionado.explicacao}
                </p>
              </div>
            )}

            {/* Segredo */}
            {erroSelecionado.segredo && (
              <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-orange)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  🔑 Segredo do Examinador
                </h4>
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {erroSelecionado.segredo}
                </p>
              </div>
            )}

            {/* Pegadinha */}
            {erroSelecionado.pegadinha && (
              <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '10px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--accent-pink)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ⚠️ Pegadinha da Banca
                </h4>
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {erroSelecionado.pegadinha}
                </p>
              </div>
            )}

            {/* Anotação pessoal */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                📌 Minha Anotação
              </h4>
              <textarea
                value={anotacaoEdicao}
                onChange={e => setAnotacaoEdicao(e.target.value)}
                placeholder="Escreva aqui suas observações, insights, o que aprendeu, macetes pessoais..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                }}
              />
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" onClick={salvarAnotacao}>
                  💾 Salvar anotação
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🏷️ Tags
              </h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarTag(); } }}
                  placeholder="Adicionar tag (ex: revisar, difícil, importante)..."
                  style={{
                    flex: 1,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                />
                <Button variant="secondary" size="sm" onClick={adicionarTag}>+ Adicionar</Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(erroSelecionado.tags || []).map(t => (
                  <span key={t} style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    background: 'rgba(139,92,246,0.15)', 
                    color: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    #{t}
                    <button
                      onClick={() => removerTag(t)}
                      style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {(!erroSelecionado.tags || erroSelecionado.tags.length === 0) && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nenhuma tag adicionada</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ 
              padding: '12px', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}>
              <span>📅 Errou em: {new Date(erroSelecionado.dataErro).toLocaleString('pt-BR')}</span>
              <span>🔁 Vezes errou: <strong style={{ color: 'var(--accent-red)' }}>{erroSelecionado.vezesErrou || 1}</strong></span>
              {erroSelecionado.ultimaRevisao && (
                <span>👁️ Última revisão: {new Date(erroSelecionado.ultimaRevisao).toLocaleDateString('pt-BR')}</span>
              )}
            </div>

            {/* Botões de ação */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button variant="danger" size="sm" onClick={handleRemover} icon="🗑️">
                Remover do caderno
              </Button>
              {!erroSelecionado.dominado ? (
                <Button variant="success" onClick={handleDominar} icon="💪">
                  Marcar como Dominado
                </Button>
              ) : (
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    atualizarErroCaderno(erroSelecionado.id, { dominado: false });
                    setErroSelecionado({ ...erroSelecionado, dominado: false });
                  }} 
                  icon="🔄"
                >
                  Desmarcar como Dominado
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}