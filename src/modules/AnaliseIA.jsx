import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { gerarAnalisePreditiva } from '../utils/geminiApi';

export default function AnaliseIA() {
  const { data, salvarAnalise, removerAnalise, getAllDisciplinas } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analiseAtual, setAnaliseAtual] = useState(null);
  const [analiseVisualizando, setAnaliseVisualizando] = useState(null);

  const apiKey = data.configuracoes.apiKey;
  const analises = data.analises || [];
  const estatisticas = data.estatisticas || {};
  const disciplinas = getAllDisciplinas();

  // Verifica se tem dados suficientes
  const totalQuestoes = estatisticas.totalQuestoes || 0;
  const temDadosSuficientes = totalQuestoes >= 10;

  const gerarNovaAnalise = async () => {
    if (!apiKey) {
      setError('Configure sua chave API do Gemini em Configurações!');
      return;
    }
    if (!temDadosSuficientes) {
      setError('Você precisa ter respondido pelo menos 10 questões para gerar uma análise significativa.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dadosParaIA = {
        totalQuestoes: estatisticas.totalQuestoes,
        acertos: estatisticas.acertos,
        erros: estatisticas.erros,
        porDisciplina: estatisticas.porDisciplina,
        porAssunto: estatisticas.porAssunto,
        historico: estatisticas.historico,
        sequenciaDias: estatisticas.sequenciaDias,
        maiorSequencia: estatisticas.maiorSequencia,
        diasEstudados: estatisticas.diasEstudados,
        conquistas: estatisticas.conquistas,
        dataProva: data.configuracoes.dataProva,
        nomeConcurso: data.configuracoes.nomeConcurso,
        simulados: data.simulados,
        cadernoErros: data.cadernoErros,
        disciplinas: disciplinas.map(d => d.nome),
      };

      const conteudo = await gerarAnalisePreditiva(dadosParaIA, apiKey);
      
      const novaAnalise = {
        conteudo,
        totalQuestoes: estatisticas.totalQuestoes,
        acertos: estatisticas.acertos,
        taxaAcerto: totalQuestoes > 0 ? ((estatisticas.acertos / totalQuestoes) * 100).toFixed(1) : 0,
        sequenciaDias: estatisticas.sequenciaDias || 0,
        totalSimulados: (data.simulados || []).length,
      };

      salvarAnalise(novaAnalise);
      setAnaliseAtual(novaAnalise);
    } catch (err) {
      setError(`Erro ao gerar análise: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderiza markdown
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // H2
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} style={{ 
            fontSize: '20px', 
            fontWeight: 800, 
            marginTop: '28px', 
            marginBottom: '14px',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--border-color)',
            color: 'var(--accent-blue)',
          }}>
            {line.replace('## ', '')}
          </h2>
        );
      }
      // H3
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            marginTop: '20px', 
            marginBottom: '10px',
            color: 'var(--accent-purple)',
          }}>
            {line.replace('### ', '')}
          </h3>
        );
      }
      // H1
      if (line.startsWith('# ')) {
        return (
          <h1 key={i} style={{ 
            fontSize: '26px', 
            fontWeight: 900, 
            marginTop: '32px', 
            marginBottom: '16px',
          }}>
            {line.replace('# ', '')}
          </h1>
        );
      }
      // Lista com -
      if (line.match(/^\s*-\s/)) {
        return (
          <li key={i} style={{ 
            marginLeft: '24px', 
            marginBottom: '6px', 
            lineHeight: '1.7',
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}>
            {renderBold(line.replace(/^\s*-\s/, ''))}
          </li>
        );
      }
      // Lista numerada
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={i} style={{ 
            marginLeft: '24px', 
            marginBottom: '6px', 
            lineHeight: '1.7',
            fontSize: '14px',
            listStyleType: 'decimal',
            color: 'var(--text-secondary)',
          }}>
            {renderBold(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      // Linha vazia
      if (line.trim() === '') {
        return <div key={i} style={{ height: '8px' }} />;
      }
      // Parágrafo
      return (
        <p key={i} style={{ 
          marginBottom: '10px', 
          lineHeight: '1.7',
          fontSize: '14px',
          color: 'var(--text-secondary)',
        }}>
          {renderBold(line)}
        </p>
      );
    });
  };

  const renderBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Análise atual pra visualizar (a que acabou de gerar ou a selecionada)
  const analiseParaMostrar = analiseAtual || analiseVisualizando;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
            🤖 Análise Preditiva com IA
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Seu coach pessoal de estudos analisa TODOS seus dados e te dá um plano personalizado
          </p>
        </div>
      </div>

      {/* CARD DE ESTATÍSTICAS DOS DADOS DISPONÍVEIS */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '15px' }}>
          📊 Dados disponíveis para análise:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            padding: '14px',
            background: totalQuestoes >= 10 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            borderRadius: '10px',
            border: `1px solid ${totalQuestoes >= 10 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: totalQuestoes >= 10 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {totalQuestoes}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Questões</div>
            <div style={{ fontSize: '10px', marginTop: '2px', color: totalQuestoes >= 10 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {totalQuestoes >= 10 ? '✓ Suficiente' : `Faltam ${10 - totalQuestoes}`}
            </div>
          </div>
          <div style={{ padding: '14px', background: 'rgba(79,125,249,0.06)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)' }}>
              {(data.simulados || []).length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Simulados</div>
          </div>
          <div style={{ padding: '14px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-purple)' }}>
              {(data.cadernoErros || []).length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Erros</div>
          </div>
          <div style={{ padding: '14px', background: 'rgba(245,158,11,0.06)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-orange)' }}>
              {disciplinas.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Disciplinas</div>
          </div>
          <div style={{ padding: '14px', background: 'rgba(236,72,153,0.06)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-pink)' }}>
              {estatisticas.sequenciaDias || 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Streak</div>
          </div>
          <div style={{ padding: '14px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)' }}>
              {totalQuestoes > 0 ? ((estatisticas.acertos / totalQuestoes) * 100).toFixed(0) : 0}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Taxa geral</div>
          </div>
        </div>

        {!temDadosSuficientes && (
          <div style={{
            padding: '14px 18px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px',
            fontSize: '13px',
            color: 'var(--accent-orange)',
            marginBottom: '16px',
            lineHeight: '1.6',
          }}>
            ⚠️ <strong>Dados insuficientes:</strong> Você precisa responder pelo menos <strong>10 questões</strong> para gerar uma análise significativa.
            Ainda faltam <strong>{10 - totalQuestoes}</strong> questões. Vá em <strong>Questões</strong> e comece a praticar!
          </div>
        )}

        <Button
          onClick={gerarNovaAnalise}
          loading={loading}
          disabled={loading || !temDadosSuficientes}
          size="lg"
          icon="🤖"
          style={{ width: '100%' }}
        >
          {loading 
            ? 'IA analisando seus dados... aguarde ~30 segundos'
            : '🚀 Gerar Análise Completa com IA'}
        </Button>

        {error && (
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div className="shimmer-loading" style={{ height: '16px', borderRadius: '8px', marginBottom: '6px' }} />
            <div className="shimmer-loading" style={{ height: '16px', borderRadius: '8px', width: '80%', margin: '0 auto 6px' }} />
            <div className="shimmer-loading" style={{ height: '16px', borderRadius: '8px', width: '60%', margin: '0 auto' }} />
            <p style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
              🧠 A IA está estudando seu perfil e criando recomendações personalizadas...
            </p>
          </div>
        )}
      </Card>

      {/* ANÁLISE ATUAL (recém-gerada ou selecionada) */}
      {analiseParaMostrar && (
        <Card style={{ padding: '32px', marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                🎯 Análise Personalizada
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {analiseParaMostrar.data && new Date(analiseParaMostrar.data).toLocaleString('pt-BR')}
                {' • '}
                Baseada em <strong style={{ color: 'var(--accent-blue)' }}>{analiseParaMostrar.totalQuestoes}</strong> questões
                {' • '}
                Taxa: <strong style={{ color: 'var(--accent-green)' }}>{analiseParaMostrar.taxaAcerto}%</strong>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setAnaliseAtual(null); setAnaliseVisualizando(null); }}>
              ✕ Fechar
            </Button>
          </div>

          <div style={{ 
            maxWidth: '900px',
            fontSize: '14px',
            lineHeight: '1.7',
          }}>
            {renderMarkdown(analiseParaMostrar.conteudo)}
          </div>
        </Card>
      )}

      {/* HISTÓRICO DE ANÁLISES */}
      {analises.length > 0 && !analiseParaMostrar && (
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '16px' }}>
            📜 Histórico de Análises ({analises.length})
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[...analises].reverse().map(a => (
              <Card 
                key={a.id} 
                style={{ padding: '20px', cursor: 'pointer' }}
                onClick={() => setAnaliseVisualizando(a)}
                glow
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '36px' }}>🤖</div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                        Análise de {new Date(a.data).toLocaleDateString('pt-BR')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span>📅 {new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>📊 {a.totalQuestoes} questões</span>
                        <span style={{ color: 'var(--accent-green)' }}>✅ {a.taxaAcerto}%</span>
                        <span style={{ color: 'var(--accent-red)' }}>🔥 {a.sequenciaDias}d</span>
                        <span style={{ color: 'var(--accent-orange)' }}>🎯 {a.totalSimulados} simulados</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); setAnaliseVisualizando(a); }}
                    >
                      👁️ Ver análise
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (window.confirm('Remover essa análise?')) removerAnalise(a.id); 
                      }}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Vazio */}
      {analises.length === 0 && !analiseParaMostrar && !loading && (
        <Card style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '20px' }}>
            Sua primeira análise está a um clique de distância!
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
            A IA vai analisar TODOS seus dados de estudo e criar um relatório completo personalizado, 
            com previsão de nota, pontos fortes/fracos, plano de ação semanal e muito mais!
          </p>
          {!temDadosSuficientes && (
            <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--accent-orange)' }}>
              💡 Responda pelo menos <strong>10 questões</strong> primeiro para gerar uma análise precisa!
            </p>
          )}
        </Card>
      )}

      {/* DICA */}
      <div style={{
        marginTop: '24px',
        padding: '14px 18px',
        background: 'rgba(139,92,246,0.06)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '10px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.6',
      }}>
        💡 <strong style={{ color: 'var(--accent-purple)' }}>Dica:</strong> Gere uma nova análise <strong>a cada 1-2 semanas</strong> para acompanhar sua evolução. 
        Compare com análises anteriores para ver como você melhorou! Quanto mais dados você tem (simulados, questões, etc.), mais precisa e útil será a análise.
      </div>
    </div>
  );
}