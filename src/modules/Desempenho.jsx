import React, { useState } from 'react';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const COLORS = ['#4f7df9', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#84cc16'];

export default function Desempenho() {
  const { data } = useData();
  const { estatisticas } = data;
  const [filtro, setFiltro] = useState('geral');

  const taxaGeral = estatisticas.totalQuestoes > 0
    ? ((estatisticas.acertos / estatisticas.totalQuestoes) * 100).toFixed(1)
    : 0;

  const disciplinaData = Object.entries(estatisticas.porDisciplina || {}).map(([nome, val]) => ({
    nome: nome.length > 20 ? nome.substring(0, 20) + '...' : nome,
    nomeCompleto: nome,
    total: val.total,
    acertos: val.acertos,
    erros: val.total - val.acertos,
    taxa: val.total > 0 ? ((val.acertos / val.total) * 100).toFixed(1) : 0,
  }));

  const assuntoData = Object.entries(estatisticas.porAssunto || {}).map(([chave, val]) => {
    const [disc, assunto] = chave.split('|');
    return {
      disciplina: disc,
      assunto,
      total: val.total,
      acertos: val.acertos,
      taxa: val.total > 0 ? ((val.acertos / val.total) * 100).toFixed(1) : 0,
    };
  }).sort((a, b) => b.total - a.total);

  const historicoData = (estatisticas.historico || []).slice(-30).map(h => ({
    data: new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: h.total,
    acertos: h.acertos,
    taxa: h.total > 0 ? ((h.acertos / h.total) * 100).toFixed(0) : 0,
  }));

  const radarData = disciplinaData.slice(0, 8).map(d => ({
    subject: d.nome,
    value: Number(d.taxa),
  }));

  const pieData = disciplinaData.length > 0
    ? disciplinaData.map(d => ({ name: d.nome, value: d.total }))
    : [{ name: 'Sem dados', value: 1 }];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>📈 Desempenho Detalhado</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Análise completa da sua evolução nos estudos</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total de Questões', value: estatisticas.totalQuestoes, icon: '📊', color: '#4f7df9' },
          { label: 'Acertos', value: estatisticas.acertos, icon: '✅', color: '#10b981' },
          { label: 'Erros', value: estatisticas.erros, icon: '❌', color: '#ef4444' },
          { label: 'Taxa de Acerto', value: `${taxaGeral}%`, icon: '🎯', color: Number(taxaGeral) >= 70 ? '#10b981' : '#f59e0b' },
        ].map((stat, i) => (
          <Card key={i} style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {stat.icon} {stat.label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['geral', 'disciplina', 'assunto'].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              border: `1px solid ${filtro === f ? 'var(--accent-blue)' : 'var(--border-color)'}`,
              background: filtro === f ? 'rgba(79,125,249,0.12)' : 'transparent',
              color: filtro === f ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {f === 'geral' ? '📊 Geral' : f === 'disciplina' ? '📚 Por Disciplina' : '🎯 Por Assunto'}
          </button>
        ))}
      </div>

      {filtro === 'geral' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <Card style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>📈 Evolução Diária</h3>
            {historicoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="data" stroke="#666699" fontSize={11} />
                  <YAxis stroke="#666699" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#1a1a4a', border: '1px solid #2a2a5a', borderRadius: '10px', color: '#f0f0ff' }} />
                  <Line type="monotone" dataKey="acertos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Acertos" />
                  <Line type="monotone" dataKey="total" stroke="#4f7df9" strokeWidth={2} dot={{ r: 4 }} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Responda questões para ver dados aqui
              </div>
            )}
          </Card>

          <Card style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>🎯 Radar de Desempenho</h3>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" stroke="#9999cc" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#666699" fontSize={10} />
                  <Radar name="Taxa %" dataKey="value" stroke="#4f7df9" fill="#4f7df9" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Responda questões para ver dados aqui
              </div>
            )}
          </Card>

          <Card style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>📊 Distribuição por Disciplina</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a4a', border: '1px solid #2a2a5a', borderRadius: '10px', color: '#f0f0ff' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>📈 Taxa de Acerto Diária (%)</h3>
            {historicoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={historicoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="data" stroke="#666699" fontSize={11} />
                  <YAxis stroke="#666699" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#1a1a4a', border: '1px solid #2a2a5a', borderRadius: '10px', color: '#f0f0ff' }} />
                  <Bar dataKey="taxa" name="Taxa %" radius={[4, 4, 0, 0]}>
                    {historicoData.map((entry, i) => (
                      <Cell key={i} fill={Number(entry.taxa) >= 70 ? '#10b981' : Number(entry.taxa) >= 40 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Responda questões para ver dados aqui
              </div>
            )}
          </Card>
        </div>
      )}

      {filtro === 'disciplina' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {disciplinaData.length > 0 ? disciplinaData.map((d, i) => (
            <Card key={i} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontWeight: 700 }}>{d.nomeCompleto}</h4>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--accent-green)' }}>✅ {d.acertos}</span>
                  <span style={{ color: 'var(--accent-red)' }}>❌ {d.erros}</span>
                  <span style={{
                    fontWeight: 700,
                    color: Number(d.taxa) >= 70 ? 'var(--accent-green)' : Number(d.taxa) >= 40 ? 'var(--accent-orange)' : 'var(--accent-red)',
                  }}>
                    {d.taxa}%
                  </span>
                </div>
              </div>
              <ProgressBar value={Number(d.taxa)} max={100} height={8} />
            </Card>
          )) : (
            <Card style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Nenhum dado por disciplina disponível</p>
            </Card>
          )}
        </div>
      )}

      {filtro === 'assunto' && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {assuntoData.length > 0 ? assuntoData.map((a, i) => (
            <Card key={i} style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{a.assunto}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.disciplina}</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '13px', alignItems: 'center' }}>
                  <span>{a.acertos}/{a.total}</span>
                  <span style={{
                    padding: '3px 12px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '12px',
                    background: Number(a.taxa) >= 70
                      ? 'rgba(16,185,129,0.15)'
                      : Number(a.taxa) >= 40
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(239,68,68,0.15)',
                    color: Number(a.taxa) >= 70
                      ? 'var(--accent-green)'
                      : Number(a.taxa) >= 40
                        ? 'var(--accent-orange)'
                        : 'var(--accent-red)',
                  }}>
                    {a.taxa}%
                  </span>
                </div>
              </div>
              <ProgressBar value={Number(a.taxa)} max={100} height={6} />
            </Card>
          )) : (
            <Card style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Nenhum dado por assunto disponível</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}