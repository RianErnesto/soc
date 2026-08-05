import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { gerarCronograma } from '../utils/geminiApi';

export default function Cronograma() {
  const { data, getAllDisciplinas, updateCronograma, toggleCronogramaItem } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [semanas, setSemanas] = useState(4);
  const [horarios, setHorarios] = useState([{ inicio: '08:00', fim: '12:00' }, { inicio: '14:00', fim: '18:00' }]);
  const [diasSelecionados, setDiasSelecionados] = useState(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [showConfig, setShowConfig] = useState(data.cronograma.length === 0);

  const disciplinas = getAllDisciplinas();
  const apiKey = data.configuracoes.apiKey;

  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const addHorario = () => setHorarios([...horarios, { inicio: '19:00', fim: '21:00' }]);
  const removeHorario = (i) => setHorarios(horarios.filter((_, idx) => idx !== i));
  const updateHorario = (i, field, value) => {
    const novo = [...horarios];
    novo[i][field] = value;
    setHorarios(novo);
  };

  const toggleDia = (dia) => {
    setDiasSelecionados(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  const gerarNovoCronograma = async () => {
    if (disciplinas.length === 0) { setError('Importe pelo menos um edital primeiro!'); return; }
    if (!apiKey) { setError('Configure sua chave API do Gemini!'); return; }
    if (horarios.length === 0) { setError('Adicione pelo menos um horário!'); return; }
    if (diasSelecionados.length === 0) { setError('Selecione pelo menos um dia!'); return; }

    setLoading(true);
    setError('');

    try {
      const cronograma = await gerarCronograma({
        disciplinas,
        horariosDisponiveis: horarios,
        diasSemana: diasSelecionados,
        duracaoSemanas: semanas,
      }, apiKey);

      updateCronograma(cronograma);
      setShowConfig(false);
    } catch (err) {
      setError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalSlots = data.cronograma.reduce((acc, dia) => acc + (dia.slots?.length || 0), 0);
  const concluidos = data.cronograma.reduce((acc, dia) => acc + (dia.slots?.filter(s => s.concluido)?.length || 0), 0);

  const tipoColors = {
    teoria: { bg: 'rgba(79,125,249,0.12)', border: 'rgba(79,125,249,0.3)', icon: '📖' },
    exercicios: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '✏️' },
    revisao: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '🔄' },
    simulado: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', icon: '📝' },
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>📅 Cronograma Inteligente</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Plano de estudos otimizado com IA</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {data.cronograma.length > 0 && (
            <Button variant="secondary" onClick={() => setShowConfig(!showConfig)}>
              ⚙️ Configurar
            </Button>
          )}
        </div>
      </div>

      {totalSlots > 0 && (
        <Card style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 600 }}>Progresso Geral</span>
            <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
              {concluidos}/{totalSlots} ({totalSlots > 0 ? ((concluidos / totalSlots) * 100).toFixed(0) : 0}%)
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${totalSlots > 0 ? (concluidos / totalSlots) * 100 : 0}%`,
              height: '100%',
              background: 'var(--gradient-1)',
              borderRadius: '10px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </Card>
      )}

      {showConfig && (
        <Card style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>⚙️ Configuração do Cronograma</h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block', fontSize: '14px' }}>
              📆 Dias disponíveis para estudo:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {diasSemana.map(dia => (
                <button
                  key={dia}
                  onClick={() => toggleDia(dia)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${diasSelecionados.includes(dia) ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                    background: diasSelecionados.includes(dia) ? 'rgba(79,125,249,0.15)' : 'transparent',
                    color: diasSelecionados.includes(dia) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block', fontSize: '14px' }}>
              🕐 Horários disponíveis:
            </label>
            {horarios.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  type="time"
                  value={h.inicio}
                  onChange={e => updateHorario(i, 'inicio', e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>até</span>
                <input
                  type="time"
                  value={h.fim}
                  onChange={e => updateHorario(i, 'fim', e.target.value)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
                {horarios.length > 1 && (
                  <Button variant="danger" size="sm" onClick={() => removeHorario(i)}>✕</Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addHorario}>+ Adicionar horário</Button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block', fontSize: '14px' }}>
              📅 Duração do plano (semanas):
            </label>
            <input
              type="number"
              min="1"
              max="52"
              value={semanas}
              onChange={e => setSemanas(Number(e.target.value))}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                width: '100px',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block', fontSize: '14px' }}>
              📚 Disciplinas que serão incluídas ({disciplinas.length}):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {disciplinas.map((d, i) => (
                <span key={i} style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  background: 'rgba(79,125,249,0.1)',
                  color: 'var(--accent-blue)',
                  border: '1px solid rgba(79,125,249,0.2)',
                }}>
                  {d.nome} ({d.assuntos.length})
                </span>
              ))}
              {disciplinas.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Nenhuma disciplina encontrada. Importe um edital primeiro!
                </span>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(239,68,68,0.1)',
              borderRadius: '10px',
              color: 'var(--accent-red)',
              fontSize: '13px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <Button onClick={gerarNovoCronograma} loading={loading} disabled={loading} size="lg" icon="🤖">
            {loading ? 'Gerando cronograma com IA...' : 'Gerar Cronograma com IA'}
          </Button>
        </Card>
      )}

      {data.cronograma.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {data.cronograma.map((dia, diaIndex) => (
            <Card key={diaIndex} style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <h3 style={{ fontWeight: 700, fontSize: '16px' }}>
                  📅 {dia.dia} <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 400 }}>
                    {dia.data}
                  </span>
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {dia.slots?.filter(s => s.concluido).length}/{dia.slots?.length} concluídos
                </span>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {dia.slots?.map((slot, slotIndex) => {
                  const tipo = tipoColors[slot.tipo] || tipoColors.teoria;
                  return (
                    <div
                      key={slotIndex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: slot.concluido ? 'rgba(16,185,129,0.08)' : tipo.bg,
                        border: `1px solid ${slot.concluido ? 'rgba(16,185,129,0.3)' : tipo.border}`,
                        borderRadius: '10px',
                        transition: 'all 0.2s',
                        opacity: slot.concluido ? 0.7 : 1,
                      }}
                    >
                      <button
                        onClick={() => toggleCronogramaItem(diaIndex, slotIndex)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: `2px solid ${slot.concluido ? 'var(--accent-green)' : 'var(--border-color)'}`,
                          background: slot.concluido ? 'var(--accent-green)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '12px',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        {slot.concluido && '✓'}
                      </button>

                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        minWidth: '100px',
                      }}>
                        🕐 {slot.inicio} - {slot.fim}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          textDecoration: slot.concluido ? 'line-through' : 'none',
                        }}>
                          {tipo.icon} {slot.disciplina}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          textDecoration: slot.concluido ? 'line-through' : 'none',
                        }}>
                          {slot.assunto}
                        </div>
                      </div>

                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: tipo.bg,
                        border: `1px solid ${tipo.border}`,
                        color: 'var(--text-secondary)',
                      }}>
                        {slot.tipo}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {data.cronograma.length === 0 && !showConfig && (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📅</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Nenhum cronograma gerado</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Configure seus horários e deixe a IA montar o cronograma perfeito pra você!
          </p>
          <Button onClick={() => setShowConfig(true)} icon="⚙️">Configurar Cronograma</Button>
        </Card>
      )}
    </div>
  );
}