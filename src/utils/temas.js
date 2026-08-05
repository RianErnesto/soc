// 🎨 SISTEMA DE TEMAS - StudyPower

export const TEMAS = {
  'roxo-noturno': {
    nome: 'Roxo Noturno',
    icone: '🌙',
    descricao: 'Padrão elegante e sofisticado',
    cores: {
      primary: '#4f7df9',
      secondary: '#8b5cf6',
      accent: '#ec4899',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#06b6d4',
    },
  },
  'azul-oceano': {
    nome: 'Azul Oceano',
    icone: '🌊',
    descricao: 'Calmo e concentrado',
    cores: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#8b5cf6',
    },
  },
  'verde-esmeralda': {
    nome: 'Verde Esmeralda',
    icone: '🌿',
    descricao: 'Focado e produtivo',
    cores: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#06b6d4',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },
  },
  'laranja-fogo': {
    nome: 'Laranja Fogo',
    icone: '🔥',
    descricao: 'Energia e motivação',
    cores: {
      primary: '#f59e0b',
      secondary: '#ef4444',
      accent: '#ec4899',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#dc2626',
      info: '#06b6d4',
    },
  },
  'rosa-cyberpunk': {
    nome: 'Rosa Cyberpunk',
    icone: '💜',
    descricao: 'Moderno e vibrante',
    cores: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },
  },
  'grafite': {
    nome: 'Grafite Profissional',
    icone: '⚫',
    descricao: 'Minimalista e sério',
    cores: {
      primary: '#64748b',
      secondary: '#475569',
      accent: '#94a3b8',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#06b6d4',
    },
  },
  'dourado-nobre': {
    nome: 'Dourado Nobre',
    icone: '👑',
    descricao: 'Luxo e sofisticação',
    cores: {
      primary: '#eab308',
      secondary: '#f59e0b',
      accent: '#dc2626',
      success: '#10b981',
      warning: '#f97316',
      danger: '#ef4444',
      info: '#8b5cf6',
    },
  },
  'gelo-artico': {
    nome: 'Gelo Ártico',
    icone: '❄️',
    descricao: 'Clean e refrescante',
    cores: {
      primary: '#06b6d4',
      secondary: '#0ea5e9',
      accent: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },
  },
};

export const FONTES = [
  { valor: 'Inter', nome: 'Inter', descricao: 'Moderna e limpa (padrão)', exemplo: 'Aa Bb Cc 123' },
  { valor: 'Roboto', nome: 'Roboto', descricao: 'Google, muito legível', exemplo: 'Aa Bb Cc 123' },
  { valor: 'Poppins', nome: 'Poppins', descricao: 'Amigável e arredondada', exemplo: 'Aa Bb Cc 123' },
  { valor: 'Ubuntu', nome: 'Ubuntu', descricao: 'Técnica e moderna', exemplo: 'Aa Bb Cc 123' },
  { valor: 'Nunito', nome: 'Nunito', descricao: 'Suave e agradável', exemplo: 'Aa Bb Cc 123' },
];

export const TAMANHOS = {
  'compacto': { nome: 'Compacto', escala: 0.9, descricao: 'Mais informação na tela' },
  'normal': { nome: 'Normal', escala: 1.0, descricao: 'Padrão equilibrado' },
  'grande': { nome: 'Grande', escala: 1.15, descricao: 'Mais confortável para leitura' },
};

export const ESTILOS_CARDS = {
  'arredondado': { nome: 'Arredondado', icone: '🔵', borderRadius: '16px' },
  'quadrado': { nome: 'Quadrado', icone: '⬜', borderRadius: '4px' },
  'minimalista': { nome: 'Minimalista', icone: '➖', borderRadius: '8px' },
};

