import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';

const MODOS = {
  foco: { nome: 'Foco', tempo: 25, cor: '#ef4444', icone: '🎯', gradiente: 'linear-gradient(135deg, #ef4444, #f59e0b)' },
  pausaCurta: { nome: 'Pausa Curta', tempo: 5, cor: '#10b981', icone: '☕', gradiente: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  pausaLonga: { nome: 'Pausa Longa', tempo: 15, cor: '#8b5cf6', icone: '🌴', gradiente: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
};

export default function PomodoroTimer() {
  const { data, registrarPomodoro } = useData();
  
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState('foco');
  const [tempoRestante, setTempoRestante] = useState(25 * 60);
  const [rodando, setRodando] = useState(false);
  const [tempoPersonalizado, setTempoPersonalizado] = useState(25);
  const [usaCustom, setUsaCustom] = useState(false);
  const [ciclos, setCiclos] = useState(0);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Cria áudio de notificação (beep)
  useEffect(() => {
    // Usa a Web Audio API pra criar um beep suave
    const criarBeep = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        // Segundo beep
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1000;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.3, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.5);
        }, 300);
      } catch (e) {
        console.log('Áudio bloqueado pelo navegador');
      }
    };
    audioRef.current = criarBeep;
  }, []);

  // Notificação visual do navegador
  const notificar = useCallback((titulo, mensagem) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(titulo, { body: mensagem, icon: '🍅' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
    if (audioRef.current) audioRef.current();
  }, []);

  const finalizarTimer = useCallback(() => {
    setRodando(false);
    const modoAtual = MODOS[modo];
    const minutosDoTimer = usaCustom ? tempoPersonalizado : modoAtual.tempo;
    
    if (modo === 'foco') {
      registrarPomodoro(minutosDoTimer);
      const novoCiclo = ciclos + 1;
      setCiclos(novoCiclo);
      notificar('🎉 Pomodoro concluído!', `Você focou por ${minutosDoTimer} minutos! Hora da pausa.`);
      
      // Sugere pausa
      if (novoCiclo % 4 === 0) {
        setModo('pausaLonga');
        setTempoRestante(15 * 60);
      } else {
        setModo('pausaCurta');
        setTempoRestante(5 * 60);
      }
    } else {
      notificar('☕ Pausa concluída!', 'Hora de voltar ao foco!');
      setModo('foco');
      setTempoRestante((usaCustom ? tempoPersonalizado : 25) * 60);
    }
  }, [modo, ciclos, usaCustom, tempoPersonalizado, notificar, registrarPomodoro]);

  // Cronômetro
  useEffect(() => {
    if (rodando && tempoRestante > 0) {
      intervalRef.current = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            finalizarTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [rodando, tempoRestante, finalizarTimer]);

  const iniciar = () => {
    // Pede permissão para notificações no primeiro uso
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setRodando(true);
  };

  const pausar = () => setRodando(false);

  const resetar = () => {
    setRodando(false);
    const tempo = usaCustom ? tempoPersonalizado : MODOS[modo].tempo;
    setTempoRestante(tempo * 60);
  };

  const trocarModo = (novoModo) => {
    setRodando(false);
    setModo(novoModo);
    setUsaCustom(false);
    setTempoRestante(MODOS[novoModo].tempo * 60);
  };

  const aplicarCustom = () => {
    setRodando(false);
    setUsaCustom(true);
    setTempoRestante(tempoPersonalizado * 60);
    setMostrarConfig(false);
  };

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  const modoAtual = MODOS[modo];
  const tempoTotal = (usaCustom ? tempoPersonalizado : modoAtual.tempo) * 60;
  const percentual = ((tempoTotal - tempoRestante) / tempoTotal) * 100;
  
  // Pomodoros de hoje
  const hoje = new Date().toISOString().split('T')[0];
  const pomodorosHoje = data.estatisticas?.pomodoros?.[hoje] || { total: 0, minutos: 0 };

  // Modo minimizado (só o botão flutuante)
  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: rodando ? '160px' : '60px',
          height: '60px',
          borderRadius: '30px',
          background: modoAtual.gradiente,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          animation: rodando && tempoRestante <= 60 ? 'pulse-glow 1s infinite' : 'none',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 700,
          padding: rodando ? '0 16px' : '0',
        }}
        title="Abrir Pomodoro"
      >
        <span style={{ fontSize: '24px' }}>{modoAtual.icone}</span>
        {rodando && (
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatarTempo(tempoRestante)}
          </span>
        )}
      </button>
    );
  }

  // Modo expandido (painel completo)
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '320px',
        background: 'var(--bg-secondary)',
        borderRadius: '20px',
        border: `2px solid ${modoAtual.cor}`,
        boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 30px ${modoAtual.cor}30`,
        zIndex: 999,
        overflow: 'hidden',
        animation: 'slideInUp 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        background: modoAtual.gradiente,
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🍅</span>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Pomodoro Timer</span>
        </div>
        <button
          onClick={() => setAberto(false)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
          }}
          title="Minimizar"
        >
          —
        </button>
      </div>

      {/* Modos */}
      <div style={{ padding: '14px', display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)' }}>
        {Object.entries(MODOS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => trocarModo(key)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: '8px',
              border: `1px solid ${modo === key && !usaCustom ? val.cor : 'var(--border-color)'}`,
              background: modo === key && !usaCustom ? `${val.cor}20` : 'transparent',
              color: modo === key && !usaCustom ? val.cor : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '2px' }}>{val.icone}</div>
            <div>{val.nome}</div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>{val.tempo}min</div>
          </button>
        ))}
      </div>

      {/* Display do tempo */}
      <div style={{
        padding: '30px 20px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Círculo de progresso SVG */}
        <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke={modoAtual.cor}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - percentual / 100)}`}
              style={{ 
                transition: 'stroke-dashoffset 1s linear',
                filter: `drop-shadow(0 0 8px ${modoAtual.cor}60)`,
              }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>{modoAtual.icone}</div>
            <div style={{ 
              fontSize: '40px', 
              fontWeight: 900, 
              color: tempoRestante <= 60 ? 'var(--accent-red)' : 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              animation: tempoRestante <= 60 && rodando ? 'pulse-glow 1s infinite' : 'none',
            }}>
              {formatarTempo(tempoRestante)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {usaCustom ? `${tempoPersonalizado}min` : modoAtual.nome}
            </div>
          </div>
        </div>
      </div>

      {/* Botões de controle */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px' }}>
        {!rodando ? (
          <button
            onClick={iniciar}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: modoAtual.gradiente,
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            ▶️ Iniciar
          </button>
        ) : (
          <button
            onClick={pausar}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '10px',
              border: `1px solid ${modoAtual.cor}`,
              background: 'transparent',
              color: modoAtual.cor,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            ⏸️ Pausar
          </button>
        )}
        <button
          onClick={resetar}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 700,
          }}
          title="Resetar"
        >
          🔄
        </button>
        <button
          onClick={() => setMostrarConfig(!mostrarConfig)}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: mostrarConfig ? 'rgba(255,255,255,0.05)' : 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 700,
          }}
          title="Configurar tempo"
        >
          ⚙️
        </button>
      </div>

      {/* Configuração custom */}
      {mostrarConfig && (
        <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
            ⚙️ Tempo personalizado (minutos):
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              min="1"
              max="120"
              value={tempoPersonalizado}
              onChange={e => setTempoPersonalizado(Number(e.target.value))}
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
            <button
              onClick={aplicarCustom}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--gradient-1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              Aplicar
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Ex: 45 min para sessão longa de estudo
          </div>
        </div>
      )}

      {/* Estatísticas do dia */}
      <div style={{ 
        padding: '12px 20px 16px', 
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>🍅 Hoje: </span>
            <strong style={{ color: 'var(--accent-orange)' }}>{pomodorosHoje.total}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>⏱️ Tempo: </span>
            <strong style={{ color: 'var(--accent-blue)' }}>
              {Math.floor(pomodorosHoje.minutos / 60)}h {pomodorosHoje.minutos % 60}min
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>🔥 Ciclo: </span>
            <strong style={{ color: 'var(--accent-red)' }}>{ciclos}</strong>
          </div>
        </div>
        {ciclos > 0 && ciclos % 4 === 0 && modo === 'pausaLonga' && (
          <div style={{ 
            marginTop: '10px',
            padding: '8px 10px',
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid var(--accent-purple)',
            borderRadius: '8px',
            fontSize: '11px',
            color: 'var(--accent-purple)',
            textAlign: 'center',
            fontWeight: 700,
          }}>
            🎉 4 pomodoros completos! Aproveite a pausa longa!
          </div>
        )}
      </div>
    </div>
  );
}