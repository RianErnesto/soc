import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { chatProfessor } from '../utils/geminiApi';

const SUGESTOES_INICIAIS = [
  { icone: '💡', texto: 'Explique o conceito de...', categoria: 'explicacao' },
  { icone: '📝', texto: 'Crie 3 questões sobre...', categoria: 'exercicio' },
  { icone: '🎯', texto: 'Qual a pegadinha da banca em...', categoria: 'macete' },
  { icone: '📚', texto: 'Faça um resumo rápido de...', categoria: 'resumo' },
  { icone: '🧠', texto: 'Como memorizar...', categoria: 'memoria' },
  { icone: '⚖️', texto: 'Qual a diferença entre... e ...', categoria: 'comparacao' },
  { icone: '💼', texto: 'Como isso cai em prova?', categoria: 'prova' },
  { icone: '🎓', texto: 'Me dê um exemplo prático de...', categoria: 'exemplo' },
];

export default function ChatProfessor() {
  const { data, getAllDisciplinas, criarConversa, adicionarMensagem, removerConversa, marcarMensagem } = useData();
  
  const [conversaAtivaId, setConversaAtivaId] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [disciplinaFocus, setDisciplinaFocus] = useState('');
  const [assuntoFocus, setAssuntoFocus] = useState('');
  const [nivelDetalhamento, setNivelDetalhamento] = useState('médio');
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(true);
  const [copiadaMsg, setCopiadaMsg] = useState(null);

  const mensagensRef = useRef(null);
  const inputRef = useRef(null);
  const disciplinas = getAllDisciplinas();
  const apiKey = data.configuracoes.apiKey;
  const conversas = data.conversas || [];
  const conversaAtiva = conversas.find(c => c.id === conversaAtivaId);
  const assuntosDisponiveis = disciplinas.find(d => d.nome === disciplinaFocus)?.assuntos || [];

  const banca = data.editais?.[0]?.banca || 'CESPE/CEBRASPE';

  // Scroll automático pra última mensagem
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [conversaAtiva?.mensagens, enviando]);

  // Foca no input quando abre conversa
  useEffect(() => {
    if (conversaAtivaId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversaAtivaId]);

  const iniciarConversa = () => {
    const titulo = disciplinaFocus 
      ? `${disciplinaFocus}${assuntoFocus ? ` - ${assuntoFocus}` : ''}` 
      : 'Nova Conversa';
    const id = criarConversa(titulo, disciplinaFocus, assuntoFocus);
    setConversaAtivaId(id);
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    if (!apiKey) {
      setError('Configure sua chave API do Gemini em Configurações!');
      return;
    }

    let idAtivo = conversaAtivaId;

    // Se não tem conversa ativa, cria uma
    if (!idAtivo) {
      const titulo = novaMensagem.substring(0, 50) + (novaMensagem.length > 50 ? '...' : '');
      idAtivo = criarConversa(titulo, disciplinaFocus, assuntoFocus);
      setConversaAtivaId(idAtivo);
    }

    // Adiciona mensagem do usuário
    const msgUsuario = { autor: 'usuario', texto: novaMensagem };
    adicionarMensagem(idAtivo, msgUsuario);

    // Limpa o input
    setNovaMensagem('');
    setError('');
    setEnviando(true);

    try {
      // Prepara histórico
      const conversa = data.conversas.find(c => c.id === idAtivo);
      const mensagensHistorico = [
        ...(conversa?.mensagens || []),
        msgUsuario,
      ];

      // Constrói contexto do edital
      const contextoEdital = disciplinas.length > 0
        ? `Disciplinas do edital: ${disciplinas.slice(0, 5).map(d => d.nome).join(', ')}`
        : '';

      const resposta = await chatProfessor({
        mensagens: mensagensHistorico,
        disciplina: disciplinaFocus,
        assunto: assuntoFocus,
        banca,
        contextoEdital,
        nivelDetalhamento,
      }, apiKey);

      adicionarMensagem(idAtivo, { autor: 'professor', texto: resposta });
    } catch (err) {
      setError(`Erro: ${err.message}`);
      adicionarMensagem(idAtivo, { 
        autor: 'professor', 
        texto: `❌ Ops! Tive um problema ao responder: ${err.message}. Tenta enviar de novo?`,
        erro: true,
      });
    } finally {
      setEnviando(false);
    }
  };

  const usarSugestao = (sugestao) => {
    setNovaMensagem(sugestao.texto);
    inputRef.current?.focus();
  };

  const copiarMensagem = (texto, id) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadaMsg(id);
      setTimeout(() => setCopiadaMsg(null), 2000);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const excluirConversa = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Excluir esta conversa? Não poderá recuperar.')) {
      removerConversa(id);
      if (conversaAtivaId === id) setConversaAtivaId(null);
    }
  };

  // Renderiza markdown das respostas
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((linha, i) => {
      if (linha.startsWith('### ')) {
        return <h4 key={i} style={{ fontSize: '15px', fontWeight: 700, marginTop: '12px', marginBottom: '6px', color: 'var(--accent-purple)' }}>{linha.replace('### ', '')}</h4>;
      }
      if (linha.startsWith('## ')) {
        return <h3 key={i} style={{ fontSize: '16px', fontWeight: 700, marginTop: '14px', marginBottom: '8px', color: 'var(--accent-blue)' }}>{linha.replace('## ', '')}</h3>;
      }
      if (linha.startsWith('# ')) {
        return <h2 key={i} style={{ fontSize: '18px', fontWeight: 800, marginTop: '16px', marginBottom: '10px' }}>{linha.replace('# ', '')}</h2>;
      }
      if (linha.match(/^\s*-\s/)) {
        return <li key={i} style={{ marginLeft: '20px', marginBottom: '4px', lineHeight: '1.6' }}>{renderBold(linha.replace(/^\s*-\s/, ''))}</li>;
      }
      if (linha.match(/^\d+\.\s/)) {
        return <li key={i} style={{ marginLeft: '20px', marginBottom: '4px', lineHeight: '1.6', listStyleType: 'decimal' }}>{renderBold(linha.replace(/^\d+\.\s/, ''))}</li>;
      }
      if (linha.trim() === '') {
        return <div key={i} style={{ height: '6px' }} />;
      }
      return <p key={i} style={{ marginBottom: '6px', lineHeight: '1.6' }}>{renderBold(linha)}</p>;
    });
  };

  const renderBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--accent-orange)' }}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>
            💬 Tira-Dúvidas com Professor IA
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Seu professor particular 24h por dia, especialista na sua matéria
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => setMostrarSidebar(!mostrarSidebar)} icon={mostrarSidebar ? '◀' : '▶'}>
            {mostrarSidebar ? 'Ocultar' : 'Mostrar'} conversas
          </Button>
          <Button variant="primary" size="sm" onClick={iniciarConversa} icon="✨">
            Nova Conversa
          </Button>
        </div>
      </div>

      {/* Layout Principal */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: mostrarSidebar ? '280px 1fr' : '1fr', 
        gap: '16px', 
        flex: 1, 
        overflow: 'hidden',
        transition: 'grid-template-columns 0.3s',
      }}>
        {/* SIDEBAR - Lista de Conversas */}
        {mostrarSidebar && (
          <Card style={{ padding: '16px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              💬 Conversas ({conversas.length})
            </h3>
            
            {conversas.length === 0 ? (
              <div style={{ 
                padding: '20px 12px', 
                textAlign: 'center', 
                color: 'var(--text-muted)', 
                fontSize: '13px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💭</div>
                Nenhuma conversa ainda. Comece uma nova!
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '6px' }}>
                {[...conversas].reverse().map(c => (
                  <button
                    key={c.id}
                    onClick={() => setConversaAtivaId(c.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `1px solid ${conversaAtivaId === c.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      background: conversaAtivaId === c.id ? 'rgba(79,125,249,0.12)' : 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                    onMouseOver={e => {
                      if (conversaAtivaId !== c.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }
                    }}
                    onMouseOut={e => {
                      if (conversaAtivaId !== c.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', paddingRight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.titulo}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span>💬 {c.mensagens?.length || 0}</span>
                      <span>•</span>
                      <span>{new Date(c.atualizadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    <button
                      onClick={(e) => excluirConversa(c.id, e)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px',
                        opacity: 0.5,
                      }}
                      onMouseOver={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--accent-red)'; }}
                      onMouseOut={e => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      title="Excluir conversa"
                    >
                      ✕
                    </button>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ÁREA DE CHAT */}
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Header da conversa + Config */}
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--gradient-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}>
                  🎓
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>
                    {conversaAtiva ? conversaAtiva.titulo : 'Professor IA'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
                    Online • Pronto para ajudar
                  </div>
                </div>
              </div>
              <Button 
                variant={mostrarConfig ? 'primary' : 'ghost'} 
                size="sm" 
                onClick={() => setMostrarConfig(!mostrarConfig)}
                icon="⚙️"
              >
                Focar
              </Button>
            </div>

            {/* Painel de foco */}
            {mostrarConfig && (
              <div style={{ 
                marginTop: '12px', 
                padding: '14px', 
                background: 'rgba(79,125,249,0.06)', 
                borderRadius: '10px',
                border: '1px solid rgba(79,125,249,0.2)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  🎯 Focar conversa em:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  <select
                    value={disciplinaFocus}
                    onChange={e => { setDisciplinaFocus(e.target.value); setAssuntoFocus(''); }}
                    style={{
                      background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
                    }}
                  >
                    <option value="">📚 Qualquer disciplina</option>
                    {disciplinas.map((d, i) => <option key={i} value={d.nome}>{d.nome}</option>)}
                  </select>
                  <select
                    value={assuntoFocus}
                    onChange={e => setAssuntoFocus(e.target.value)}
                    disabled={!disciplinaFocus}
                    style={{
                      background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
                      opacity: disciplinaFocus ? 1 : 0.5,
                    }}
                  >
                    <option value="">🎯 Qualquer assunto</option>
                    {assuntosDisponiveis.map((a, i) => <option key={i} value={a}>{a}</option>)}
                  </select>
                  <select
                    value={nivelDetalhamento}
                    onChange={e => setNivelDetalhamento(e.target.value)}
                    style={{
                      background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
                    }}
                  >
                    <option value="simples">😊 Explicação Simples</option>
                    <option value="médio">📖 Nível Médio</option>
                    <option value="aprofundado">🔬 Aprofundado</option>
                  </select>
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  💡 Focar em uma disciplina/assunto faz o professor ser mais preciso e detalhado
                </div>
              </div>
            )}
          </div>

          {/* MENSAGENS */}
          <div 
            ref={mensagensRef}
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Tela de boas-vindas */}
            {(!conversaAtiva || conversaAtiva.mensagens.length === 0) && (
              <div style={{ 
                textAlign: 'center', 
                padding: '30px 20px',
                margin: 'auto',
                maxWidth: '600px',
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>👋</div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
                  Olá! Sou seu Professor IA
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
                  Estou aqui pra te ajudar com QUALQUER dúvida sobre seus estudos. 
                  {disciplinaFocus && <><br />Vamos focar em <strong style={{ color: 'var(--accent-blue)' }}>{disciplinaFocus}</strong>{assuntoFocus && <> ({assuntoFocus})</>}!</>}
                </p>
                
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  💡 Sugestões para começar:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  {SUGESTOES_INICIAIS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => usarSugestao(s)}
                      style={{
                        padding: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = 'var(--accent-blue)';
                        e.currentTarget.style.background = 'rgba(79,125,249,0.06)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{s.icone}</span>
                      <span>{s.texto}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagens da conversa */}
            {conversaAtiva && conversaAtiva.mensagens.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.autor === 'usuario' ? 'flex-end' : 'flex-start',
                  animation: 'slideInUp 0.3s ease',
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  display: 'flex',
                  gap: '10px',
                  flexDirection: msg.autor === 'usuario' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: msg.autor === 'usuario' ? 'var(--gradient-2)' : 'var(--gradient-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>
                    {msg.autor === 'usuario' ? '👤' : '🎓'}
                  </div>

                  {/* Bolha de mensagem */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: msg.autor === 'usuario' 
                      ? '16px 16px 4px 16px' 
                      : '16px 16px 16px 4px',
                    background: msg.autor === 'usuario' 
                      ? 'var(--gradient-1)' 
                      : msg.erro ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)',
                    color: msg.autor === 'usuario' ? '#fff' : 'var(--text-primary)',
                    border: msg.autor === 'professor' ? `1px solid ${msg.erro ? 'var(--accent-red)' : 'var(--border-color)'}` : 'none',
                    position: 'relative',
                    fontSize: '14px',
                    lineHeight: '1.6',
                  }}>
                    {msg.autor === 'usuario' ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.texto}</div>
                    ) : (
                      <div>{renderMarkdown(msg.texto)}</div>
                    )}

                    {/* Actions da mensagem */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      justifyContent: 'flex-end', 
                      marginTop: '8px',
                      opacity: 0.6,
                    }}>
                      <button
                        onClick={() => copiarMensagem(msg.texto, msg.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: msg.autor === 'usuario' ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '2px 4px',
                          borderRadius: '4px',
                        }}
                        title="Copiar mensagem"
                      >
                        {copiadaMsg === msg.id ? '✓ Copiado!' : '📋'}
                      </button>
                      {msg.autor === 'professor' && (
                        <button
                          onClick={() => marcarMensagem(conversaAtivaId, msg.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: msg.marcada ? 'var(--accent-orange)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px',
                            borderRadius: '4px',
                          }}
                          title={msg.marcada ? 'Desmarcar' : 'Marcar como importante'}
                        >
                          {msg.marcada ? '⭐' : '☆'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Indicador digitando */}
            {enviando && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--gradient-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}>
                  🎓
                </div>
                <div style={{
                  padding: '14px 20px',
                  background: 'var(--bg-card)',
                  borderRadius: '16px 16px 16px 4px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse-glow 1s infinite' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse-glow 1s infinite 0.2s' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)', animation: 'pulse-glow 1s infinite 0.4s' }}></span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Professor está pensando...</span>
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(0,0,0,0.15)',
          }}>
            {error && (
              <div style={{
                padding: '8px 12px',
                marginBottom: '10px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                color: 'var(--accent-red)',
                fontSize: '12px',
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={novaMensagem}
                onChange={e => setNovaMensagem(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disciplinaFocus 
                  ? `Pergunte sobre ${disciplinaFocus}${assuntoFocus ? ` - ${assuntoFocus}` : ''}...` 
                  : "Digite sua dúvida... (Shift+Enter para nova linha)"}
                disabled={enviando}
                rows={2}
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
              <button
                onClick={enviarMensagem}
                disabled={!novaMensagem.trim() || enviando}
                style={{
                  padding: '12px 20px',
                  background: (!novaMensagem.trim() || enviando) ? 'rgba(255,255,255,0.05)' : 'var(--gradient-1)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: (!novaMensagem.trim() || enviando) ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                  opacity: (!novaMensagem.trim() || enviando) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  height: 'fit-content',
                }}
              >
                {enviando ? '⏳' : '📤'} Enviar
              </button>
            </div>
            <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right' }}>
              💡 Enter para enviar • Shift+Enter para nova linha
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}