export const BACKGROUND_PATTERNS = {
  'aurora': {
    nome: 'Aurora',
    icone: '🌌',
    css: (cores) => `
      radial-gradient(ellipse at 20% 50%, ${cores.primary}15 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, ${cores.secondary}15 0%, transparent 50%),
      radial-gradient(ellipse at 50% 80%, ${cores.accent}10 0%, transparent 50%)
    `,
  },
  'grid': {
    nome: 'Grade',
    icone: '⚏',
    css: (cores) => `
      linear-gradient(${cores.primary}10 1px, transparent 1px),
      linear-gradient(90deg, ${cores.primary}10 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
  },
  'dots': {
    nome: 'Pontos',
    icone: '⋯',
    css: (cores) => `radial-gradient(${cores.primary}20 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
  },
  'waves': {
    nome: 'Ondas',
    icone: '〰️',
    css: (cores) => `
      radial-gradient(circle at 10% 20%, ${cores.primary}15 0%, transparent 20%),
      radial-gradient(circle at 90% 80%, ${cores.secondary}15 0%, transparent 20%),
      radial-gradient(circle at 50% 50%, ${cores.accent}08 0%, transparent 30%)
    `,
  },
  'none': {
    nome: 'Nenhum',
    icone: '⚪',
    css: () => 'none',
  },
};

// Função que aplica o tema no CSS
export function aplicarTema(configuracoes) {
  const tema = TEMAS[configuracoes.tema] || TEMAS['roxo-noturno'];
  const cores = configuracoes.corPersonalizada || tema.cores;
  const modoTema = configuracoes.modoTema || 'escuro';
  const tamanho = TAMANHOS[configuracoes.tamanhoTexto] || TAMANHOS['normal'];
  const estilo = ESTILOS_CARDS[configuracoes.estiloCards] || ESTILOS_CARDS['arredondado'];
  const pattern = BACKGROUND_PATTERNS[configuracoes.backgroundPattern] || BACKGROUND_PATTERNS['aurora'];
  const fonte = configuracoes.fonte || 'Inter';

  // Detecta modo automático
  let modoFinal = modoTema;
  if (modoTema === 'auto') {
    const hora = new Date().getHours();
    modoFinal = (hora >= 6 && hora < 18) ? 'claro' : 'escuro';
  }

  const root = document.documentElement;

  // Aplica cores principais
  root.style.setProperty('--accent-blue', cores.primary);
  root.style.setProperty('--accent-purple', cores.secondary);
  root.style.setProperty('--accent-pink', cores.accent);
  root.style.setProperty('--accent-green', cores.success);
  root.style.setProperty('--accent-orange', cores.warning);
  root.style.setProperty('--accent-red', cores.danger);
  root.style.setProperty('--accent-cyan', cores.info);

  // Gradientes
  root.style.setProperty('--gradient-1', `linear-gradient(135deg, ${cores.primary}, ${cores.secondary})`);
  root.style.setProperty('--gradient-2', `linear-gradient(135deg, ${cores.secondary}, ${cores.accent})`);
  root.style.setProperty('--gradient-3', `linear-gradient(135deg, ${cores.success}, ${cores.info})`);
  root.style.setProperty('--gradient-4', `linear-gradient(135deg, ${cores.warning}, ${cores.danger})`);

  // Modo Claro ou Escuro
  if (modoFinal === 'claro') {
    root.style.setProperty('--bg-primary', '#f8fafc');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--bg-card', '#ffffff');
    root.style.setProperty('--bg-card-hover', '#f1f5f9');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-secondary', '#475569');
    root.style.setProperty('--text-muted', '#94a3b8');
    root.style.setProperty('--border-color', '#e2e8f0');
    root.style.setProperty('--shadow-card', '0 4px 20px rgba(0, 0, 0, 0.08)');
  } else {
    root.style.setProperty('--bg-primary', '#0a0a1a');
    root.style.setProperty('--bg-secondary', '#111128');
    root.style.setProperty('--bg-card', '#16163a');
    root.style.setProperty('--bg-card-hover', '#1e1e4a');
    root.style.setProperty('--text-primary', '#f0f0ff');
    root.style.setProperty('--text-secondary', '#9999cc');
    root.style.setProperty('--text-muted', '#666699');
    root.style.setProperty('--border-color', '#2a2a5a');
    root.style.setProperty('--shadow-card', '0 4px 20px rgba(0, 0, 0, 0.3)');
  }

  // Fonte
  const fonteUrl = `https://fonts.googleapis.com/css2?family=${fonte.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
  let linkExistente = document.getElementById('fonte-dinamica');
  if (!linkExistente) {
    linkExistente = document.createElement('link');
    linkExistente.id = 'fonte-dinamica';
    linkExistente.rel = 'stylesheet';
    document.head.appendChild(linkExistente);
  }
  linkExistente.href = fonteUrl;
  document.body.style.fontFamily = `'${fonte}', sans-serif`;

  // Tamanho da fonte
  root.style.fontSize = `${16 * tamanho.escala}px`;

  // Border-radius dos cards
  root.style.setProperty('--card-radius', estilo.borderRadius);

  // Background pattern
  let styleBg = document.getElementById('bg-pattern-style');
  if (!styleBg) {
    styleBg = document.createElement('style');
    styleBg.id = 'bg-pattern-style';
    document.head.appendChild(styleBg);
  }
  styleBg.innerHTML = `
    body::before {
      background: ${pattern.css(cores)} !important;
      ${pattern.backgroundSize ? `background-size: ${pattern.backgroundSize} !important;` : ''}
    }
  `;

  // Animações
  let animStyle = document.getElementById('animacoes-style');
  if (!animStyle) {
    animStyle = document.createElement('style');
    animStyle.id = 'animacoes-style';
    document.head.appendChild(animStyle);
  }
  if (!configuracoes.animacoes) {
    animStyle.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `;
  } else {
    animStyle.innerHTML = '';
  }
}