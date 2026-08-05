
import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

const STORAGE_KEY = 'concursos_dashboard_data';

const defaultData = {
  editais: [],
  cronograma: [],
  questoesRespondidas: [],
  flashcards: [],
  resumos: [],
  simulados: [],
  analises: [],
  conversas: [],
  provas: [],
  cadernoErros: [],
  configuracoes: {
    apiKey: '',
    horariosEstudo: [],
    diasEstudo: ['seg', 'ter', 'qua', 'qui', 'sex'],
    metaDiaria: 4,
    metaQuestoesDia: 20,
    metaTempoDia: 60,
    dataProva: null,
    nomeConcurso: '',
    // 🎨 NOVO: Personalização Visual
    tema: 'roxo-noturno',          // tema selecionado
    modoTema: 'escuro',            // escuro | claro | auto
    fonte: 'Inter',                // fonte principal
    tamanhoTexto: 'normal',        // compacto | normal | grande
    estiloCards: 'arredondado',    // arredondado | quadrado | minimalista
    animacoes: true,               // ligar/desligar animações
    backgroundPattern: 'aurora',   // aurora | grid | dots | waves | none
    corPersonalizada: null,        // cor customizada do usuário
  },
  estatisticas: {
    totalQuestoes: 0,
    acertos: 0,
    erros: 0,
    tempoEstudo: 0,
    diasEstudados: 0,
    sequenciaDias: 0,
    maiorSequencia: 0,
    ultimoDiaEstudado: null,
    porDisciplina: {},
    porAssunto: {},
    historico: [],
    conquistas: [],
    pomodoros: {},
  }
};

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultData, ...parsed, estatisticas: { ...defaultData.estatisticas, ...parsed.estatisticas }, configuracoes: { ...defaultData.configuracoes, ...parsed.configuracoes } };
      }
    } catch (e) { console.error('Erro ao carregar dados:', e); }
    return defaultData;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { console.error('Erro ao salvar:', e); }
  }, [data]);

  const updateData = (key, value) => {
    setData(prev => ({ ...prev, [key]: typeof value === 'function' ? value(prev[key]) : value }));
  };

  const addEdital = (edital) => {
    setData(prev => ({ ...prev, editais: [...prev.editais, { ...edital, id: Date.now(), dataCriacao: new Date().toISOString() }] }));
  };

  const removeEdital = (id) => {
    setData(prev => ({ ...prev, editais: prev.editais.filter(e => e.id !== id) }));
  };

  const getAllDisciplinas = () => {
    const map = new Map();
    data.editais.forEach(edital => {
      edital.cargos?.forEach(cargo => {
        if (cargo.selecionado) {
          cargo.disciplinas?.forEach(disc => {
            if (map.has(disc.nome)) {
              const existing = map.get(disc.nome);
              disc.assuntos?.forEach(a => {
                if (!existing.assuntos.includes(a)) existing.assuntos.push(a);
              });
            } else {
              map.set(disc.nome, { nome: disc.nome, assuntos: [...(disc.assuntos || [])], edital: edital.nome });
            }
          });
        }
      });
    });
    return Array.from(map.values());
  };

  const registrarResposta = (questao, respostaUsuario, correta) => {
    const registro = {
      id: Date.now(),
      questaoId: questao.id,
      disciplina: questao.disciplina,
      assunto: questao.assunto,
      correta,
      respostaUsuario,
      respostaCorreta: questao.respostaCorreta,
      data: new Date().toISOString(),
    };

    setData(prev => {
      const novasRespondidas = [...prev.questoesRespondidas, registro];
      const stats = { ...prev.estatisticas };
      stats.totalQuestoes = (stats.totalQuestoes || 0) + 1;
      if (correta) stats.acertos = (stats.acertos || 0) + 1;
      else stats.erros = (stats.erros || 0) + 1;

      if (!stats.porDisciplina) stats.porDisciplina = {};
      if (!stats.porDisciplina[questao.disciplina]) stats.porDisciplina[questao.disciplina] = { total: 0, acertos: 0 };
      stats.porDisciplina[questao.disciplina].total += 1;
      if (correta) stats.porDisciplina[questao.disciplina].acertos += 1;

      if (!stats.porAssunto) stats.porAssunto = {};
      const chaveAssunto = `${questao.disciplina}|${questao.assunto}`;
      if (!stats.porAssunto[chaveAssunto]) stats.porAssunto[chaveAssunto] = { total: 0, acertos: 0 };
      stats.porAssunto[chaveAssunto].total += 1;
      if (correta) stats.porAssunto[chaveAssunto].acertos += 1;

      const hoje = new Date().toISOString().split('T')[0];
      if (!stats.historico) stats.historico = [];
      const entradaHoje = stats.historico.find(h => h.data === hoje);
      if (entradaHoje) {
        entradaHoje.total += 1;
        if (correta) entradaHoje.acertos += 1;
      } else {
        stats.historico.push({ data: hoje, total: 1, acertos: correta ? 1 : 0 });
      }

      // 🎯 NOVO: Atualiza streak (ofensiva)
      const ultimoDia = stats.ultimoDiaEstudado;
      if (ultimoDia !== hoje) {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = ontem.toISOString().split('T')[0];
        
        if (ultimoDia === ontemStr) {
          // Continuou a sequência
          stats.sequenciaDias = (stats.sequenciaDias || 0) + 1;
        } else if (ultimoDia && ultimoDia !== hoje) {
          // Quebrou a sequência
          stats.sequenciaDias = 1;
        } else {
          // Primeiro dia
          stats.sequenciaDias = 1;
        }
        
        stats.ultimoDiaEstudado = hoje;
        stats.diasEstudados = (stats.diasEstudados || 0) + 1;
        
        if ((stats.sequenciaDias || 0) > (stats.maiorSequencia || 0)) {
          stats.maiorSequencia = stats.sequenciaDias;
        }
      }

      // 🎯 NOVO: Verificar conquistas
      if (!stats.conquistas) stats.conquistas = [];
      const conquistasParaAdicionar = [];
      
      const marcos = [
        { id: 'primeira_questao', condicao: stats.totalQuestoes === 1, icone: '🎯', titulo: 'Primeira Questão!', desc: 'Sua jornada começou!' },
        { id: '10_questoes', condicao: stats.totalQuestoes === 10, icone: '📝', titulo: '10 Questões', desc: 'Bom começo!' },
        { id: '50_questoes', condicao: stats.totalQuestoes === 50, icone: '📚', titulo: '50 Questões', desc: 'Você está pegando o ritmo!' },
        { id: '100_questoes', condicao: stats.totalQuestoes === 100, icone: '💯', titulo: '100 Questões!', desc: 'Centena batida!' },
        { id: '500_questoes', condicao: stats.totalQuestoes === 500, icone: '🏆', titulo: '500 Questões!', desc: 'Nível avançado!' },
        { id: '1000_questoes', condicao: stats.totalQuestoes === 1000, icone: '👑', titulo: '1000 Questões!', desc: 'Você é uma máquina!' },
        { id: 'streak_3', condicao: stats.sequenciaDias === 3, icone: '🔥', titulo: '3 dias seguidos', desc: 'Criando o hábito!' },
        { id: 'streak_7', condicao: stats.sequenciaDias === 7, icone: '⚡', titulo: '1 semana seguida!', desc: 'Uma semana de disciplina!' },
        { id: 'streak_14', condicao: stats.sequenciaDias === 14, icone: '💪', titulo: '2 semanas seguidas!', desc: 'Você é imparável!' },
        { id: 'streak_30', condicao: stats.sequenciaDias === 30, icone: '🎖️', titulo: '30 dias seguidos!', desc: 'Um MÊS de disciplina!' },
        { id: 'streak_60', condicao: stats.sequenciaDias === 60, icone: '🏅', titulo: '60 dias seguidos!', desc: 'Nível ninja!' },
        { id: 'streak_100', condicao: stats.sequenciaDias === 100, icone: '👑', titulo: '100 dias seguidos!', desc: 'LENDÁRIO!' },
        { id: 'acerto_70', condicao: stats.totalQuestoes >= 20 && (stats.acertos / stats.totalQuestoes) >= 0.7 && !stats.conquistas.find(c => c.id === 'acerto_70'), icone: '🎯', titulo: 'Taxa de 70%', desc: 'Você está no nível de aprovação!' },
        { id: 'acerto_80', condicao: stats.totalQuestoes >= 50 && (stats.acertos / stats.totalQuestoes) >= 0.8 && !stats.conquistas.find(c => c.id === 'acerto_80'), icone: '🌟', titulo: 'Taxa de 80%', desc: 'Excelente desempenho!' },
        { id: 'acerto_90', condicao: stats.totalQuestoes >= 100 && (stats.acertos / stats.totalQuestoes) >= 0.9 && !stats.conquistas.find(c => c.id === 'acerto_90'), icone: '💎', titulo: 'Taxa de 90%', desc: 'Você é fera!' },
      ];
      
      marcos.forEach(m => {
        if (m.condicao && !stats.conquistas.find(c => c.id === m.id)) {
          conquistasParaAdicionar.push({ ...m, data: new Date().toISOString() });
        }
      });
      
      stats.conquistas = [...stats.conquistas, ...conquistasParaAdicionar];

      // Caderno de Erros (código anterior)
      let cadernoAtual = prev.cadernoErros || [];
      if (!correta) {
        const jaExiste = cadernoAtual.find(e => 
          e.enunciado === questao.enunciado && e.disciplina === questao.disciplina
        );
        if (!jaExiste) {
          const novoErro = {
            id: Date.now() + Math.random(),
            enunciado: questao.enunciado,
            alternativas: questao.alternativas,
            respostaCorreta: questao.respostaCorreta,
            respostaUsuario,
            explicacao: questao.explicacao,
            segredo: questao.segredo || '',
            pegadinha: questao.pegadinha || '',
            disciplina: questao.disciplina,
            assunto: questao.assunto,
            dificuldade: questao.dificuldade || 'média',
            banca: questao.banca || 'Não informada',
            anotacao: '',
            tags: [],
            vezesErrou: 1,
            dominado: false,
            dataErro: new Date().toISOString(),
            ultimaRevisao: null,
          };
          cadernoAtual = [...cadernoAtual, novoErro];
        } else {
          cadernoAtual = cadernoAtual.map(e => 
            e.id === jaExiste.id 
              ? { ...e, vezesErrou: e.vezesErrou + 1, dataErro: new Date().toISOString() }
              : e
          );
        }
      }

      return { 
        ...prev, 
        questoesRespondidas: novasRespondidas, 
        estatisticas: stats,
        cadernoErros: cadernoAtual,
      };
    });
  };

  const addFlashcard = (card) => {
    setData(prev => ({ 
      ...prev, 
      flashcards: [...prev.flashcards, { 
        ...card, 
        id: Date.now() + Math.random(), 
        criadoEm: new Date().toISOString(), 
        // Algoritmo SM-2 (Repetição Espaçada)
        intervalo: 0,           // dias até próxima revisão
        facilidade: 2.5,        // fator de facilidade (começa em 2.5)
        repeticoes: 0,          // quantas vezes acertou seguidas
        proximaRevisao: new Date().toISOString(),
        ultimaRevisao: null,
        totalRevisoes: 0,       // total de vezes revisado
        status: 'novo',         // novo | aprendendo | dominado
      }] 
    }));
  };

    const revisarFlashcard = (id, qualidade) => {
    // qualidade: 0=errei, 3=dificil, 4=bom, 5=facil
    setData(prev => {
      const flashcards = prev.flashcards.map(card => {
        if (card.id !== id) return card;
        
        let { intervalo = 0, facilidade = 2.5, repeticoes = 0, totalRevisoes = 0 } = card;
        totalRevisoes += 1;
        
        // Algoritmo SM-2 (SuperMemo 2)
        if (qualidade < 3) {
          // Errou: reseta as repetições
          repeticoes = 0;
          intervalo = 1; // revisa amanhã
        } else {
          // Acertou: calcula próximo intervalo
          if (repeticoes === 0) {
            intervalo = 1;
          } else if (repeticoes === 1) {
            intervalo = 6;
          } else {
            intervalo = Math.round(intervalo * facilidade);
          }
          repeticoes += 1;
        }
        
        // Ajusta o fator de facilidade
        facilidade = facilidade + (0.1 - (5 - qualidade) * (0.08 + (5 - qualidade) * 0.02));
        if (facilidade < 1.3) facilidade = 1.3; // mínimo
        
        // Calcula próxima data
        const proximaData = new Date();
        proximaData.setDate(proximaData.getDate() + intervalo);
        
        // Define status
        let status = 'aprendendo';
        if (repeticoes === 0) status = 'aprendendo';
        else if (intervalo >= 21) status = 'dominado'; // após 21 dias sem errar
        else status = 'aprendendo';
        
        return {
          ...card,
          intervalo,
          facilidade,
          repeticoes,
          totalRevisoes,
          proximaRevisao: proximaData.toISOString(),
          ultimaRevisao: new Date().toISOString(),
          status,
        };
      });
      
      return { ...prev, flashcards };
    });
  };

  const removerFlashcard = (id) => {
    setData(prev => ({
      ...prev,
      flashcards: prev.flashcards.filter(f => f.id !== id),
    }));
  };

  const resetarFlashcard = (id) => {
    setData(prev => ({
      ...prev,
      flashcards: prev.flashcards.map(card => 
        card.id === id 
          ? { 
              ...card, 
              intervalo: 0, 
              facilidade: 2.5, 
              repeticoes: 0, 
              status: 'novo',
              proximaRevisao: new Date().toISOString(),
            }
          : card
      ),
    }));
  };

  const registrarPomodoro = (minutos) => {
    setData(prev => {
      const hoje = new Date().toISOString().split('T')[0];
      const stats = { ...prev.estatisticas };
      
      if (!stats.pomodoros) stats.pomodoros = {};
      if (!stats.pomodoros[hoje]) stats.pomodoros[hoje] = { total: 0, minutos: 0 };
      
      stats.pomodoros[hoje].total += 1;
      stats.pomodoros[hoje].minutos += minutos;
      stats.tempoEstudo = (stats.tempoEstudo || 0) + minutos;
      
      // Conquistas de pomodoro
      if (!stats.conquistas) stats.conquistas = [];
      const totalPomodorosHoje = stats.pomodoros[hoje].total;
      const totalPomodorosGeral = Object.values(stats.pomodoros).reduce((acc, p) => acc + p.total, 0);
      
      const marcosPomodoro = [
        { id: 'primeiro_pomodoro', condicao: totalPomodorosGeral === 1, icone: '🍅', titulo: 'Primeiro Pomodoro!', desc: '25 minutos de foco total!' },
        { id: 'pomodoro_10', condicao: totalPomodorosGeral === 10, icone: '⏰', titulo: '10 Pomodoros', desc: 'Focado como nunca!' },
        { id: 'pomodoro_50', condicao: totalPomodorosGeral === 50, icone: '⚡', titulo: '50 Pomodoros', desc: 'Máquina de foco!' },
        { id: 'pomodoro_100', condicao: totalPomodorosGeral === 100, icone: '🎯', titulo: '100 Pomodoros', desc: 'Nível ninja!' },
        { id: 'pomodoro_dia_4', condicao: totalPomodorosHoje === 4, icone: '🔥', titulo: '4 Pomodoros no dia', desc: 'Dia super produtivo!' },
        { id: 'pomodoro_dia_8', condicao: totalPomodorosHoje === 8, icone: '💎', titulo: '8 Pomodoros no dia', desc: 'Dia LEGENDÁRIO!' },
      ];
      
      marcosPomodoro.forEach(m => {
        if (m.condicao && !stats.conquistas.find(c => c.id === m.id)) {
          stats.conquistas = [...stats.conquistas, { ...m, data: new Date().toISOString() }];
        }
      });
      
      return { ...prev, estatisticas: stats };
    });
  };

  const addResumo = (resumo) => {
    setData(prev => ({ ...prev, resumos: [...prev.resumos, { ...resumo, id: Date.now(), criadoEm: new Date().toISOString() }] }));
  };

  const updateCronograma = (novoCronograma) => {
    setData(prev => ({ ...prev, cronograma: novoCronograma }));
  };

  const toggleCronogramaItem = (diaIndex, slotIndex) => {
    setData(prev => {
      const novo = [...prev.cronograma];
      if (novo[diaIndex] && novo[diaIndex].slots[slotIndex]) {
        novo[diaIndex].slots[slotIndex].concluido = !novo[diaIndex].slots[slotIndex].concluido;
      }
      return { ...prev, cronograma: novo };
    });
  };

  const updateConfiguracoes = (novasConfig) => {
    setData(prev => ({ ...prev, configuracoes: { ...prev.configuracoes, ...novasConfig } }));
  };

    const salvarSimulado = (simulado) => {
    setData(prev => ({ 
      ...prev, 
      simulados: [...(prev.simulados || []), { 
        ...simulado, 
        id: Date.now(), 
        data: new Date().toISOString() 
      }] 
    }));
  };

    const atualizarErroCaderno = (id, atualizacoes) => {
    setData(prev => ({
      ...prev,
      cadernoErros: (prev.cadernoErros || []).map(e => 
        e.id === id ? { ...e, ...atualizacoes } : e
      ),
    }));
  };

  const marcarErroDominado = (id) => {
    setData(prev => ({
      ...prev,
      cadernoErros: (prev.cadernoErros || []).map(e => 
        e.id === id ? { ...e, dominado: true, ultimaRevisao: new Date().toISOString() } : e
      ),
    }));
  };

  const removerErroCaderno = (id) => {
    setData(prev => ({
      ...prev,
      cadernoErros: (prev.cadernoErros || []).filter(e => e.id !== id),
    }));
  };

  const limparDominados = () => {
    setData(prev => ({
      ...prev,
      cadernoErros: (prev.cadernoErros || []).filter(e => !e.dominado),
    }));
  };

  const salvarAnalise = (analise) => {
    setData(prev => ({
      ...prev,
      analises: [...(prev.analises || []), {
        ...analise,
        id: Date.now(),
        data: new Date().toISOString(),
      }],
    }));
  };

  const removerAnalise = (id) => {
    setData(prev => ({
      ...prev,
      analises: (prev.analises || []).filter(a => a.id !== id),
    }));
  };

  const criarConversa = (titulo, disciplina, assunto) => {
    const novaConversa = {
      id: Date.now(),
      titulo: titulo || 'Nova Conversa',
      disciplina: disciplina || '',
      assunto: assunto || '',
      mensagens: [],
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      conversas: [...(prev.conversas || []), novaConversa],
    }));
    return novaConversa.id;
  };

  const adicionarMensagem = (conversaId, mensagem) => {
    setData(prev => ({
      ...prev,
      conversas: (prev.conversas || []).map(c => 
        c.id === conversaId 
          ? { 
              ...c, 
              mensagens: [...c.mensagens, { 
                id: Date.now() + Math.random(),
                ...mensagem,
                timestamp: new Date().toISOString(),
              }],
              atualizadoEm: new Date().toISOString(),
            }
          : c
      ),
    }));
  };

  const atualizarConversa = (conversaId, atualizacoes) => {
    setData(prev => ({
      ...prev,
      conversas: (prev.conversas || []).map(c => 
        c.id === conversaId ? { ...c, ...atualizacoes } : c
      ),
    }));
  };

  const removerConversa = (conversaId) => {
    setData(prev => ({
      ...prev,
      conversas: (prev.conversas || []).filter(c => c.id !== conversaId),
    }));
  };

  const marcarMensagem = (conversaId, mensagemId) => {
    setData(prev => ({
      ...prev,
      conversas: (prev.conversas || []).map(c => 
        c.id === conversaId 
          ? {
              ...c,
              mensagens: c.mensagens.map(m => 
                m.id === mensagemId ? { ...m, marcada: !m.marcada } : m
              ),
            }
          : c
      ),
    }));
  };

    const adicionarProva = (prova) => {
    setData(prev => ({
      ...prev,
      provas: [...(prev.provas || []), {
        id: Date.now(),
        criadaEm: new Date().toISOString(),
        favorita: !prev.provas?.length, // Primeira prova vira favorita automaticamente
        checklist: [],
        anotacoes: '',
        ...prova,
      }],
    }));
  };

  const atualizarProva = (id, atualizacoes) => {
    setData(prev => ({
      ...prev,
      provas: (prev.provas || []).map(p => 
        p.id === id ? { ...p, ...atualizacoes } : p
      ),
    }));
  };

  const removerProva = (id) => {
    setData(prev => ({
      ...prev,
      provas: (prev.provas || []).filter(p => p.id !== id),
    }));
  };

  const favoritarProva = (id) => {
    setData(prev => ({
      ...prev,
      provas: (prev.provas || []).map(p => ({
        ...p,
        favorita: p.id === id,
      })),
    }));
  };

  const adicionarItemChecklist = (provaId, item) => {
    setData(prev => ({
      ...prev,
      provas: (prev.provas || []).map(p => 
        p.id === provaId 
          ? { 
              ...p, 
              checklist: [...(p.checklist || []), { 
                id: Date.now() + Math.random(), 
                texto: item, 
                concluido: false,
                criadoEm: new Date().toISOString(),
              }]
            }
          : p
      ),
    }));
  };

  const toggleChecklistItem = (provaId, itemId) => {
    setData(prev => ({
      ...prev,
      provas: (prev.provas || []).map(p => 
        p.id === provaId 
          ? { 
              ...p, 
              checklist: (p.checklist || []).map(i => 
                i.id === itemId ? { ...i, concluido: !i.concluido } : i
              ),
            }
          : p
      ),
    }));
  };

  const removerItemChecklist = (provaId, itemId) => {
    setData(prev => ({
      ...prev,
      provas: (prev.provas || []).map(p => 
        p.id === provaId 
          ? { ...p, checklist: (p.checklist || []).filter(i => i.id !== itemId) }
          : p
      ),
    }));
  };

  const resetData = () => {
    setData(defaultData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportarBackup = () => {
    const backup = {
      versao: '2.0',
      dataExportacao: new Date().toISOString(),
      dados: data,
    };
    
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const dataFormatada = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `studypower-backup-${dataFormatada}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  };

  const importarBackup = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          
          if (!backup.dados) {
            reject(new Error('Arquivo de backup inválido. Faltam os dados.'));
            return;
          }
          
          const dadosParaImportar = {
            ...defaultData,
            ...backup.dados,
            estatisticas: { ...defaultData.estatisticas, ...(backup.dados.estatisticas || {}) },
            configuracoes: { ...defaultData.configuracoes, ...(backup.dados.configuracoes || {}) },
          };
          
          setData(dadosParaImportar);
          resolve({
            sucesso: true,
            versao: backup.versao,
            dataExportacao: backup.dataExportacao,
            totalEditais: backup.dados.editais?.length || 0,
            totalQuestoes: backup.dados.questoesRespondidas?.length || 0,
            totalFlashcards: backup.dados.flashcards?.length || 0,
            totalResumos: backup.dados.resumos?.length || 0,
          });
        } catch (err) {
          reject(new Error('Erro ao ler o arquivo. Verifique se é um backup válido do StudyPower.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsText(arquivo);
    });
  };

  const value = {
    data,
    updateData,
    addEdital,
    removeEdital,
    getAllDisciplinas,
    registrarResposta,
    addFlashcard,
    revisarFlashcard,
    removerFlashcard,
    resetarFlashcard,
    addResumo,
    updateCronograma,
    toggleCronogramaItem,
    updateConfiguracoes,
    resetData,
    exportarBackup,
    importarBackup,
    salvarSimulado,
    atualizarErroCaderno,
    marcarErroDominado,
    removerErroCaderno,
    limparDominados,
    registrarPomodoro,
    salvarAnalise,
    removerAnalise,
    criarConversa,
    adicionarMensagem,
    atualizarConversa,
    removerConversa,
    marcarMensagem,
    adicionarProva,
    atualizarProva,
    removerProva,
    favoritarProva,
    adicionarItemChecklist,
    toggleChecklistItem,
    removerItemChecklist,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}