import React from 'react';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import StreakBanner from '../components/StreakBanner';
import { useData } from '../context/DataContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = ['#4f7df9', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#84cc16'];

export default function Dashboard({ onNavigate }) {
  const { data, getAllDisciplinas } = useData();
  const { estatisticas, editais, cronograma, flashcards, resumos } = data;

  const disciplinas = getAllDisciplinas();
  const totalAssuntos = disciplinas.reduce((acc, d) => acc + d.assuntos.length, 0);
  const taxaAcerto = estatisticas.totalQuestoes > 0
    ? ((estatisticas.acertos / estatisticas.totalQuestoes) * 100).toFixed(1)
    : 0;

  const cronogramaConcluidos = cronograma.reduce((acc, dia) => {
    return acc + (dia.slots?.filter(s => s.concluido)?.length || 0);
  }, 0);
  const cronogramaTotal = cronograma.reduce((acc, dia) => acc + (dia.slots?.length || 0), 0);

  const disciplinaData = Object.entries(estatisticas.porDisciplina || {}).map(([nome, val]) => ({
    nome: nome.length > 15 ? nome.substring(0, 15) + '...' : nome,
    total: val.total,
    acertos: val.acertos,
    taxa: val.total > 0 ? ((val.acertos / val.total) * 100).toFixed(0) : 0,
  }));

  const historicoData = (estatisticas.historico || []).slice(-14).map(h => ({
    data: new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: h.total,
    acertos: h.acertos,
    taxa: h.total > 0 ? ((h.acertos / h.total) * 100).toFixed(0) : 0,
  }));

  const pieData = disciplinaData.length > 0 ? disciplinaData.map(d => ({
    name: d.nome,
    value: d.total,
  })) : [{ name: 'Sem dados', value: 1 }];

  const statsCards = [
    { label: 'Editais Importados', value: editais.length, icon: '📋', color: '#4f7df9', action: 'editais' },
    { label: 'Disciplinas', value: disciplinas.length, icon: '📚', color: '#8b5cf6', action: 'editais' },
    { label: 'Assuntos Mapeados', value: totalAssuntos, icon: '🎯', color: '#ec4899', action: 'editais' },
    { label: 'Questões Respondidas', value: estatisticas.totalQuestoes, icon: '❓', color: '#10b981', action: 'questoes' },
    { label: 'Taxa de Acerto', value: `${taxaAcerto}%`, icon: '✅', color: '#f59e0b', action: 'desempenho' },
    { label: 'Flashcards', value: flashcards.length, icon: '🃏', color: '#06b6d4', action: 'flashcards' },
    { label: 'Resumos', value: resumos.length, icon: '📝', color: '#84cc16', action: 'resumos' },
    { label: 'Cronograma', value: `${cronogramaConcluidos}/${cronogramaTotal}`, icon: '📅', color: '#ef4444', action: 'cronograma' },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 900,
          background: 'var(--gradient-1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
        }}>
          Dashboard de Estudos 🚀
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Seu painel completo de acompanhamento para aprovação em concursos
        </p>
      </div>

      {/* 🎯 NOVO: Banner de Streak, Meta, Data da Prova e Conquistas */}
      <StreakBanner 
        estatisticas={estatisticas} 
        configuracoes={data.configuracoes} 
        onNavigate={onNavigate}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {statsCards.map((stat, i) => (
          <Card key={i} glow onClick={() => onNavigate(stat.action)} style={{ padding: '20px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
              <div style={{
                fontSize: '28px',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <Card style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 700 }}>📈 Evolução de Desempenho</h3>
          {historicoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={historicoData}>
                <defs>
                  <linearGradient id="colorAcertos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f7df9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f7df9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="data" stroke="#666699" fontSize={11} />
                <YAxis stroke="#666699" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a4a',
                    border: '1px solid #2a2a5a',
                    borderRadius: '10px',
                    color: '#f0f0ff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                <Area type="monotone" dataKey="acertos" stroke="#4f7df9" fillOpacity={1} fill="url(#colorAcertos)" name="Acertos" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                <p>Responda questões para ver sua evolução aqui!</p>
              </div>
            </div>
          )}
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 700 }}>🎯 Questões por Disciplina</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1a1a4a',
                  border: '1px solid #2a2a5a',
                  borderRadius: '10px',
                  color: '#f0f0ff',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {pieData.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {disciplinaData.length > 0 && (
        <Card style={{ padding: '24px', marginBottom: '28px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 700 }}>📊 Desempenho por Disciplina</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={disciplinaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="nome" stroke="#666699" fontSize={11} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#666699" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a4a',
                  border: '1px solid #2a2a5a',
                  borderRadius: '10px',
                  color: '#f0f0ff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="acertos" fill="#10b981" name="Acertos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="#4f7df9" name="Total" radius={[4, 4, 0, 0]} opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {cronogramaTotal > 0 && (
        <Card style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 700 }}>📅 Progresso do Cronograma</h3>
          <ProgressBar
            value={cronogramaConcluidos}
            max={cronogramaTotal}
            height={12}
            showLabel
            label={`${cronogramaConcluidos} de ${cronogramaTotal} atividades concluídas`}
          />
        </Card>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginTop: '28px',
      }}>
        {[
          { icon: '📋', title: 'Importar Edital', desc: 'Comece importando seu edital', action: 'editais', gradient: 'linear-gradient(135deg, rgba(79,125,249,0.15), rgba(139,92,246,0.15))' },
          { icon: '❓', title: 'Praticar Questões', desc: 'Gere questões com IA', action: 'questoes', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))' },
          { icon: '📅', title: 'Gerar Cronograma', desc: 'Crie seu plano de estudos', action: 'cronograma', gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))' },
          { icon: '🃏', title: 'Flashcards', desc: 'Memorize com cartões', action: 'flashcards', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))' },
        ].map((item, i) => (
          <Card
            key={i}
            onClick={() => onNavigate(item.action)}
            glow
            style={{
              padding: '24px',
              cursor: 'pointer',
              background: item.gradient,
              borderColor: 'transparent',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{item.icon}</div>
            <h4 style={{ marginBottom: '6px', fontWeight: 700 }}>{item.title}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}