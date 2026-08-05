import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { gerarFlashcards } from '../utils/geminiApi';

export default function Flashcards() {
  const { data, getAllDisciplinas, addFlashcard, revisarFlashcard, removerFlashcard } = useData();
  
  const [modo, setModo] = useState('revisar'); // revisar | criar | biblioteca
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [assunto, setAssunto] = useState('');
  const [quantidade, setQuantidade] = useState(10);
  
  // Modo Revisar
  const [cardsRevisao, setCardsRevisao] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [mostrouResposta, setMostrouResposta] = useState(false);
  const [sessaoFinalizada, setSessaoFinalizada] = useState(false);
  const [estatisticasSessao, setEstatisticasSessao] = useState({ errei: 0, dificil: 0, bom: 0, facil: 0 });
  
  // Modo Biblioteca
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [cardsFlippedBib, setCardsFlippedBib] = useState({});
  const [busca, setBusca] = useState('');

  const disciplinas = getAllDisciplinas();
  const apiKey = data.configuracoes.apiKey;
  const assuntosDisponiveis = disciplinas.find(d => d.nome === disciplina)?.assuntos || [];

  // Calcular cards para revisar
  const agora = new Date();
  const flashcards = data.flashcards || [];
  const cardsParaRevisar = flashcards.filter(c => {
    const proxima = new Date(c.proximaRevisao || 0);
    return proxima <= agora;
  });

  const cardsNovos = flashcards.filter(c => c.status === 'novo' || !c.status).length;
  const cardsAprendendo = flashcards.filter(c => c.status === 'aprendendo').length;
  const cardsDominados = flashcards.filter(c => c.status === 'dominado').length;

  // Inicia sessão de revisão
  const iniciarRevisao = () => {
    if (cardsParaRevisar.length === 0) return;
    // Embaralha os cards
    const embaralhados = [...cardsParaRevisar].sort(() => Math.random() - 0.5);
    setCardsRevisao(embaralhados);
    setIndiceAtual(0);
    setMostrouResposta(false);
    setSessaoFinalizada(false);
    setEstatisticasSessao({ errei: 0, dificil: 0, bom: 0, facil: 0 });
  };

  const avaliarCard = (qualidade) => {
    const card = cardsRevisao[indiceAtual];
    if (!card) return;

    // Atualiza estatísticas da sessão
    const nomes = { 0: 'errei', 3: 'dificil', 4: 'bom', 5: 'facil' };
    setEstatisticasSessao(prev => ({
      ...prev,
      [nomes[qualidade]]: (prev[nomes[qualidade]] || 0) + 1,
    }));

    // Aplica algoritmo SM-2
    revisarFlashcard(card.id, qualidade);

    // Próximo card ou finalizar
    if (indiceAtual < cardsRevisao.length - 1) {
      setIndiceAtual(indiceAtual + 1);
      setMostrouResposta(false);
    } else {
      setSessaoFinalizada(true);
    }
  };

  const handleGerar = async () => {
    if (!disciplina || !assunto) { setError('Selecione disciplina e assunto!'); return; }
    if (!apiKey) { setError('Configure sua chave API do Gemini!'); return; }

    setLoading(true);
    setError('');

    try {
      const cards = await gerarFlashcards({ disciplina, assunto, quantidade }, apiKey);
      cards.forEach(card => addFlashcard(card));
      setError('');
      setTimeout(() => {
        alert(`✅ ${cards.length} flashcards criados com sucesso!`);
      }, 300);
    } catch (err) {
      setError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Formata quando será a próxima revisão
  const formatarProximaRevisao = (intervalo, qualidade) => {
    if (qualidade === 0) return 'amanhã';
    if (qualidade === 3) {
      if (intervalo === 0 || intervalo === 1) return 'amanhã';
      return `em ~${intervalo} dias`;
    }
    if (intervalo === 1) return 'amanhã';
    if (intervalo < 7) return `em ${intervalo} dias`;
    if (intervalo < 30) return `em ${Math.round(intervalo / 7)} semana(s)`;
    return `em ~${Math.round(intervalo / 30)} mês(es)`;
  };

  // Simula intervalos para preview
  const previewIntervalo = (card, qualidade) => {
    if (!card) return '';
    let { intervalo = 0, facilidade = 2.5, repeticoes = 0 } = card;
    if (qualidade < 3) {
      intervalo = 1;
    } else {
      if (repeticoes === 0) intervalo = 1;
      else if (repeticoes === 1) intervalo = 6;
      else intervalo = Math.round(intervalo * facilidade);
    }
    return formatarProximaRevisao(intervalo, qualidade);
  };

  // Cards filtrados para biblioteca
  const cardsBiblioteca = flashcards.filter(c => {
    if (filtroDisciplina && c.disciplina !== filtroDisciplina) return false;
    if (filtroStatus === 'novo' && c.status && c.status !== 'novo') return false;
    if (filtroStatus === 'aprendendo' && c.status !== 'aprendendo') return false;
    if (filtroStatus === 'dominado' && c.status !== 'dominado') return false;
    if (filtroStatus === 'revisar' && new Date(c.proximaRevisao || 0) > agora) return false;
    if (busca) {
      const b = busca.toLowerCase();
      if (!c.frente?.toLowerCase().includes(b) && !c.verso?.toLowerCase().includes(b)) return false;
    }
    return true;
  });

  const toggleFlipBib = (id) => {
    setCardsFlippedBib(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const cardAtual = cardsRevisao[indiceAtual];
  const progressoSessao = cardsRevisao.length > 0 ? ((indiceAtual) / cardsRevisao.length) * 100 : 0;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>🃏 Flashcards</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Sistema de <strong style={{ color: 'var(--accent-purple)' }}>Repetição Espaçada</strong> (método científico Anki/SuperMemo)
        </p>
      </div>

      {/* ESTATÍSTICAS PRINCIPAIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <Card style={{ 
          padding: '20px', 
          background: cardsParaRevisar.length > 0 
            ? 'linear-gradient(135deg, rgba(239,68,68,0.15), transparent)' 
            : 'linear-gradient(135deg, rgba(16,185,129,0.1), transparent)',
          borderColor: cardsParaRevisar.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
          animation: cardsParaRevisar.length > 0 ? 'pulse-glow 2s infinite' : 'none',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>
            {cardsParaRevisar.length > 0 ? '🔔' : '✅'}
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 900, 
            color: cardsParaRevisar.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
          }}>
            {cardsParaRevisar.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {cardsParaRevisar.length > 0 ? 'Para revisar hoje' : 'Tudo em dia!'}
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>🆕</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-blue)' }}>{cardsNovos}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Novos</div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>📚</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-orange)' }}>{cardsAprendendo}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aprendendo</div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>💪</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-green)' }}>{cardsDominados}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dominados</div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '4px' }}>🎴</div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-purple)' }}>{flashcards.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
        </Card>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setModo('revisar')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: `2px solid ${modo === 'revisar' ? 'var(--accent-red)' : 'var(--border-color)'}`,
            background: modo === 'revisar' ? 'rgba(239,68,68,0.12)' : 'transparent',
            color: modo === 'revisar' ? 'var(--accent-red)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🔔 Revisar Hoje
          {cardsParaRevisar.length > 0 && (
            <span style={{ 
              background: 'var(--accent-red)', 
              color: '#fff', 
              padding: '2px 8px', 
              borderRadius: '20px', 
              fontSize: '11px', 
              fontWeight: 700 
            }}>
              {cardsParaRevisar.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setModo('criar')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: `2px solid ${modo === 'criar' ? 'var(--accent-blue)' : 'var(--border-color)'}`,
            background: modo === 'criar' ? 'rgba(79,125,249,0.12)' : 'transparent',
            color: modo === 'criar' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          ✨ Criar Novos
        </button>
        <button
          onClick={() => setModo('biblioteca')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: `2px solid ${modo === 'biblioteca' ? 'var(--accent-purple)' : 'var(--border-color)'}`,
            background: modo === 'biblioteca' ? 'rgba(139,92,246,0.12)' : 'transparent',
            color: modo === 'biblioteca' ? 'var(--accent-purple)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          📚 Biblioteca
        </button>
      </div>

      {/* ========== MODO REVISAR ========== */}
      {modo === 'revisar' && (
        <div>
          {cardsRevisao.length === 0 && !sessaoFinalizada && (
            <Card style={{ padding: '48px', textAlign: 'center' }}>
              {cardsParaRevisar.length === 0 ? (
                <>
                  <div style={{ fontSize: '80px', marginBottom: '16px' }}>🎉</div>
                  <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '24px' }}>
                    Você está em dia!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                    Não há cards para revisar agora.<br />
                    O algoritmo cientificamente calculou que ainda não é hora de revisar.<br />
                    <strong>Volte amanhã ou crie novos flashcards!</strong>
                  </p>
                  <Button variant="primary" onClick={() => setModo('criar')} icon="✨">
                    Criar Novos Flashcards
                  </Button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '80px', marginBottom: '16px' }}>🔔</div>
                  <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '24px' }}>
                    {cardsParaRevisar.length} cards esperando por você!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                    A ciência mostra que <strong>revisar no momento certo</strong> é a chave para memorização de longo prazo.<br />
                    Vamos começar sua sessão de revisão?
                  </p>
                  <Button variant="primary" size="lg" onClick={iniciarRevisao} icon="🚀">
                    Iniciar Revisão ({cardsParaRevisar.length} cards)
                  </Button>
                </>
              )}
            </Card>
          )}

          {/* Sessão em andamento */}
          {cardsRevisao.length > 0 && !sessaoFinalizada && cardAtual && (
            <div>
              {/* Barra de progresso */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Card {indiceAtual + 1} de {cardsRevisao.length}
                  </span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
                    {Math.round(progressoSessao)}%
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${progressoSessao}%`,
                    height: '100%',
                    background: 'var(--gradient-1)',
                    borderRadius: '10px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Card */}
              <Card style={{
                padding: '48px 32px',
                minHeight: '320px',
                marginBottom: '20px',
                background: mostrouResposta
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08))'
                  : 'linear-gradient(135deg, rgba(79,125,249,0.08), rgba(139,92,246,0.08))',
                borderColor: mostrouResposta ? 'var(--accent-green)' : 'var(--accent-blue)',
                transition: 'all 0.4s ease',
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-muted)', 
                  textAlign: 'center',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontWeight: 700,
                }}>
                  {mostrouResposta ? '📗 RESPOSTA' : '📘 PERGUNTA'} 
                  • {cardAtual.disciplina} • {cardAtual.assunto}
                </div>

                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 600, 
                  lineHeight: '1.6',
                  textAlign: 'center',
                  minHeight: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 20px',
                }}>
                  {mostrouResposta ? cardAtual.verso : cardAtual.frente}
                </div>

                {mostrouResposta && cardAtual.dica && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '12px 18px', 
                    background: 'rgba(245,158,11,0.12)', 
                    borderRadius: '12px', 
                    fontSize: '14px', 
                    color: 'var(--accent-orange)',
                    textAlign: 'center',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}>
                    💡 <strong>Dica:</strong> {cardAtual.dica}
                  </div>
                )}
              </Card>

              {/* Botões de avaliação */}
              {!mostrouResposta ? (
                <Button
                  onClick={() => setMostrouResposta(true)}
                  size="lg"
                  variant="primary"
                  style={{ width: '100%' }}
                  icon="👁️"
                >
                  Mostrar Resposta
                </Button>
              ) : (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '16px', 
                    fontSize: '14px', 
                    color: 'var(--text-secondary)',
                  }}>
                    <strong>Como foi para você lembrar dessa resposta?</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <button
                      onClick={() => avaliarCard(0)}
                      style={{
                        padding: '16px 8px',
                        borderRadius: '12px',
                        border: '2px solid var(--accent-red)',
                        background: 'rgba(239,68,68,0.1)',
                        color: 'var(--accent-red)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '4px' }}>😰</div>
                      <div style={{ fontSize: '13px' }}>Errei</div>
                      <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>
                        {previewIntervalo(cardAtual, 0)}
                      </div>
                    </button>

                    <button
                      onClick={() => avaliarCard(3)}
                      style={{
                        padding: '16px 8px',
                        borderRadius: '12px',
                        border: '2px solid var(--accent-orange)',
                        background: 'rgba(245,158,11,0.1)',
                        color: 'var(--accent-orange)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '4px' }}>😐</div>
                      <div style={{ fontSize: '13px' }}>Difícil</div>
                      <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>
                        {previewIntervalo(cardAtual, 3)}
                      </div>
                    </button>

                    <button
                      onClick={() => avaliarCard(4)}
                      style={{
                        padding: '16px 8px',
                        borderRadius: '12px',
                        border: '2px solid var(--accent-blue)',
                        background: 'rgba(79,125,249,0.1)',
                        color: 'var(--accent-blue)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(79,125,249,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(79,125,249,0.1)'}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '4px' }}>🙂</div>
                      <div style={{ fontSize: '13px' }}>Bom</div>
                      <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>
                        {previewIntervalo(cardAtual, 4)}
                      </div>
                    </button>

                    <button
                      onClick={() => avaliarCard(5)}
                      style={{
                        padding: '16px 8px',
                        borderRadius: '12px',
                        border: '2px solid var(--accent-green)',
                        background: 'rgba(16,185,129,0.1)',
                        color: 'var(--accent-green)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '4px' }}>😎</div>
                      <div style={{ fontSize: '13px' }}>Fácil</div>
                      <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>
                        {previewIntervalo(cardAtual, 5)}
                      </div>
                    </button>
                  </div>
                  <div style={{ 
                    marginTop: '12px', 
                    fontSize: '11px', 
                    color: 'var(--text-muted)', 
                    textAlign: 'center',
                  }}>
                    💡 Seja HONESTO! Isso otimiza sua memorização de longo prazo
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sessão finalizada */}
          {sessaoFinalizada && (
            <Card style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '24px' }}>
                Sessão Concluída!
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Você revisou <strong style={{ color: 'var(--accent-blue)' }}>{cardsRevisao.length}</strong> cards!
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '12px', 
                maxWidth: '600px', 
                margin: '0 auto 24px',
              }}>
                <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '28px' }}>😰</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-red)' }}>{estatisticasSessao.errei}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Errei</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '28px' }}>😐</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-orange)' }}>{estatisticasSessao.dificil}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Difícil</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(79,125,249,0.08)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '28px' }}>🙂</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)' }}>{estatisticasSessao.bom}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bom</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '28px' }}>😎</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)' }}>{estatisticasSessao.facil}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fácil</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button variant="secondary" onClick={() => { setCardsRevisao([]); setSessaoFinalizada(false); }} icon="🏠">
                  Voltar
                </Button>
                {cardsParaRevisar.length > 0 && (
                  <Button variant="primary" onClick={iniciarRevisao} icon="🔄">
                    Revisar mais ({cardsParaRevisar.length})
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========== MODO CRIAR ========== */}
      {modo === 'criar' && (
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>✨ Gerar Novos Flashcards com IA</h3>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <select
              value={disciplina}
              onChange={e => { setDisciplina(e.target.value); setAssunto(''); }}
              style={{
                flex: 1, minWidth: '200px',
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
              }}
            >
              <option value="">Selecione a disciplina...</option>
              {disciplinas.map((d, i) => <option key={i} value={d.nome}>{d.nome}</option>)}
            </select>

            <select
              value={assunto}
              onChange={e => setAssunto(e.target.value)}
              style={{
                flex: 1, minWidth: '200px',
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
              }}
            >
              <option value="">Selecione o assunto...</option>
              {assuntosDisponiveis.map((a, i) => <option key={i} value={a}>{a}</option>)}
            </select>

            <input
              type="number"
              min="1"
              max="30"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              style={{
                width: '80px',
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '14px',
              }}
            />

            <Button onClick={handleGerar} loading={loading} disabled={loading} icon="🤖">
              {loading ? 'Gerando...' : 'Gerar'}
            </Button>
          </div>

          {error && (
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{
            marginTop: '20px',
            padding: '14px 18px',
            background: 'rgba(79,125,249,0.06)',
            border: '1px solid rgba(79,125,249,0.2)',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}>
            💡 <strong style={{ color: 'var(--accent-blue)' }}>Como funciona a Repetição Espaçada:</strong><br />
            • Cards NOVOS aparecem para revisar hoje mesmo<br />
            • Se você ERRAR → aparece amanhã<br />
            • Se marcar DIFÍCIL → aparece em ~1 dia<br />
            • Se marcar BOM → aparece em 6, 15, 30... dias<br />
            • Se marcar FÁCIL → intervalo cresce ainda mais<br />
            • Após dominar (21+ dias), some da lista de revisão!<br /><br />
            <strong>Resultado:</strong> Você estuda MENOS mas MEMORIZA MUITO MAIS!
          </div>
        </Card>
      )}

      {/* ========== MODO BIBLIOTECA ========== */}
      {modo === 'biblioteca' && (
        <div>
          {/* Filtros */}
          <Card style={{ padding: '16px', marginBottom: '16px' }}>
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="🔍 Buscar em flashcards..."
              style={{
                width: '100%',
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <select
                value={filtroDisciplina}
                onChange={e => setFiltroDisciplina(e.target.value)}
                style={{
                  background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
                }}
              >
                <option value="">📚 Todas disciplinas</option>
                {[...new Set(flashcards.map(f => f.disciplina))].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                style={{
                  background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
                }}
              >
                <option value="">🎯 Todos status</option>
                <option value="revisar">🔔 Para revisar hoje</option>
                <option value="novo">🆕 Novos</option>
                <option value="aprendendo">📚 Aprendendo</option>
                <option value="dominado">💪 Dominados</option>
              </select>
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Exibindo <strong style={{ color: 'var(--accent-blue)' }}>{cardsBiblioteca.length}</strong> de {flashcards.length} cards
            </div>
          </Card>

          {cardsBiblioteca.length === 0 ? (
            <Card style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
              <p style={{ color: 'var(--text-secondary)' }}>
                {flashcards.length === 0 
                  ? 'Nenhum flashcard criado. Vá em "Criar Novos"!'
                  : 'Nenhum card corresponde aos filtros.'}
              </p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {cardsBiblioteca.map(card => {
                const proximaData = new Date(card.proximaRevisao || 0);
                const diasFalta = Math.ceil((proximaData - agora) / (1000 * 60 * 60 * 24));
                const statusColor = card.status === 'dominado' ? 'var(--accent-green)' 
                  : card.status === 'aprendendo' ? 'var(--accent-orange)' 
                  : 'var(--accent-blue)';
                const statusIcon = card.status === 'dominado' ? '💪' 
                  : card.status === 'aprendendo' ? '📚' 
                  : '🆕';
                
                return (
                  <Card
                    key={card.id}
                    onClick={() => toggleFlipBib(card.id)}
                    glow
                    style={{ padding: '20px', cursor: 'pointer', minHeight: '200px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: statusColor, fontWeight: 700 }}>
                        {statusIcon} {card.status || 'novo'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm('Remover este card?')) removerFlashcard(card.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
                      >
                        🗑️
                      </button>
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {cardsFlippedBib[card.id] ? '📗 RESPOSTA' : '📘 PERGUNTA'} • {card.disciplina}
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 500, lineHeight: '1.6', marginBottom: '12px', minHeight: '60px' }}>
                      {cardsFlippedBib[card.id] ? card.verso : card.frente}
                    </div>

                    {cardsFlippedBib[card.id] && card.dica && (
                      <div style={{ padding: '8px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: '6px', fontSize: '11px', color: 'var(--accent-orange)', marginBottom: '10px' }}>
                        💡 {card.dica}
                      </div>
                    )}

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '10px', 
                      color: 'var(--text-muted)',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                    }}>
                      <span>🔁 Revisões: {card.totalRevisoes || 0}</span>
                      <span>
                        {diasFalta <= 0 ? '🔔 Hoje!' : `📅 ${diasFalta}d`}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}