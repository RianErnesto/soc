import React, { useState, useEffect } from 'react';

export default function ContagemRegressiva({ dataProva, compacta = false }) {
  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0, total: 0 });

  useEffect(() => {
    if (!dataProva) return;

    const calcular = () => {
      const agora = new Date();
      const prova = new Date(dataProva);
      const diff = prova - agora;

      if (diff < 0) {
        setTempo({ dias: 0, horas: 0, minutos: 0, segundos: 0, total: 0, passou: true });
        return;
      }

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);

      setTempo({ dias, horas, minutos, segundos, total: diff, passou: false });
    };

    calcular();
    const intervalo = setInterval(calcular, 1000);
    return () => clearInterval(intervalo);
  }, [dataProva]);

  // Define cor conforme urgência
  const getCor = () => {
    if (tempo.passou) return 'var(--accent-green)';
    if (tempo.dias <= 7) return 'var(--accent-red)';
    if (tempo.dias <= 30) return 'var(--accent-orange)';
    if (tempo.dias <= 90) return 'var(--accent-purple)';
    return 'var(--accent-blue)';
  };

  const cor = getCor();

  if (tempo.passou) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: cor,
        fontSize: '18px',
        fontWeight: 700,
      }}>
        🎉 A prova já aconteceu! Torcemos pela aprovação! 🎓
      </div>
    );
  }

  // Versão compacta
  if (compacta) {
    return (
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center',
        color: cor,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ fontSize: '20px' }}>{tempo.dias <= 7 ? '🚨' : tempo.dias <= 30 ? '⏰' : '📅'}</span>
        <span style={{ fontSize: '18px' }}>
          {tempo.dias}d {String(tempo.horas).padStart(2, '0')}h {String(tempo.minutos).padStart(2, '0')}m
        </span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: `linear-gradient(135deg, ${cor}15, transparent)`,
      border: `2px solid ${cor}`,
      borderRadius: '16px',
      animation: tempo.dias <= 7 ? 'pulse-glow 2s infinite' : 'none',
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '12px',
        textAlign: 'center',
      }}>
        {[
          { valor: tempo.dias, label: 'Dias', destaque: true },
          { valor: tempo.horas, label: 'Horas' },
          { valor: tempo.minutos, label: 'Minutos' },
          { valor: tempo.segundos, label: 'Segundos' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '16px 8px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            border: item.destaque ? `2px solid ${cor}` : '1px solid var(--border-color)',
          }}>
            <div style={{ 
              fontSize: item.destaque ? '48px' : '32px', 
              fontWeight: 900, 
              color: item.destaque ? cor : 'var(--text-primary)',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {String(item.valor).padStart(2, '0')}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              marginTop: '6px', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              fontWeight: 700,
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}