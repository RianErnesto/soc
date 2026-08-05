import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';

export default function BuscaGlobal({ onNavigate, collapsed }) {
  const { data } = useData();
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState('');
  const [historico, setHistorico] = useState(() => {
    try {
      const salvo = localStorage.getItem('busca_historico');
      return salvo ? JSON.parse(salvo) : [];
    } catch { return []; }
  });
  const inputRef = useRef(null);

  // Atalho Ctrl+K (ou Cmd+K no Mac)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setAberto(true);
      }
      if (e.key === 'Escape' && aberto) {
        setAberto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto]);

  // Foca no input quando abre
  useEffect(() => {
    if (aberto && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [aberto]);

  // Salva histórico
  const salvarBusca = (t) => {
    if (!t.trim()) return;
    const novo = [t, ...historico.filter(h => h !== t)].slice(0, 5);
    setHistorico(novo);
    try {
      localStorage.setItem('busca_historico', JSON.stringify(novo));
    } catch {}
  };

  // Buscar em tudo
  const resultados = useMemo(() => {
    if (!termo || termo.length < 2) return null;
    const t = termo.toLowerCase();

    // Flashcards
    const flashcards = (data.flashcards || [])
      .filter(f => 
        f.frente?.toLowerCase().includes(t) ||
        f.verso?.toLowerCase().includes(t) ||
        f.assunto?.toLowerCase().includes(t) ||
        f.disciplina?.toLowerCase().includes(t)
      )
      .slice(0, 10)
      .map(f => ({
        id: f.id,
        tipo: 'flashcard',
        icone: '🃏',
        titulo: f.frente,
        subtitulo: `${f.disciplina} • ${f.assunto}`,
        detalhe: f.verso?.substring(0, 100) + '...',
        modulo: 'flashcards',
        cor: 'var(--accent-purple)',
      }));

    // Resumos
    const resumos = (data.resumos || [])
      .filter(r => 
        r.assunto?.toLowerCase().includes(t) ||
        r.disciplina?.toLowerCase().includes(t) ||
        r.conteudo?.toLowerCase().includes(t)
      )
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        tipo: 'resumo',
        icone: '📝',
        titulo: r.assunto,
        subtitulo: `${r.disciplina} • Nível: ${r.nivel}`,
        detalhe: r.conteudo?.substring(0, 100) + '...',
        modulo: 'resumos',
        cor: 'var(--accent-green)',
      }));

    // Caderno de Erros
    const cadernoErros = (data.cadernoErros || [])
      .filter(e => 
        e.enunciado?.toLowerCase().includes(t) ||
        e.assunto?.toLowerCase().includes(t) ||
        e.disciplina?.toLowerCase().includes(t) ||
        e.anotacao?.toLowerCase().includes(t) ||
        (e.tags || []).some(tag => tag.toLowerCase().includes(t))
      )
      .slice(0, 10)
      .map(e => ({
        id: e.id,
        tipo: 'erro',
        icone: '📓',
        titulo: e.enunciado?.substring(0, 80) + '...',
        subtitulo: `${e.disciplina} • ${e.assunto} • ${e.banca}`,
        detalhe: `Errou ${e.vezesErrou}x • ${e.dominado ? '💪 Dominado' : '❌ Pendente'}`,
        modulo: 'caderno',
        cor: 'var(--accent-red)',
      }));

    // Editais (cargos, disciplinas, assuntos)
    const editais = [];
    (data.editais || []).forEach(edital => {
      if (edital.nome?.toLowerCase().includes(t) || edital.banca?.toLowerCase().includes(t)) {
        editais.push({
          id: edital.id,
          tipo: 'edital',
          icone: '📋',
          titulo: edital.nome,
          subtitulo: `Banca: ${edital.banca} • ${edital.cargos?.length} cargo(s)`,
          detalhe: 'Edital importado',
          modulo: 'editais',
          cor: 'var(--accent-blue)',
        });
      }
      (edital.cargos || []).forEach(cargo => {
        if (cargo.nome?.toLowerCase().includes(t)) {
          editais.push({
            id: `${edital.id}_${cargo.nome}`,
            tipo: 'cargo',
            icone: '👤',
            titulo: cargo.nome,
            subtitulo: `${edital.nome} • Nível: ${cargo.nivel}`,
            detalhe: `${cargo.disciplinas?.length} disciplinas`,
            modulo: 'editais',
            cor: 'var(--accent-blue)',
          });
        }
        (cargo.disciplinas || []).forEach(disc => {
          if (disc.nome?.toLowerCase().includes(t)) {
            editais.push({
              id: `${edital.id}_${cargo.nome}_${disc.nome}`,
              tipo: 'disciplina',
              icone: '📚',
              titulo: disc.nome,
              subtitulo: `${cargo.nome} • ${edital.nome}`,
              detalhe: `${disc.assuntos?.length} assuntos`,
              modulo: 'editais',
              cor: 'var(--accent-blue)',
            });
          }
          (disc.assuntos || []).forEach(assunto => {
            if (assunto.toLowerCase().includes(t)) {
              editais.push({
                id: `${edital.id}_${cargo.nome}_${disc.nome}_${assunto}`,
                tipo: 'assunto',
                icone: '🎯',
                titulo: assunto,
                subtitulo: `${disc.nome} • ${cargo.nome}`,
                detalhe: edital.nome,
                modulo: 'editais',
                cor: 'var(--accent-blue)',
              });
            }
          });
        });
      });
    });

    // Simulados
    const simulados = (data.simulados || [])
      .filter(s => 
        s.banca?.toLowerCase().includes(t) ||
        (s.disciplinas || []).some(d => d.toLowerCase().includes(t))
      )
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        tipo: 'simulado',
        icone: '🔥',
        titulo: `Simulado ${s.banca}`,
        subtitulo: `${s.quantidade} questões • Nota: ${s.nota}%`,
        detalhe: `${new Date(s.data).toLocaleDateString('pt-BR')} • ${s.disciplinas?.length} disciplinas`,
        modulo: 'simulado',
        cor: 'var(--accent-orange)',
      }));

    const total = flashcards.length + resumos.length + cadernoErros.length + editais.length + simulados.length;

    return { flashcards, resumos, cadernoErros, editais: editais.slice(0, 15), simulados, total };
  }, [termo, data]);

  const handleClick = (resultado) => {
    salvarBusca(termo);
    if (onNavigate) onNavigate(resultado.modulo);
    setAberto(false);
    setTermo('');
  };

  const usarBuscaRecente = (t) => {
    setTermo(t);
  };

  // Destaca o termo buscado no texto
  const destacar = (texto, termo) => {
    if (!texto || !termo) return texto;
    const partes = texto.split(new RegExp(`(${termo})`, 'gi'));
    return partes.map((p, i) => 
      p.toLowerCase() === termo.toLowerCase() 
        ? <mark key={i} style={{ background: 'rgba(245,158,11,0.3)', color: 'var(--accent-orange)', padding: '0 2px', borderRadius: '3px' }}>{p}</mark>
        : p
    );
  };

  return (
    <>
      {/* Gatilho da busca — vive dentro da Sidebar, não mais flutuante */}
      {collapsed ? (
        <button
          onClick={() => setAberto(true)}
          title="Buscar (Ctrl+K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
            e.currentTarget.style.color = 'var(--accent-blue)';
            e.currentTarget.style.background = 'rgba(79, 125, 249, 0.06)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          🔍
        </button>
      ) : (
        <button
          onClick={() => setAberto(true)}
          title="Buscar em tudo (Ctrl+K)"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
            e.currentTarget.style.color = 'var(--accent-blue)';
            e.currentTarget.style.background = 'rgba(79, 125, 249, 0.06)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          <span style={{ fontSize: '14px' }}>🔍</span>
          <span style={{ flex: 1, textAlign: 'left' }}>Buscar...</span>
          <span style={{
            padding: '1px 6px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '4px',
            fontSize: '10px',
            border: '1px solid var(--border-color)',
          }}>
            Ctrl+K
          </span>
        </button>
      )}

      {/* Modal de busca */}
      {aberto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 9999,
            paddingTop: '10vh',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setAberto(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              animation: 'slideInUp 0.3s ease',
            }}
          >
            {/* Input de busca */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '22px' }}>🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={termo}
                onChange={e => setTermo(e.target.value)}
                placeholder="Buscar em flashcards, resumos, erros, editais, simulados..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '17px',
                  fontWeight: 500,
                }}
              />
              <button
                onClick={() => setAberto(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                ESC
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {/* Sem termo ou muito curto */}
              {(!termo || termo.length < 2) && (
                <div>
                  {historico.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-muted)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '1px', 
                        fontWeight: 700,
                        marginBottom: '10px',
                      }}>
                        🕐 Buscas recentes
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {historico.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => usarBuscaRecente(h)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: '1px solid var(--border-color)',
                              background: 'rgba(255,255,255,0.03)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontSize: '12px',
                            }}
                          >
                            🕐 {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                    <div style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Comece a digitar para buscar...
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                      Busca em: 🃏 Flashcards • 📝 Resumos • 📓 Caderno de Erros<br />
                      📋 Editais (cargos, disciplinas, assuntos) • 🔥 Simulados
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados */}
              {termo && termo.length >= 2 && resultados && (
                <div>
                  {resultados.total === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤷</div>
                      <div style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                        Nenhum resultado para "<strong>{termo}</strong>"
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '8px' }}>
                        Tente outras palavras ou verifique se você já criou conteúdo sobre esse tema
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-muted)', 
                        marginBottom: '16px',
                      }}>
                        {resultados.total} resultado{resultados.total !== 1 ? 's' : ''} encontrado{resultados.total !== 1 ? 's' : ''}
                      </div>

                      {/* Grupos de resultados */}
                      {[
                        { titulo: '🃏 Flashcards', items: resultados.flashcards, cor: 'var(--accent-purple)' },
                        { titulo: '📝 Resumos', items: resultados.resumos, cor: 'var(--accent-green)' },
                        { titulo: '📓 Caderno de Erros', items: resultados.cadernoErros, cor: 'var(--accent-red)' },
                        { titulo: '📋 Editais e Conteúdos', items: resultados.editais, cor: 'var(--accent-blue)' },
                        { titulo: '🔥 Simulados', items: resultados.simulados, cor: 'var(--accent-orange)' },
                      ].map(grupo => grupo.items.length > 0 && (
                        <div key={grupo.titulo} style={{ marginBottom: '20px' }}>
                          <div style={{ 
                            fontSize: '11px', 
                            color: grupo.cor, 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px', 
                            fontWeight: 700,
                            marginBottom: '10px',
                            padding: '4px 10px',
                            background: `${grupo.cor}15`,
                            borderRadius: '6px',
                            display: 'inline-block',
                          }}>
                            {grupo.titulo} ({grupo.items.length})
                          </div>
                          <div style={{ display: 'grid', gap: '6px' }}>
                            {grupo.items.map(r => (
                              <button
                                key={r.id}
                                onClick={() => handleClick(r)}
                                style={{
                                  padding: '12px 14px',
                                  background: 'rgba(255,255,255,0.02)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  gap: '12px',
                                  alignItems: 'flex-start',
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = 'rgba(79,125,249,0.08)';
                                  e.currentTarget.style.borderColor = 'var(--accent-blue)';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                  e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                              >
                                <div style={{ fontSize: '24px', flexShrink: 0 }}>{r.icone}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 600, 
                                    color: 'var(--text-primary)',
                                    marginBottom: '2px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}>
                                    {destacar(r.titulo, termo)}
                                  </div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: 'var(--text-muted)',
                                    marginBottom: '2px',
                                  }}>
                                    {r.subtitulo}
                                  </div>
                                  {r.detalhe && (
                                    <div style={{ 
                                      fontSize: '11px', 
                                      color: 'var(--text-muted)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}>
                                      {destacar(r.detalhe, termo)}
                                    </div>
                                  )}
                                </div>
                                <div style={{ 
                                  fontSize: '11px', 
                                  color: 'var(--text-muted)',
                                  flexShrink: 0,
                                  alignSelf: 'center',
                                }}>
                                  →
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 20px',
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              <span>
                💡 Dica: Use <strong style={{ color: 'var(--accent-blue)' }}>Ctrl+K</strong> em qualquer lugar do sistema
              </span>
              <span>Enter para abrir • Esc para fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}