import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { TEMAS, FONTES, TAMANHOS, ESTILOS_CARDS, BACKGROUND_PATTERNS } from '../utils/temas';

export default function Personalizacao() {
  const { data, updateConfiguracoes } = useData();
  const config = data.configuracoes;
  
  const [temaAtivo, setTemaAtivo] = useState(config.tema || 'roxo-noturno');
  const [modoTema, setModoTema] = useState(config.modoTema || 'escuro');
  const [fonteAtiva, setFonteAtiva] = useState(config.fonte || 'Inter');
  const [tamanhoAtivo, setTamanhoAtivo] = useState(config.tamanhoTexto || 'normal');
  const [estiloAtivo, setEstiloAtivo] = useState(config.estiloCards || 'arredondado');
  const [pattern, setPattern] = useState(config.backgroundPattern || 'aurora');
  const [animacoes, setAnimacoes] = useState(config.animacoes !== false);
  const [salvo, setSalvo] = useState(false);
  const [corCustom, setCorCustom] = useState(config.corPersonalizada || null);
  const [modoCustom, setModoCustom] = useState(false);

  // Aplica em tempo real (preview)
  const aplicarPreview = (novasConfigs) => {
    updateConfiguracoes(novasConfigs);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  };

  const handleTema = (id) => {
    setTemaAtivo(id);
    setCorCustom(null);
    setModoCustom(false);
    aplicarPreview({ tema: id, corPersonalizada: null });
  };

  const handleModo = (m) => {
    setModoTema(m);
    aplicarPreview({ modoTema: m });
  };

  const handleFonte = (f) => {
    setFonteAtiva(f);
    aplicarPreview({ fonte: f });
  };

  const handleTamanho = (t) => {
    setTamanhoAtivo(t);
    aplicarPreview({ tamanhoTexto: t });
  };

  const handleEstilo = (e) => {
    setEstiloAtivo(e);
    aplicarPreview({ estiloCards: e });
  };

  const handlePattern = (p) => {
    setPattern(p);
    aplicarPreview({ backgroundPattern: p });
  };

  const handleAnimacoes = (a) => {
    setAnimacoes(a);
    aplicarPreview({ animacoes: a });
  };

  const handleCorCustom = (nome, cor) => {
    const temaBase = TEMAS[temaAtivo].cores;
    const novasCores = { ...(corCustom || temaBase), [nome]: cor };
    setCorCustom(novasCores);
    aplicarPreview({ corPersonalizada: novasCores });
  };

  const resetarPadrao = () => {
    if (window.confirm('Deseja resetar todas as personalizações para o padrão?')) {
      const padrao = {
        tema: 'roxo-noturno',
        modoTema: 'escuro',
        fonte: 'Inter',
        tamanhoTexto: 'normal',
        estiloCards: 'arredondado',
        backgroundPattern: 'aurora',
        animacoes: true,
        corPersonalizada: null,
      };
      setTemaAtivo(padrao.tema);
      setModoTema(padrao.modoTema);
      setFonteAtiva(padrao.fonte);
      setTamanhoAtivo(padrao.tamanhoTexto);
      setEstiloAtivo(padrao.estiloCards);
      setPattern(padrao.backgroundPattern);
      setAnimacoes(padrao.animacoes);
      setCorCustom(null);
      setModoCustom(false);
      aplicarPreview(padrao);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
            🎨 Personalização Visual
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Deixe seu StudyPower do jeitinho que você mais gosta! Mudanças aplicam em tempo real.
          </p>
        </div>
        {salvo && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid var(--accent-green)',
            borderRadius: '10px',
            color: 'var(--accent-green)',
            fontSize: '13px',
            fontWeight: 700,
            animation: 'slideInUp 0.3s ease',
          }}>
            ✅ Aplicado!
          </div>
        )}
      </div>

      {/* MODO CLARO/ESCURO/AUTO */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '16px' }}>
          🌓 Modo de Aparência
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Escolha se prefere o modo claro, escuro ou que se ajuste automaticamente conforme o horário do dia
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { id: 'escuro', nome: 'Escuro', icone: '🌙', desc: 'Menos cansativo à noite' },
            { id: 'claro', nome: 'Claro', icone: '☀️', desc: 'Ideal para dia claro' },
            { id: 'auto', nome: 'Automático', icone: '🌗', desc: 'Muda conforme a hora' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => handleModo(m.id)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${modoTema === m.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                background: modoTema === m.id ? 'rgba(79,125,249,0.12)' : 'transparent',
                color: modoTema === m.id ? 'var(--accent-blue)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                fontWeight: 600,
              }}
              onMouseOver={e => { if (modoTema !== m.id) e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
              onMouseOut={e => { if (modoTema !== m.id) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>{m.icone}</div>
              <div style={{ fontSize: '14px', marginBottom: '2px' }}>{m.nome}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* TEMAS DE CORES */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '16px' }}>
            🎨 Temas de Cores
          </h3>
          <Button 
            variant={modoCustom ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setModoCustom(!modoCustom)}
          >
            {modoCustom ? '✅ Modo Custom Ativo' : '🎯 Criar meu próprio'}
          </Button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Escolha entre 8 temas cuidadosamente selecionados ou crie o seu próprio
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {Object.entries(TEMAS).map(([id, tema]) => (
            <button
              key={id}
              onClick={() => handleTema(id)}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: `2px solid ${temaAtivo === id && !modoCustom ? tema.cores.primary : 'var(--border-color)'}`,
                background: `linear-gradient(135deg, ${tema.cores.primary}15, ${tema.cores.secondary}15)`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseOver={e => { 
                if (temaAtivo !== id) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${tema.cores.primary}30`;
                }
              }}
              onMouseOut={e => { 
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {temaAtivo === id && !modoCustom && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: tema.cores.primary,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}>✓</div>
              )}
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{tema.icone}</div>
              <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '14px' }}>{tema.nome}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>{tema.descricao}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {Object.values(tema.cores).slice(0, 6).map((cor, i) => (
                  <div key={i} style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    background: cor,
                    border: '2px solid rgba(255,255,255,0.1)',
                  }} />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Modo Custom - Editor de Cores */}
        {modoCustom && (
          <div style={{ 
            marginTop: '20px', 
            padding: '20px', 
            background: 'rgba(139,92,246,0.05)', 
            border: '1px solid rgba(139,92,246,0.3)', 
            borderRadius: '12px',
          }}>
            <h4 style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--accent-purple)' }}>
              🎯 Personalizar Cada Cor:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { chave: 'primary', nome: 'Primária', icone: '🔵' },
                { chave: 'secondary', nome: 'Secundária', icone: '🟣' },
                { chave: 'accent', nome: 'Destaque', icone: '💗' },
                { chave: 'success', nome: 'Sucesso', icone: '🟢' },
                { chave: 'warning', nome: 'Aviso', icone: '🟠' },
                { chave: 'danger', nome: 'Erro', icone: '🔴' },
              ].map(item => {
                const corAtual = (corCustom || TEMAS[temaAtivo].cores)[item.chave];
                return (
                  <div key={item.chave} style={{ 
                    padding: '12px', 
                    background: 'var(--bg-primary)', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <span style={{ fontSize: '20px' }}>{item.icone}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{item.nome}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{corAtual}</div>
                    </div>
                    <input
                      type="color"
                      value={corAtual}
                      onChange={e => handleCorCustom(item.chave, e.target.value)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: '2px solid var(--border-color)',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* FONTES */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '16px' }}>
          ✍️ Fonte da Interface
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Escolha a família tipográfica que mais te agrada
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {FONTES.map(f => (
            <button
              key={f.valor}
              onClick={() => handleFonte(f.valor)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${fonteAtiva === f.valor ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                background: fonteAtiva === f.valor ? 'rgba(79,125,249,0.08)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ 
                fontFamily: `'${f.valor}', sans-serif`, 
                fontSize: '24px', 
                fontWeight: 700, 
                marginBottom: '4px',
                color: fonteAtiva === f.valor ? 'var(--accent-blue)' : 'var(--text-primary)',
              }}>
                {f.exemplo}
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>{f.nome}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.descricao}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* TAMANHO DO TEXTO */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '16px' }}>
          📏 Tamanho do Texto
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Ajuste conforme sua preferência de leitura
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {Object.entries(TAMANHOS).map(([id, t]) => (
            <button
              key={id}
              onClick={() => handleTamanho(id)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${tamanhoAtivo === id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                background: tamanhoAtivo === id ? 'rgba(79,125,249,0.08)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ 
                fontSize: `${18 * t.escala}px`, 
                fontWeight: 700, 
                marginBottom: '6px',
                color: tamanhoAtivo === id ? 'var(--accent-blue)' : 'var(--text-primary)',
              }}>
                Aa
              </div>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{t.nome}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.descricao}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* ESTILO DE CARDS */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '16px' }}>
          🎭 Estilo dos Cards
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Bordas mais ou menos arredondadas
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {Object.entries(ESTILOS_CARDS).map(([id, e]) => (
            <button
              key={id}
              onClick={() => handleEstilo(id)}
              style={{
                padding: '16px',
                borderRadius: e.borderRadius,
                border: `2px solid ${estiloAtivo === id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                background: estiloAtivo === id ? 'rgba(79,125,249,0.08)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{e.icone}</div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{e.nome}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* BACKGROUND PATTERNS */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '16px' }}>
          🖼️ Padrão do Fundo
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Escolha o efeito visual do plano de fundo
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {Object.entries(BACKGROUND_PATTERNS).map(([id, p]) => (
            <button
              key={id}
              onClick={() => handlePattern(id)}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `2px solid ${pattern === id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                background: pattern === id ? 'rgba(79,125,249,0.08)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>{p.icone}</div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{p.nome}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* ANIMAÇÕES */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '16px' }}>
          ✨ Animações e Efeitos
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Desative se preferir uma experiência mais estática ou tiver dispositivo mais lento
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <button
            onClick={() => handleAnimacoes(true)}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: `2px solid ${animacoes ? 'var(--accent-green)' : 'var(--border-color)'}`,
              background: animacoes ? 'rgba(16,185,129,0.08)' : 'transparent',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>✨</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: animacoes ? 'var(--accent-green)' : 'var(--text-primary)' }}>
              Ligadas
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Experiência completa
            </div>
          </button>
          <button
            onClick={() => handleAnimacoes(false)}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: `2px solid ${!animacoes ? 'var(--accent-orange)' : 'var(--border-color)'}`,
              background: !animacoes ? 'rgba(245,158,11,0.08)' : 'transparent',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>⏸️</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: !animacoes ? 'var(--accent-orange)' : 'var(--text-primary)' }}>
              Desligadas
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Mais performance
            </div>
          </button>
        </div>
      </Card>

      {/* PREVIEW */}
      <Card style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '16px' }}>
          👁️ Preview das Alterações
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{
            padding: '20px',
            background: 'var(--gradient-1)',
            borderRadius: 'var(--card-radius)',
            color: '#fff',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>🎯</div>
            <div style={{ fontWeight: 700 }}>Botão Primário</div>
          </div>
          <div style={{
            padding: '20px',
            background: 'var(--accent-green)',
            borderRadius: 'var(--card-radius)',
            color: '#fff',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>✅</div>
            <div style={{ fontWeight: 700 }}>Sucesso</div>
          </div>
          <div style={{
            padding: '20px',
            background: 'var(--accent-red)',
            borderRadius: 'var(--card-radius)',
            color: '#fff',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>❌</div>
            <div style={{ fontWeight: 700 }}>Erro</div>
          </div>
          <div style={{
            padding: '20px',
            background: 'var(--accent-orange)',
            borderRadius: 'var(--card-radius)',
            color: '#fff',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>⚠️</div>
            <div style={{ fontWeight: 700 }}>Aviso</div>
          </div>
        </div>

        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--card-radius)',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Exemplo de texto normal na fonte selecionada
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
            🎨 Seu StudyPower do seu jeito!
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Todas as mudanças são aplicadas em tempo real
          </div>
        </div>
      </Card>

      {/* AÇÕES FINAIS */}
      <Card style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>💾 Preferências salvas automaticamente</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Suas escolhas ficam guardadas mesmo depois de fechar o navegador
            </div>
          </div>
          <Button variant="danger" onClick={resetarPadrao} icon="🔄">
            Resetar Padrão
          </Button>
        </div>
      </Card>
    </div>
  );
}