import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { gerarQuestoes } from '../utils/geminiApi';

// 🎯 Lista das principais bancas de concurso
const BANCAS = [
  { valor: 'CESPE/CEBRASPE', label: 'CESPE / CEBRASPE', estilo: 'certo/errado, textos longos e pegadinhas' },
  { valor: 'FCC', label: 'FCC (Fundação Carlos Chagas)', estilo: 'objetiva, técnica, letra de lei' },
  { valor: 'Cesgranrio', label: 'Cesgranrio', estilo: 'contextualizada, casos práticos, bancos' },
  { valor: 'FGV', label: 'FGV (Fundação Getulio Vargas)', estilo: 'textos analíticos, raciocínio' },
  { valor: 'VUNESP', label: 'VUNESP', estilo: 'clara, direta, sem pegadinhas exageradas' },
  { valor: 'IBFC', label: 'IBFC', estilo: 'variada, com questões conceituais' },
  { valor: 'Quadrix', label: 'Quadrix', estilo: 'similar CESPE, certo/errado e múltipla escolha' },
  { valor: 'Instituto Consulplan', label: 'Instituto Consulplan', estilo: 'objetiva, contextualizada' },
  { valor: 'Instituto Consulpam', label: 'Instituto Consulpam', estilo: 'objetiva, foca em legislação' },
  { valor: 'IADES', label: 'IADES', estilo: 'analítica, textos médios' },
  { valor: 'AOCP', label: 'AOCP', estilo: 'objetiva e conceitual' },
  { valor: 'IDIB', label: 'IDIB', estilo: 'clara e direta' },
  { valor: 'IBADE', label: 'IBADE', estilo: 'contextualizada' },
  { valor: 'CETAP', label: 'CETAP', estilo: 'regional, direta' },
  { valor: 'IVIN', label: 'IVIN', estilo: 'objetiva' },
  { valor: 'INSTITUTO AOCP', label: 'Instituto AOCP', estilo: 'conceitual' },
  { valor: 'FUNDATEC', label: 'FUNDATEC', estilo: 'objetiva' },
  { valor: 'IBAM', label: 'IBAM', estilo: 'municipal, direta' },
  { valor: 'OUTRA', label: '🎯 Outra banca (digitar nome)', estilo: '' },
];

