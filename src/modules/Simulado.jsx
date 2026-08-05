import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { gerarSimulado } from '../utils/geminiApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BANCAS = [
  'CESPE/CEBRASPE', 'FCC', 'Cesgranrio', 'FGV', 'VUNESP', 'IBFC', 'Quadrix',
  'Instituto Consulplan', 'Instituto Consulpam', 'IADES', 'AOCP', 'FUNDATEC', 'IBAM'
];

export default function Simulado() {
  const { data, getAllDisciplinas, salvarSimulado, registrarResposta } = useData();
  
  // Estados de configuração
  const [tela, setTela] = useState('config'); // config | executando | resultado | historico
  const [quantidade, setQuantidade] = useState(20);
  const [tempoMinutos, setTempoMinutos] = useState(60);
  const [banca, setBanca] = useState('CESPE/CEBRASPE');
  const [dificuldade, setDificuldade] = useState('média');
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados do simulado em execução
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [marcadas, setMarcadas] = useState({});
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [avisoTempo, setAvisoTempo] = useState(false);
  const [tempoInicio, setTempoInicio] = useState(null);
  const [tempoPorQuestao, setTempoPorQuestao] = useState({});
  const [tempoQuestaoAtual, setTempoQuestaoAtual] = useState(Date.now());

  // Estados do resultado
  const [resultado, setResultado] = useState(null);
  const [showConfirmarEnvio, setShowConfirmarEnvio] = useState(false);

  const intervalRef = useRef(null);
  const disciplinas = getAllDisciplinas();
  const apiKey = data.configuracoes.apiKey;
  const simulados = data.simulados || [];

  // Cronômetro
  useEffect(() => {
    if (tela === 'executando' && tempoRestante > 0) {
      intervalRef.current = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            finalizarSimulado(true);
            return 0;
          }
          if (prev === 300 && !avisoTempo) { // 5 min
            setAvisoTempo(true);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
    }, [tela, tempoRestante, avisoTempo]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDisciplina = (nome) => {
    setDisciplinasSelecionadas(prev =>
      prev.includes(nome) ? prev.filter(d => d !== nome) : [...prev, nome]
    );
  };

  const selecionarTodasDisciplinas = () => {
    setDisciplinasSelecionadas(disciplinas.map(d => d.nome));
  };

  const iniciarSimulado = async () => {
    if (disciplinasSelecionadas.length === 0) { setError('Selecione pelo menos uma disciplina!'); return; }
    if (!apiKey) { setError('Configure sua chave API do Gemini!'); return; }
    if (quantidade < 5) { setError('Mínimo de 5 questões!'); return; }

    setLoading(true);
    setError('');

    try {
      const disciplinasParaIA = disciplinas.filter(d => disciplinasSelecionadas.includes(d.nome));
      const novasQuestoes = await gerarSimulado({
        disciplinas: disciplinasParaIA,
        quantidade,
        banca,
        dificuldade,
      }, apiKey);

      const questoesComId = novasQuestoes.map((q, i) => ({ ...q, id: Date.now() + i }));
      setQuestoes(questoesComId);
      setRespostas({});
      setMarcadas({});
      setQuestaoAtual(0);
      setTempoRestante(tempoMinutos * 60);
      setAvisoTempo(false);
      setTempoInicio(Date.now());
      setTempoQuestaoAtual(Date.now());
      setTempoPorQuestao({});
      setTela('executando');
    } catch (err) {
      setError(`Erro ao gerar simulado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const registrarTempoQuestao = (index) => {
    const agora = Date.now();
    const tempoGasto = Math.floor((agora - tempoQuestaoAtual) / 1000);
    setTempoPorQuestao(prev => ({
      ...prev,
      [index]: (prev[index] || 0) + tempoGasto,
    }));
    setTempoQuestaoAtual(agora);
  };

  const irParaQuestao = (index) => {
    registrarTempoQuestao(questaoAtual);
    setQuestaoAtual(index);
  };

  const proximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      irParaQuestao(questaoAtual + 1);
    }
  };

  const questaoAnterior = () => {
    if (questaoAtual > 0) {
      irParaQuestao(questaoAtual - 1);
    }
  };

  const marcarResposta = (letra) => {
    setRespostas(prev => ({ ...prev, [questaoAtual]: letra }));
  };

  const toggleMarcar = () => {
    setMarcadas(prev => ({ ...prev, [questaoAtual]: !prev[questaoAtual] }));
  };

  const finalizarSimulado = (tempoEsgotado = false) => {
    registrarTempoQuestao(questaoAtual);
    clearInterval(intervalRef.current);

    // Calcular resultados
    let acertos = 0;
    let erros = 0;
    let embranco = 0;
    const porDisciplina = {};

    questoes.forEach((q, i) => {
      const resposta = respostas[i];
      const disciplina = q.disciplina || 'Sem disciplina';
      
      if (!porDisciplina[disciplina]) {
        porDisciplina[disciplina] = { total: 0, acertos: 0, erros: 0, embranco: 0 };
      }
      porDisciplina[disciplina].total++;

      if (!resposta) {
        embranco++;
        porDisciplina[disciplina].embranco++;
      } else if (resposta === q.respostaCorreta) {
        acertos++;
        porDisciplina[disciplina].acertos++;
        registrarResposta(q, resposta, true);
      } else {
        erros++;
        porDisciplina[disciplina].erros++;
        registrarResposta(q, resposta, false);
      }
    });

    const tempoTotal = Math.floor((Date.now() - tempoInicio) / 1000);
    const nota = ((acertos / questoes.length) * 100).toFixed(1);

    const dadosResultado = {
      quantidade: questoes.length,
      acertos,
      erros,
      embranco,
      nota: Number(nota),
      tempoTotal,
      tempoLimite: tempoMinutos * 60,
      tempoEsgotado,
      banca,
      dificuldade,
      disciplinas: disciplinasSelecionadas,
      porDisciplina,
      questoes,
      respostas,
      tempoPorQuestao,
      marcadas,
    };

    setResultado(dadosResultado);
    salvarSimulado(dadosResultado);
    setTela('resultado');
  };

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  const totalRespondidas = Object.keys(respostas).length;
  const totalMarcadas = Object.keys(marcadas).filter(k => marcadas[k]).length;
  const questao = questoes[questaoAtual];

  // ========== TELA DE CONFIGURAÇÃO ==========
  if (tela === 'config') {
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>🔥 Modo Simulado</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Treine como se fosse o dia da prova real!</p>
          </div>
          {simulados.length > 0 && (
            <Button variant="secondary" onClick={() => setTela('historico')} icon="📜">
              Ver Histórico ({simulados.length})
            </Button>
          )}
        </div>

        <Card style={{ padding: '28px', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>⚙️ Configurar Simulado</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                🔢 Quantidade de Questões
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={quantidade}
                onChange={e => setQuantidade(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Recomendado: 20-40 questões
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                ⏱️ Tempo Total (minutos)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={tempoMinutos}
                onChange={e => setTempoMinutos(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Média: ~3 min/questão
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
                🏛️ Banca
              </label>
              <select
                value={banca}
                onChange={e => setBanca(e.target.value)}
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
                {BANCAS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

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

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>
                📚 Disciplinas (obrigatório):
              </label>
              <Button variant="ghost" size="sm" onClick={selecionarTodasDisciplinas}>
                ☑️ Selecionar todas
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {disciplinas.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  ⚠️ Nenhuma disciplina disponível. Importe um edital primeiro!
                </span>
              )}
              {disciplinas.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDisciplina(d.nome)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${disciplinasSelecionadas.includes(d.nome) ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    background: disciplinasSelecionadas.includes(d.nome) ? 'rgba(79,125,249,0.15)' : 'transparent',
                    color: disciplinasSelecionadas.includes(d.nome) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {d.nome}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{
            padding: '16px',
            background: 'rgba(245,158,11,0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(245,158,11,0.15)',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}>
            💡 <strong style={{ color: 'var(--accent-orange)' }}>Como funciona:</strong><br />
            • As questões aparecerão MISTURADAS de todas disciplinas escolhidas<br />
            • O gabarito só aparece no FINAL (como prova real!)<br />
            • Você pode marcar questões pra revisar (bandeirinha 🚩)<br />
            • Alerta quando faltar 5 minutos ⚠️<br />
            • Se o tempo acabar, o simulado é enviado automaticamente
          </div>

          <Button 
            onClick={iniciarSimulado} 
            loading={loading} 
            disabled={loading || disciplinas.length === 0} 
            size="lg" 
            icon="🚀"
            style={{ width: '100%' }}
          >
            {loading ? 'Gerando questões... aguarde' : 'INICIAR SIMULADO'}
          </Button>
        </Card>
      </div>
    );
  }

  // ========== TELA DE EXECUÇÃO ==========
  if (tela === 'executando' && questao) {
    const corTempo = tempoRestante <= 60 ? 'var(--accent-red)' 
      : tempoRestante <= 300 ? 'var(--accent-orange)' 
      : 'var(--accent-green)';

    return (
      <div className="animate-fade-in">
        {/* HEADER FIXO */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          zIndex: 100,
          padding: '16px 0',
          marginBottom: '20px',
          borderBottom: '2px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tempo Restante</div>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 900, 
                  color: corTempo,
                  fontVariantNumeric: 'tabular-nums',
                  animation: tempoRestante <= 60 ? 'pulse-glow 1s infinite' : 'none',
                }}>
                  ⏱️ {formatarTempo(tempoRestante)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Progresso</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-blue)' }}>
                  {totalRespondidas}/{questoes.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Marcadas</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-orange)' }}>
                  🚩 {totalMarcadas}
                </div>
              </div>
            </div>
            <Button variant="danger" onClick={() => setShowConfirmarEnvio(true)} icon="🏁">
              Finalizar Simulado
            </Button>
          </div>

          {avisoTempo && tempoRestante > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '10px 16px',
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid var(--accent-orange)',
              borderRadius: '10px',
              color: 'var(--accent-orange)',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'center',
            }}>
              ⚠️ ATENÇÃO! Falta menos de 5 minutos para o tempo acabar!
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '20px' }}>
          {/* QUESTÃO ATUAL */}
          <Card style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--gradient-1)', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700 }}>
                  Questão {questaoAtual + 1} / {questoes.length}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                  {questao.disciplina}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', background: 'rgba(79,125,249,0.1)', color: 'var(--accent-blue)' }}>
                  {questao.assunto}
                </span>
              </div>
              <button
                onClick={toggleMarcar}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${marcadas[questaoAtual] ? 'var(--accent-orange)' : 'var(--border-color)'}`,
                  background: marcadas[questaoAtual] ? 'rgba(245,158,11,0.15)' : 'transparent',
                  color: marcadas[questaoAtual] ? 'var(--accent-orange)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                🚩 {marcadas[questaoAtual] ? 'Marcada' : 'Marcar p/ revisar'}
              </button>
            </div>

            <p style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {questao.enunciado}
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
              {questao.alternativas?.map(alt => {
                const isSelected = respostas[questaoAtual] === alt.letra;
                return (
                  <button
                    key={alt.letra}
                    onClick={() => marcarResposta(alt.letra)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 18px',
                      background: isSelected ? 'rgba(79,125,249,0.15)' : 'var(--bg-primary)',
                      border: `2px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                    onMouseOver={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--accent-blue)';
                        e.currentTarget.style.background = 'rgba(79,125,249,0.06)';
                      }
                    }}
                    onMouseOut={e => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-primary)';
                      }
                    }}
                  >
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '14px', flexShrink: 0,
                      background: isSelected ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                    }}>
                      {alt.letra}
                    </span>
                    <span>{alt.texto}</span>
                  </button>
                );
              })}
            </div>

            {/* NAVEGAÇÃO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px' }}>
              <Button variant="secondary" onClick={questaoAnterior} disabled={questaoAtual === 0}>
                ← Anterior
              </Button>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                {respostas[questaoAtual] ? `✅ Respondida (${respostas[questaoAtual]})` : '⚪ Não respondida'}
              </div>
              <Button 
                variant={questaoAtual === questoes.length - 1 ? 'success' : 'primary'} 
                onClick={questaoAtual === questoes.length - 1 ? () => setShowConfirmarEnvio(true) : proximaQuestao}
              >
                {questaoAtual === questoes.length - 1 ? '🏁 Finalizar' : 'Próxima →'}
              </Button>
            </div>
          </Card>

          {/* GRADE LATERAL */}
          <Card style={{ padding: '16px', position: 'sticky', top: '160px', height: 'fit-content', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              MAPA DE QUESTÕES
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '6px',
            }}>
              {questoes.map((_, i) => {
                const respondida = !!respostas[i];
                const marcada = !!marcadas[i];
                const atual = i === questaoAtual;
                
                let bg = 'rgba(255,255,255,0.05)';
                let border = 'var(--border-color)';
                let color = 'var(--text-muted)';
                
                if (respondida) { bg = 'rgba(16,185,129,0.15)'; border = 'var(--accent-green)'; color = 'var(--accent-green)'; }
                if (marcada) { bg = 'rgba(245,158,11,0.15)'; border = 'var(--accent-orange)'; color = 'var(--accent-orange)'; }
                if (atual) { bg = 'var(--accent-blue)'; border = 'var(--accent-blue)'; color = '#fff'; }
                
                return (
                  <button
                    key={i}
                    onClick={() => irParaQuestao(i)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: `2px solid ${border}`,
                      background: bg,
                      color: color,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      transition: 'all 0.2s',
                    }}
                  >
                    {i + 1}
                    {marcada && !atual && <div style={{ fontSize: '8px' }}>🚩</div>}
                  </button>
                );
              })}
            </div>
            
            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>🟢 Respondida</div>
              <div>🟠 Marcada</div>
              <div>🔵 Atual</div>
              <div>⚪ Em branco</div>
            </div>
          </Card>
        </div>

        {/* MODAL DE CONFIRMAÇÃO */}
        {showConfirmarEnvio && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          }}>
            <Card style={{ padding: '32px', maxWidth: '500px', width: '90%', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>🏁</div>
              <h3 style={{ fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>
                Finalizar Simulado?
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', textAlign: 'center', lineHeight: '1.6' }}>
                Você respondeu <strong style={{ color: 'var(--accent-green)' }}>{totalRespondidas}</strong> de <strong>{questoes.length}</strong> questões.
                <br />
                {questoes.length - totalRespondidas > 0 && (
                  <span style={{ color: 'var(--accent-red)' }}>
                    ⚠️ {questoes.length - totalRespondidas} questão(ões) em branco!
                  </span>
                )}
                <br /><br />
                <strong>Depois de finalizar, você não poderá voltar!</strong>
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button variant="ghost" onClick={() => setShowConfirmarEnvio(false)}>
                  Continuar respondendo
                </Button>
                <Button variant="danger" onClick={() => { setShowConfirmarEnvio(false); finalizarSimulado(false); }} icon="🏁">
                  Sim, finalizar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ========== TELA DE RESULTADO ==========
  if (tela === 'resultado' && resultado) {
    const notaColor = resultado.nota >= 70 ? 'var(--accent-green)' : resultado.nota >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)';
    const dadosGrafico = Object.entries(resultado.porDisciplina).map(([nome, val]) => ({
      nome: nome.length > 20 ? nome.substring(0, 20) + '...' : nome,
      Acertos: val.acertos,
      Erros: val.erros,
      'Em branco': val.embranco,
      taxa: val.total > 0 ? ((val.acertos / val.total) * 100).toFixed(0) : 0,
    }));

    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '8px' }}>
            {resultado.nota >= 70 ? '🏆' : resultado.nota >= 50 ? '👍' : '📚'}
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>
            Simulado Concluído!
          </h1>
          {resultado.tempoEsgotado && (
            <p style={{ color: 'var(--accent-orange)', fontSize: '14px', fontWeight: 600 }}>
              ⏰ Tempo esgotado! O simulado foi enviado automaticamente.
            </p>
          )}
        </div>

        {/* NOTA GRANDE */}
        <Card style={{ padding: '40px', marginBottom: '20px', textAlign: 'center', background: `linear-gradient(135deg, ${notaColor}15, transparent)`, borderColor: notaColor }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Sua Nota
          </div>
          <div style={{ fontSize: '80px', fontWeight: 900, color: notaColor, lineHeight: 1 }}>
            {resultado.nota}%
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px' }}>
            {resultado.acertos} de {resultado.quantidade} questões corretas
          </div>
        </Card>

        {/* ESTATÍSTICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <Card style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>✅</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)' }}>{resultado.acertos}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acertos</div>
          </Card>
          <Card style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>❌</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-red)' }}>{resultado.erros}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Erros</div>
          </Card>
          <Card style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚪</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-muted)' }}>{resultado.embranco}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Em branco</div>
          </Card>
          <Card style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>⏱️</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-blue)' }}>
              {formatarTempo(resultado.tempoTotal)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tempo Total</div>
          </Card>
          <Card style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚡</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-purple)' }}>
              {(resultado.tempoTotal / resultado.quantidade).toFixed(0)}s
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Média/Questão</div>
          </Card>
        </div>

        {/* GRÁFICO POR DISCIPLINA */}
        <Card style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>📊 Desempenho por Disciplina</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="nome" stroke="#666699" fontSize={11} angle={-20} textAnchor="end" height={70} />
              <YAxis stroke="#666699" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1a1a4a', border: '1px solid #2a2a5a', borderRadius: '10px' }} />
              <Bar dataKey="Acertos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Erros" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Em branco" fill="#666699" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* GABARITO DETALHADO */}
        <Card style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>📝 Revisão Detalhada</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {resultado.questoes.map((q, i) => {
              const respostaUser = resultado.respostas[i];
              const correta = respostaUser === q.respostaCorreta;
              const tempo = resultado.tempoPorQuestao[i] || 0;
              
              return (
                <div key={i} style={{
                  padding: '16px',
                  background: !respostaUser ? 'rgba(102,102,153,0.08)' : correta ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${!respostaUser ? 'rgba(102,102,153,0.2)' : correta ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>Questão {i + 1}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {q.disciplina}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• ⏱️ {formatarTempo(tempo)}</span>
                    </div>
                    <div>
                      {!respostaUser ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>⚪ Em branco</span>
                      ) : correta ? (
                        <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 700 }}>
                          ✅ Acertou ({respostaUser})
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 700 }}>
                          ❌ Errou (Sua: {respostaUser} | Correta: {q.respostaCorreta})
                        </span>
                      )}
                    </div>
                  </div>
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                      Ver enunciado, gabarito e explicação
                    </summary>
                    <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      <p style={{ marginBottom: '8px' }}><strong>Enunciado:</strong> {q.enunciado}</p>
                      <p style={{ marginBottom: '8px' }}><strong>Gabarito:</strong> {q.respostaCorreta}</p>
                      <p style={{ marginBottom: '8px' }}><strong>💡 Explicação:</strong> {q.explicacao}</p>
                      {q.segredo && <p style={{ marginBottom: '8px', color: 'var(--accent-orange)' }}><strong>🔑 Segredo:</strong> {q.segredo}</p>}
                      {q.pegadinha && <p style={{ color: 'var(--accent-pink)' }}><strong>⚠️ Pegadinha:</strong> {q.pegadinha}</p>}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => { setTela('config'); setResultado(null); }} icon="🔄">
            Fazer outro simulado
          </Button>
          <Button variant="primary" onClick={() => setTela('historico')} icon="📜">
            Ver histórico
          </Button>
        </div>
      </div>
    );
  }

  // ========== TELA DE HISTÓRICO ==========
  if (tela === 'historico') {
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>📜 Histórico de Simulados</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Acompanhe sua evolução ao longo do tempo</p>
          </div>
          <Button variant="primary" onClick={() => setTela('config')} icon="🔥">
            Novo Simulado
          </Button>
        </div>

        {simulados.length === 0 ? (
          <Card style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📜</div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Nenhum simulado ainda</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Faça seu primeiro simulado para começar a acompanhar sua evolução!</p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {[...simulados].reverse().map((sim) => {
              const notaColor = sim.nota >= 70 ? 'var(--accent-green)' : sim.nota >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)';
              return (
                <Card key={sim.id} style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center', minWidth: '80px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 900, color: notaColor }}>{sim.nota}%</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NOTA</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                          {sim.quantidade} questões • {sim.banca}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>📅 {new Date(sim.data).toLocaleString('pt-BR')}</span>
                          <span>⏱️ {formatarTempo(sim.tempoTotal)}</span>
                          <span style={{ color: 'var(--accent-green)' }}>✅ {sim.acertos}</span>
                          <span style={{ color: 'var(--accent-red)' }}>❌ {sim.erros}</span>
                          <span style={{ color: 'var(--text-muted)' }}>⚪ {sim.embranco}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'capitalize' }}>
                          Dificuldade: {sim.dificuldade}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}