import React from 'react';
import Card from './Card';

export default function StreakBanner({ estatisticas, configuracoes, onNavigate }) {
  const hoje = new Date().toISOString().split('T')[0];
  const historicoHoje = (estatisticas.historico || []).find(h => h.data === hoje);
  const questoesHoje = historicoHoje?.total || 0;
  
  const metaQuestoes = configuracoes.metaQuestoesDia || 20;
  const percentualMeta = Math.min((questoesHoje / metaQuestoes) * 100, 100);
  const metaAtingida = questoesHoje >= metaQuestoes;
  
  const streak = estatisticas.sequenciaDias || 0;
  const maiorSequencia = estatisticas.maiorSequencia || 0;
  const ultimoDia = estatisticas.ultimoDiaEstudado;
  
  // Verifica se streak está em risco
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().split('T')[0];
  const streakEmRisco = ultimoDia === ontemStr && questoesHoje === 0 && streak > 0;
  
  // Data da prova
  let diasParaProva = null;
  if (configuracoes.dataProva) {
    const prova = new Date(configuracoes.dataProva);
    const agora = new Date();
    diasParaProva = Math.ceil((prova - agora) / (1000 * 60 * 60 * 24));
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: diasParaProva !== null 
        ? 'repeat(auto-fit, minmax(220px, 1fr))' 
        : 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '16px', 
      marginBottom: '24px',
    }}>
      {/* STREAK */}
      <Card style={{ 
        padding: '20px',
        background: streak >= 7
          ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.1))'
          : streak > 0
            ? 'linear-gradient(135deg, rgba(245,158,11,0.12), transparent)'
            : 'var(--bg-card)',
        borderColor: streak >= 7 ? 'var(--accent-red)' : streak > 0 ? 'var(--accent-orange)' : 'var(--border-color)',
        animation: streakEmRisco ? 'pulse-glow 1.5s infinite' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Sua Ofensiva
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 900, 
              color: streak >= 7 ? 'var(--accent-red)' : streak > 0 ? 'var(--accent-orange)' : 'var(--text-muted)',
              lineHeight: 1,
            }}>
              🔥 {streak}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {streak === 0 ? 'Comece hoje!' : streak === 1 ? 'dia seguido' : 'dias seguidos'}
            </div>
          </div>
          <div style={{ fontSize: '48px' }}>
            {streak >= 100 ? '👑' : streak >= 30 ? '🎖️' : streak >= 7 ? '⚡' : streak >= 3 ? '🔥' : '💪'}
          </div>
        </div>
        {maiorSequencia > streak && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            🏆 Recorde: {maiorSequencia} dias
          </div>
        )}
        {streakEmRisco && (
          <div style={{ 
            marginTop: '10px',
            padding: '8px 12px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid var(--accent-red)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--accent-red)',
            fontWeight: 700,
            textAlign: 'center',
          }}>
            ⚠️ Estude hoje ou perde a sequência!
          </div>
        )}
      </Card>

      {/* META DIÁRIA */}
      <Card 
        onClick={() => onNavigate && onNavigate('questoes')}
        style={{ 
          padding: '20px',
          cursor: onNavigate ? 'pointer' : 'default',
          background: metaAtingida
            ? 'linear-gradient(135deg, rgba(16,185,129,0.15), transparent)'
            : 'var(--bg-card)',
          borderColor: metaAtingida ? 'var(--accent-green)' : 'var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              Meta de Hoje
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 900, 
              color: metaAtingida ? 'var(--accent-green)' : 'var(--accent-blue)',
              lineHeight: 1,
              marginTop: '4px',
            }}>
              {questoesHoje}/{metaQuestoes}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              questões respondidas
            </div>
          </div>
          <div style={{ fontSize: '48px' }}>
            {metaAtingida ? '✅' : questoesHoje > 0 ? '🎯' : '📝'}
          </div>
        </div>
        <div style={{ 
          marginTop: '12px',
          height: '8px', 
          background: 'rgba(255,255,255,0.06)', 
          borderRadius: '10px', 
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${percentualMeta}%`,
            height: '100%',
            background: metaAtingida ? 'var(--accent-green)' : 'var(--gradient-1)',
            borderRadius: '10px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ 
          marginTop: '6px', 
          fontSize: '11px', 
          color: metaAtingida ? 'var(--accent-green)' : 'var(--text-muted)',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {metaAtingida ? '🎉 Meta batida! Continue estudando!' : `Faltam ${metaQuestoes - questoesHoje} questões`}
        </div>
      </Card>

      {/* DATA DA PROVA */}
      {diasParaProva !== null && (
        <Card style={{ 
          padding: '20px',
          background: diasParaProva <= 30
            ? 'linear-gradient(135deg, rgba(239,68,68,0.15), transparent)'
            : diasParaProva <= 90
              ? 'linear-gradient(135deg, rgba(245,158,11,0.12), transparent)'
              : 'linear-gradient(135deg, rgba(139,92,246,0.1), transparent)',
          borderColor: diasParaProva <= 30 ? 'var(--accent-red)' : diasParaProva <= 90 ? 'var(--accent-orange)' : 'var(--accent-purple)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                {configuracoes.nomeConcurso || 'Sua Prova'}
              </div>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 900, 
                color: diasParaProva <= 30 ? 'var(--accent-red)' : diasParaProva <= 90 ? 'var(--accent-orange)' : 'var(--accent-purple)',
                lineHeight: 1,
              }}>
                {diasParaProva < 0 ? '🎉' : diasParaProva}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {diasParaProva < 0 
                  ? 'A prova foi realizada!' 
                  : diasParaProva === 0 
                    ? 'É HOJE! Boa sorte!' 
                    : diasParaProva === 1 
                      ? 'dia para a prova!' 
                      : 'dias para a prova'}
              </div>
            </div>
            <div style={{ fontSize: '48px' }}>
              {diasParaProva <= 7 ? '🚨' : diasParaProva <= 30 ? '⏰' : '📅'}
            </div>
          </div>
        </Card>
      )}

      {/* CONQUISTAS RECENTES */}
      {estatisticas.conquistas && estatisticas.conquistas.length > 0 && (
        <Card style={{ 
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), transparent)',
          borderColor: 'var(--accent-orange)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                Conquistas
              </div>
              <div style={{ 
                fontSize: '36px', 
                fontWeight: 900, 
                color: 'var(--accent-orange)',
                lineHeight: 1,
              }}>
                🏆 {estatisticas.conquistas.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                badges desbloqueados
              </div>
            </div>
            <div style={{ fontSize: '32px' }}>
              {estatisticas.conquistas[estatisticas.conquistas.length - 1]?.icone || '🏆'}
            </div>
          </div>
          <div style={{ 
            marginTop: '10px',
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}>
            <strong>Última:</strong> {estatisticas.conquistas[estatisticas.conquistas.length - 1]?.titulo}
          </div>
        </Card>
      )}
    </div>
  );
}