export default function Questoes() {
  const { data, getAllDisciplinas, registrarResposta } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [reveladas, setReveladas] = useState({});
  const [filtroEdital, setFiltroEdital] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroAssuntos, setFiltroAssuntos] = useState([]);
  const [quantidade, setQuantidade] = useState(5);
  const [dificuldade, setDificuldade] = useState('média');
  const [bancaSelecionada, setBancaSelecionada] = useState('CESPE/CEBRASPE');
  const [bancaPersonalizada, setBancaPersonalizada] = useState('');

  const disciplinas = getAllDisciplinas();
  const apiKey = data.configuracoes.apiKey;

  const disciplinaAtual = disciplinas.find(d => d.nome === filtroDisciplina);
  const assuntosDisponiveis = disciplinaAtual?.assuntos || [];

  // Banca a ser usada (personalizada ou selecionada)
  const bancaFinal = bancaSelecionada === 'OUTRA' 
    ? (bancaPersonalizada.trim() || 'CESPE/CEBRASPE')
    : bancaSelecionada;

  const toggleAssunto = (assunto) => {
    setFiltroAssuntos(prev =>
      prev.includes(assunto) ? prev.filter(a => a !== assunto) : [...prev, assunto]
    );
  };

  const handleGerarQuestoes = async () => {
    if (!filtroDisciplina) { setError('Selecione uma disciplina!'); return; }
    if (!apiKey) { setError('Configure sua chave API do Gemini!'); return; }
    if (bancaSelecionada === 'OUTRA' && !bancaPersonalizada.trim()) {
      setError('Digite o nome da banca personalizada!');
      return;
    }

    setLoading(true);
    setError('');
    setQuestoes([]);
    setRespostas({});
    setReveladas({});

    try {
      const novasQuestoes = await gerarQuestoes({
        disciplina: filtroDisciplina,
        assuntos: filtroAssuntos.length > 0 ? filtroAssuntos : assuntosDisponiveis,
        quantidade,
        banca: bancaFinal,
        dificuldade,
      }, apiKey);

      setQuestoes(novasQuestoes.map((q, i) => ({ ...q, id: Date.now() + i })));
    } catch (err) {
      setError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selecionarResposta = (questaoIndex, letra) => {
    if (reveladas[questaoIndex]) return;
    setRespostas(prev => ({ ...prev, [questaoIndex]: letra }));
  };

  const revelarGabarito = (questaoIndex) => {
    const questao = questoes[questaoIndex];
    const respostaUsuario = respostas[questaoIndex];
    if (!respostaUsuario) return;

    const correta = respostaUsuario === questao.respostaCorreta;
    setReveladas(prev => ({ ...prev, [questaoIndex]: true }));

    registrarResposta(questao, respostaUsuario, correta);
  };

  const acertosAtuais = Object.keys(reveladas).filter(i =>
    respostas[i] === questoes[i]?.respostaCorreta
  ).length;
  const totalRespondidas = Object.keys(reveladas).length;

  const bancaInfo = BANCAS.find(b => b.valor === bancaSelecionada);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>❓ Gerador de Questões com IA</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Questões no estilo da banca do seu concurso</p>
      </div>

      <Card style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>🔍 Configurar Questões</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {/* EDITAL */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
              📋 Edital (opcional)
            </label>
            <select
              value={filtroEdital}
              onChange={e => setFiltroEdital(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              <option value="">Todos os editais</option>
              {data.editais.map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </div>

          {/* DISCIPLINA */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
              📚 Disciplina *
            </label>
            <select
              value={filtroDisciplina}
              onChange={e => { setFiltroDisciplina(e.target.value); setFiltroAssuntos([]); }}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              <option value="">Selecione...</option>
              {disciplinas.map((d, i) => (
                <option key={i} value={d.nome}>{d.nome} ({d.assuntos.length} assuntos)</option>
              ))}
            </select>
          </div>

          {/* BANCA - NOVO CAMPO */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
              🏛️ Banca Examinadora *
            </label>
            <select
              value={bancaSelecionada}
              onChange={e => setBancaSelecionada(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--accent-purple)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              {BANCAS.map(b => (
                <option key={b.valor} value={b.valor}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* DIFICULDADE */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
              ⚡ Dificuldade
            </label>
            <select
              value={dificuldade}
              onChange={e => setDificuldade(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              <option value="fácil">Fácil</option>
              <option value="média">Média</option>
              <option value="difícil">Difícil</option>
              <option value="muito difícil">🔥 Muito difícil</option>
            </select>
          </div>
        </div>

        {/* Campo para banca personalizada (só aparece se selecionar "OUTRA") */}
        {bancaSelecionada === 'OUTRA' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--accent-purple)' }}>
              ✏️ Digite o nome da banca:
            </label>
            <input
              type="text"
              value={bancaPersonalizada}
              onChange={e => setBancaPersonalizada(e.target.value)}
              placeholder="Ex: FUMARC, FEPESE, Instituto Access..."
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--accent-purple)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            />
          </div>
        )}

        {/* Info sobre a banca selecionada */}
        {bancaInfo && bancaInfo.estilo && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 14px',
            background: 'rgba(139,92,246,0.06)',
            borderRadius: '8px',
            border: '1px solid rgba(139,92,246,0.15)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}>
            💡 <strong style={{ color: 'var(--accent-purple)' }}>Estilo {bancaInfo.label}:</strong> {bancaInfo.estilo}
          </div>
        )}

        {/* ASSUNTOS */}
        {assuntosDisponiveis.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', display: 'block', color: 'var(--text-secondary)' }}>
              🎯 Assuntos (selecione específicos ou deixe vazio para todos):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {assuntosDisponiveis.map((a, i) => (
                <button
                  key={i}
                  onClick={() => toggleAssunto(a)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    border: `1px solid ${filtroAssuntos.includes(a) ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    background: filtroAssuntos.includes(a) ? 'rgba(79,125,249,0.15)' : 'transparent',
                    color: filtroAssuntos.includes(a) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
              🔢 Quantidade
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={quantidade}
              onChange={e => setQuantidade(Number(e.target.value))}
              style={{
                width: '80px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
          </div>
          <Button onClick={handleGerarQuestoes} loading={loading} disabled={loading || !filtroDisciplina} icon="🤖" size="lg">
            {loading ? 'Gerando...' : `Gerar Questões (estilo ${bancaFinal})`}
          </Button>
        </div>

        {error && (
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}
      </Card>

      {questoes.length > 0 && (
        <Card style={{ padding: '16px 24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', flexWrap: 'wrap' }}>
              <span>📊 <strong>{totalRespondidas}</strong>/{questoes.length} respondidas</span>
              <span style={{ color: 'var(--accent-green)' }}>✅ <strong>{acertosAtuais}</strong> acertos</span>
              <span style={{ color: 'var(--accent-red)' }}>❌ <strong>{totalRespondidas - acertosAtuais}</strong> erros</span>
              <span style={{ color: 'var(--accent-purple)' }}>🏛️ <strong>{bancaFinal}</strong></span>
            </div>
            <div style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: 700,
              fontSize: '14px',
              background: totalRespondidas > 0
                ? (acertosAtuais / totalRespondidas) >= 0.7
                  ? 'rgba(16,185,129,0.15)'
                  : 'rgba(239,68,68,0.15)'
                : 'rgba(255,255,255,0.05)',
              color: totalRespondidas > 0
                ? (acertosAtuais / totalRespondidas) >= 0.7
                  ? 'var(--accent-green)'
                  : 'var(--accent-red)'
                : 'var(--text-muted)',
            }}>
              {totalRespondidas > 0 ? `${((acertosAtuais / totalRespondidas) * 100).toFixed(0)}%` : '—'}
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {questoes.map((questao, qIndex) => (
          <Card key={questao.id} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'var(--gradient-1)',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}>
                  Questão {qIndex + 1}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  background: 'rgba(139,92,246,0.1)',
                  color: '#8b5cf6',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}>
                  {questao.assunto}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  background: 'rgba(245,158,11,0.1)',
                  color: 'var(--accent-orange)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}>
                  🏛️ {bancaFinal}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {questao.dificuldade}
              </span>
            </div>

            <p style={{ fontSize: '15px', lineHeight: '1.7', marginBottom: '20px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {questao.enunciado}
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              {questao.alternativas?.map((alt) => {
                const isSelected = respostas[qIndex] === alt.letra;
                const isRevealed = reveladas[qIndex];
                const isCorrect = alt.letra === questao.respostaCorreta;
                const isWrong = isSelected && !isCorrect && isRevealed;

                let bgColor = 'var(--bg-primary)';
                let borderColor = 'var(--border-color)';
                let textColor = 'var(--text-primary)';

                if (isRevealed) {
                  if (isCorrect) {
                    bgColor = 'rgba(16,185,129,0.12)';
                    borderColor = 'var(--accent-green)';
                    textColor = 'var(--accent-green)';
                  } else if (isWrong) {
                    bgColor = 'rgba(239,68,68,0.12)';
                    borderColor = 'var(--accent-red)';
                    textColor = 'var(--accent-red)';
                  }
                } else if (isSelected) {
                  bgColor = 'rgba(79,125,249,0.12)';
                  borderColor = 'var(--accent-blue)';
                  textColor = 'var(--accent-blue)';
                }

                return (
                  <button
                    key={alt.letra}
                    onClick={() => selecionarResposta(qIndex, alt.letra)}
                    disabled={isRevealed}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 18px',
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      borderRadius: '12px',
                      cursor: isRevealed ? 'default' : 'pointer',
                      transition: 'all 0.25s ease',
                      textAlign: 'left',
                      color: textColor,
                      fontSize: '14px',
                      transform: (isSelected && !isRevealed) ? 'scale(1.01)' : 'scale(1)',
                    }}
                    onMouseOver={e => {
                      if (!isRevealed) {
                        e.currentTarget.style.borderColor = 'var(--accent-blue)';
                        e.currentTarget.style.background = 'rgba(79,125,249,0.08)';
                        e.currentTarget.style.transform = 'scale(1.01)';
                      }
                    }}
                    onMouseOut={e => {
                      if (!isRevealed && !isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-primary)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      flexShrink: 0,
                      background: isRevealed
                        ? isCorrect
                          ? 'var(--accent-green)'
                          : isWrong
                            ? 'var(--accent-red)'
                            : 'rgba(255,255,255,0.05)'
                        : isSelected
                          ? 'var(--accent-blue)'
                          : 'rgba(255,255,255,0.05)',
                      color: (isSelected || (isRevealed && (isCorrect || isWrong))) ? '#fff' : 'var(--text-secondary)',
                    }}>
                      {isRevealed && isCorrect ? '✓' : isWrong ? '✕' : alt.letra}
                    </span>
                    <span>{alt.texto}</span>
                  </button>
                );
              })}
            </div>

            {!reveladas[qIndex] ? (
              <Button
                onClick={() => revelarGabarito(qIndex)}
                disabled={!respostas[qIndex]}
                variant="secondary"
                size="sm"
              >
                Ver Gabarito e Explicação
              </Button>
            ) : (
              <div style={{
                padding: '16px 20px',
                background: 'rgba(79,125,249,0.06)',
                border: '1px solid rgba(79,125,249,0.15)',
                borderRadius: '12px',
                marginTop: '8px',
              }}>
                <div style={{
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: respostas[qIndex] === questao.respostaCorreta ? 'var(--accent-green)' : 'var(--accent-red)',
                  fontSize: '14px',
                }}>
                  {respostas[qIndex] === questao.respostaCorreta 
                    ? '✅ Parabéns, você acertou!' 
                    : `❌ Resposta incorreta. Gabarito: ${questao.respostaCorreta}`}
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    💡 Explicação Detalhada
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {questao.explicacao}
                  </p>
                </div>

                {questao.segredo && (
                  <div style={{ 
                    padding: '12px 14px', 
                    background: 'rgba(245,158,11,0.08)', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(245,158,11,0.2)',
                    marginTop: '12px',
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      🔑 Segredo do Examinador
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                      {questao.segredo}
                    </p>
                  </div>
                )}

                {questao.pegadinha && (
                  <div style={{ 
                    padding: '12px 14px', 
                    background: 'rgba(236,72,153,0.08)', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(236,72,153,0.2)',
                    marginTop: '8px',
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-pink)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      ⚠️ Pegadinha da Banca
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                      {questao.pegadinha}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {questoes.length === 0 && !loading && (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❓</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Gere suas questões</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Selecione a disciplina, banca e assuntos acima e clique em "Gerar Questões"
          </p>
        </Card>
      )}
    </div>
  );
}