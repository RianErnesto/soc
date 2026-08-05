import React from 'react';

const menuItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'editais', icon: '📋', label: 'Editais' },
  { id: 'provas', icon: '✍🏻', label: 'Minhas Provas' },
  { id: 'cronograma', icon: '🗓️', label: 'Cronograma' },
  { id: 'questoes', icon: '❓', label: 'Questões' },
  { id: 'simulado', icon: '🔥', label: 'Simulado' },
  { id: 'caderno', icon: '📓', label: 'Caderno de Erros' },
  { id: 'flashcards', icon: '📨', label: 'Flashcards' },
  { id: 'resumos', icon: '📝', label: 'Resumos' },
  { id: 'chat', icon: '💬', label: 'Tira-Dúvidas' },
  { id: 'desempenho', icon: '📈', label: 'Desempenho' },
  { id: 'analise', icon: '🤖', label: 'Análise IA' },
  { id: 'personalizacao', icon: '🎨', label: 'Personalização' },
  { id: 'configuracoes', icon: '⚙️', label: 'Configurações' },
];

export default function Sidebar({ active, onSelect, collapsed, onToggle }) {
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: collapsed ? '70px' : '260px',
      background: 'linear-gradient(180deg, #0d0d2b 0%, #111138 50%, #0d0d2b 100%)',
      borderRight: '1px solid var(--border-color)',
      transition: 'width 0.3s ease',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'scroll',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 10px' : '24px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: '72px',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--gradient-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>📚</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SOC
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px' }}>CONCURSOS</div>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            borderRadius: '6px',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--accent-blue)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Menu Items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: collapsed ? '12px' : '12px 16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: active === item.id
                ? 'linear-gradient(135deg, rgba(79, 125, 249, 0.2), rgba(139, 92, 246, 0.2))'
                : 'transparent',
              color: active === item.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderLeft: active === item.id ? '3px solid var(--accent-blue)' : '3px solid transparent',
              fontSize: '14px',
              fontWeight: active === item.id ? 600 : 400,
            }}
            onMouseOver={e => {
              if (active !== item.id) {
                e.currentTarget.style.background = 'rgba(79, 125, 249, 0.08)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseOut={e => {
              if (active !== item.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <span style={{ fontSize: '20px', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Sistema Operacional para Concursos v2.0 ⚡
        </div>
      )}
    </div>
  );
}