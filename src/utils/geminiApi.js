const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

export async function callGemini(prompt, apiKey) {
  if (!apiKey) throw new Error('Chave API do Gemini não configurada. Vá em Configurações e adicione sua chave.');

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 32768,
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro na API: ${response.status}`);
  }

  const result = await response.json();
  const texto = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!texto) throw new Error('A IA retornou uma resposta vazia. Tente novamente.');
  
  return texto;
}

export function extractJSON(text) {
  if (!text) throw new Error('Resposta vazia da IA');
  
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try { return JSON.parse(cleaned); } catch (e) {}
  
  const arrayStart = cleaned.indexOf('[');
  const objectStart = cleaned.indexOf('{');
  let start = -1;
  let isArray = false;
  
  if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
    start = arrayStart; isArray = true;
  } else if (objectStart !== -1) {
    start = objectStart; isArray = false;
  }
  
  if (start === -1) throw new Error('Nenhum JSON encontrado na resposta.');
  
  cleaned = cleaned.substring(start);
  const lastArrayEnd = cleaned.lastIndexOf(']');
  const lastObjectEnd = cleaned.lastIndexOf('}');
  
  if (isArray && lastArrayEnd !== -1) {
    try { return JSON.parse(cleaned.substring(0, lastArrayEnd + 1)); } catch (e) {}
  }
  
  if (lastObjectEnd !== -1) {
    try {
      const partial = cleaned.substring(0, lastObjectEnd + 1);
      if (isArray) return JSON.parse(partial + ']');
      return JSON.parse(partial);
    } catch (e) {}
  }
  
  if (isArray) {
    const items = [];
    const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    let match;
    while ((match = regex.exec(cleaned)) !== null) {
      try { items.push(JSON.parse(match[0])); } catch (e) {}
    }
    if (items.length > 0) {
      console.log(`✅ Recuperados ${items.length} itens do JSON parcial`);
      return items;
    }
  }
  
  throw new Error('Não foi possível extrair JSON da resposta da IA.');
}

// 🎯 NOVA FUNÇÃO: Divide texto grande em pedaços inteligentes
function dividirTextoEmChunks(texto, tamanhoMax = 20000) {
  if (texto.length <= tamanhoMax) return [texto];
  
  const chunks = [];
  // Tenta dividir por seções (procura por CARGO, ANEXO, etc.)
  const marcadores = ['\nCARGO', '\nANEXO', '\nCARGOS DE', '\nCONHECIMENTOS'];
  
  let restante = texto;
  while (restante.length > tamanhoMax) {
    let corte = tamanhoMax;
    
    // Procura o melhor ponto de corte (perto de um marcador)
    for (const marcador of marcadores) {
      const pos = restante.lastIndexOf(marcador, tamanhoMax);
      if (pos > tamanhoMax * 0.5) { // Só corta se estiver na metade do chunk pra frente
        corte = pos;
        break;
      }
    }
    
    // Se não achou marcador bom, corta em uma quebra de linha
    if (corte === tamanhoMax) {
      const pos = restante.lastIndexOf('\n', tamanhoMax);
      if (pos > tamanhoMax * 0.5) corte = pos;
    }
    
    chunks.push(restante.substring(0, corte));
    restante = restante.substring(corte);
  }
  
  if (restante.length > 0) chunks.push(restante);
  return chunks;
}

// 🎯 NOVA FUNÇÃO: Junta os resultados de vários chunks sem duplicar
function mesclarResultadosEdital(resultados) {
  const cargosMap = new Map();
  let concurso = '';
  let banca = '';
  
  for (const resultado of resultados) {
    if (!concurso && resultado.concurso) concurso = resultado.concurso;
    if (!banca && resultado.banca) banca = resultado.banca;
    
    if (Array.isArray(resultado.cargos)) {
      for (const cargo of resultado.cargos) {
        const chave = cargo.nome?.toUpperCase().trim();
        if (!chave) continue;
        
        if (cargosMap.has(chave)) {
          // Mescla disciplinas de cargos duplicados
          const existente = cargosMap.get(chave);
          const discMap = new Map();
          
          [...(existente.disciplinas || []), ...(cargo.disciplinas || [])].forEach(d => {
            const dChave = d.nome?.toUpperCase().trim();
            if (!dChave) return;
            if (discMap.has(dChave)) {
              const dExist = discMap.get(dChave);
              const novosAssuntos = [...new Set([...(dExist.assuntos || []), ...(d.assuntos || [])])];
              discMap.set(dChave, { ...dExist, assuntos: novosAssuntos });
            } else {
              discMap.set(dChave, d);
            }
          });
          existente.disciplinas = Array.from(discMap.values());
        } else {
          cargosMap.set(chave, cargo);
        }
      }
    }
  }
  
  return {
    concurso: concurso || 'Concurso',
    banca: banca || 'Não identificada',
    cargos: Array.from(cargosMap.values()),
  };
}

// 🎯 FUNÇÃO ATUALIZADA: parseEdital agora processa em lotes
export async function parseEdital(texto, apiKey, onProgress) {
  const chunks = dividirTextoEmChunks(texto, 20000);
  console.log(`📚 Edital dividido em ${chunks.length} parte(s) para processamento`);
  
  const resultados = [];
  
  for (let i = 0; i < chunks.length; i++) {
    if (onProgress) onProgress(i + 1, chunks.length);
    console.log(`🔍 Processando parte ${i + 1}/${chunks.length}...`);
    
    const isParcial = chunks.length > 1;
    const prompt = `Analise este ${isParcial ? 'TRECHO' : 'conteúdo'} de edital de concurso público e extraia TODOS os cargos com suas disciplinas e assuntos.

${isParcial ? `IMPORTANTE: Este é o TRECHO ${i + 1} de ${chunks.length} do edital. Extraia apenas os cargos presentes neste trecho.` : ''}

RETORNE APENAS um JSON válido no formato:
{
  "concurso": "Nome do concurso/órgão",
  "banca": "Nome da banca",
  "cargos": [
    {
      "nome": "NOME DO CARGO",
      "nivel": "médio ou superior",
      "disciplinas": [
        {
          "nome": "Nome da Disciplina",
          "tipo": "basico ou especifico",
          "assuntos": ["Assunto 1", "Assunto 2"]
        }
      ]
    }
  ]
}

REGRAS IMPORTANTES:
- Identifique TODOS os cargos mencionados neste trecho
- Separe conhecimentos básicos de específicos
- Liste TODOS os assuntos individualmente
- Se um cargo mencionar "conhecimentos gerais idênticos ao cargo X", ainda liste esse cargo
- Retorne SOMENTE o JSON, sem markdown, sem texto adicional

TRECHO DO EDITAL:
${chunks[i]}`;
    
    try {
      const resposta = await callGemini(prompt, apiKey);
      const parsed = extractJSON(resposta);
      resultados.push(parsed);
      console.log(`✅ Parte ${i + 1}: ${parsed.cargos?.length || 0} cargos encontrados`);
    } catch (err) {
      console.error(`❌ Erro na parte ${i + 1}:`, err.message);
      // Continua tentando as outras partes mesmo se uma falhar
    }
    
    // Pausa entre requisições pra não estourar limite de rate
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  
  if (resultados.length === 0) {
    throw new Error('Não foi possível extrair informações do edital. Verifique o texto e tente novamente.');
  }
  
  const mesclado = mesclarResultadosEdital(resultados);
  console.log(`🎉 Total final: ${mesclado.cargos.length} cargos únicos encontrados`);
  
  return mesclado;
}

export async function gerarQuestoes(config, apiKey) {
  const { disciplina, assuntos, quantidade, banca, dificuldade } = config;
  const assuntosLimitados = assuntos.slice(0, 15);

  // 🎯 Perfis detalhados de cada banca com estilo, formato e macetes
  const perfisBanca = {
    'CESPE/CEBRASPE': `Você é um EXAMINADOR SÊNIOR do CESPE/CEBRASPE com 20+ anos de experiência. 
ESTILO CESPE: enunciados longos com contexto (2-5 parágrafos), afirmativas que parecem certas mas têm pequenos erros (troca de "sempre" por "às vezes", palavras absolutas como "todo/nunca/jamais"), foco em interpretação da lei e jurisprudência, cita súmulas e decisões do STF/STJ. 
FORMATO: Múltipla escolha A a E, sendo que a resposta correta é a MAIS PRECISA (não apenas correta). 
PEGADINHAS TÍPICAS: inversão de sujeito, generalização indevida, incompatibilidade temporal, exceções da regra.`,

    'FCC': `Você é um EXAMINADOR SÊNIOR da FCC (Fundação Carlos Chagas) com décadas de experiência. 
ESTILO FCC: enunciados objetivos e diretos, cobra LETRA DE LEI (decoreba mesmo!), pergunta a "regra geral" - não gosta de exceções complexas. 
FORMATO: Múltipla escolha A a E, alternativas curtas e técnicas. 
PEGADINHAS TÍPICAS: troca de números (prazos, percentuais), inversão de conceitos parecidos, artigos de lei com pequenas alterações. Sempre cita o número do artigo/lei quando possível.`,

    'Cesgranrio': `Você é um EXAMINADOR SÊNIOR da Cesgranrio, especialista em provas de PETROBRAS, BB, CAIXA e BNDES. 
ESTILO CESGRANRIO: enunciados CONTEXTUALIZADOS com casos práticos (ex: "Em uma agência bancária..."), foca em situações do dia a dia bancário/empresarial, questões CONCEITUAIS mas com aplicação prática. 
FORMATO: Múltipla escolha A a E, alternativas médias. 
PEGADINHAS TÍPICAS: dados numéricos que exigem cálculo mental, situações onde 2 alternativas parecem certas mas só uma se aplica ao contexto, uso de sinônimos técnicos.`,

    'FGV': `Você é um EXAMINADOR SÊNIOR da FGV com foco analítico. 
ESTILO FGV: textos longos e reflexivos, exige RACIOCÍNIO (não decoreba), questões interdisciplinares. 
FORMATO: Múltipla escolha A a E. 
PEGADINHAS TÍPICAS: alternativas plausíveis que exigem análise crítica, distratores muito bem elaborados.`,

    'VUNESP': `Você é um EXAMINADOR SÊNIOR da VUNESP. 
ESTILO VUNESP: clara, direta, sem grandes pegadinhas, cobra o essencial da matéria. 
FORMATO: Múltipla escolha A a E. 
PEGADINHAS TÍPICAS: mais leves — foca em quem realmente estudou o conteúdo.`,

    'IBFC': `Você é um EXAMINADOR SÊNIOR do IBFC. 
ESTILO IBFC: mistura de conceitos e aplicações, questões variadas em dificuldade. 
FORMATO: Múltipla escolha A a E. 
PEGADINHAS TÍPICAS: alternativas com termos técnicos trocados.`,

    'Quadrix': `Você é um EXAMINADOR SÊNIOR da Quadrix (concursos de conselhos profissionais). 
ESTILO QUADRIX: similar ao CESPE mas mais objetivo, cobra bastante legislação de conselhos e ética profissional. 
FORMATO: Múltipla escolha A a E ou certo/errado.
PEGADINHAS TÍPICAS: detalhes de resoluções e códigos de ética.`,

    'Instituto Consulplan': `Você é um EXAMINADOR SÊNIOR do Instituto Consulplan. 
ESTILO CONSULPLAN: objetiva, contextualizada, foca em legislação municipal/estadual quando aplicável. 
FORMATO: Múltipla escolha A a E.`,

    'Instituto Consulpam': `Você é um EXAMINADOR SÊNIOR do Instituto Consulpam. 
ESTILO CONSULPAM: objetiva, foca fortemente em LEGISLAÇÃO (federal, estadual e municipal), leis orgânicas. 
FORMATO: Múltipla escolha A a E.`,

    'IADES': `Você é um EXAMINADOR SÊNIOR do IADES. 
ESTILO IADES: analítica, textos de tamanho médio, foca em aplicação prática. 
FORMATO: Múltipla escolha A a E.`,

    'AOCP': `Você é um EXAMINADOR SÊNIOR da AOCP. 
ESTILO AOCP: objetiva e conceitual, cobra fundamentos. 
FORMATO: Múltipla escolha A a E.`,

    'IDIB': `Você é um EXAMINADOR SÊNIOR do IDIB. Estilo claro e direto. FORMATO: Múltipla escolha A a E.`,
    'IBADE': `Você é um EXAMINADOR SÊNIOR do IBADE. Estilo contextualizado. FORMATO: Múltipla escolha A a E.`,
    'CETAP': `Você é um EXAMINADOR SÊNIOR do CETAP, banca regional (Norte/Nordeste). Estilo direto, cobra bastante legislação municipal quando aplicável. FORMATO: Múltipla escolha A a E.`,
    'IVIN': `Você é um EXAMINADOR SÊNIOR do IVIN. Estilo objetivo. FORMATO: Múltipla escolha A a E.`,
    'FUNDATEC': `Você é um EXAMINADOR SÊNIOR da FUNDATEC. Estilo objetivo, cobra base sólida. FORMATO: Múltipla escolha A a E.`,
    'IBAM': `Você é um EXAMINADOR SÊNIOR do IBAM, foco em concursos municipais. Cobra muito legislação de administração pública municipal. FORMATO: Múltipla escolha A a E.`,
  };

  const perfilBanca = perfisBanca[banca] || `Você é um EXAMINADOR SÊNIOR da banca ${banca}, com experiência elaborando questões de concurso público brasileiro. Elabore questões no estilo dessa banca, seguindo o padrão brasileiro de concursos.`;

  const prompt = `${perfilBanca}

MISSÃO: Elabore ${quantidade} questões de MÚLTIPLA ESCOLHA (A a E) no ESTILO AUTÊNTICO da banca ${banca}, como se fossem tiradas de uma prova real dessa banca.

DISCIPLINA: ${disciplina}
ASSUNTOS: ${assuntosLimitados.join(', ')}
DIFICULDADE: ${dificuldade}

RETORNE APENAS um JSON válido no formato:
[
  {
    "id": 1,
    "enunciado": "Texto completo da questão NO ESTILO DA BANCA ${banca}. Se for CESPE/CEBRASPE, faça enunciado longo com contexto. Se for FCC, seja mais direto. Se for Cesgranrio, contextualize com caso prático. Etc.",
    "alternativas": [
      {"letra": "A", "texto": "Alternativa A - também no estilo da banca (curtas se FCC, mais elaboradas se CESPE)"},
      {"letra": "B", "texto": "Alternativa B"},
      {"letra": "C", "texto": "Alternativa C"},
      {"letra": "D", "texto": "Alternativa D"},
      {"letra": "E", "texto": "Alternativa E"}
    ],
    "respostaCorreta": "A",
    "explicacao": "Explicação DETALHADA e didática de por que a alternativa correta está certa E por que cada uma das outras 4 alternativas está errada, uma por uma. Cite artigos de lei, súmulas, conceitos técnicos.",
    "segredo": "🔑 REVELE OS SEGREDOS DO EXAMINADOR: qual o padrão dessa banca para esse tipo de questão? Como identificar rapidamente a alternativa correta? Qual macete ou dica de ouro para acertar esse tipo de questão em concursos futuros? Que palavras-chave sinalizam pegadinha? Seja específico e prático!",
    "pegadinha": "⚠️ ARMADILHA: Qual foi a pegadinha específica dessa questão? Por que o candidato desatento erraria? Qual alternativa é a 'quase certa' que pega os desavisados?",
    "disciplina": "${disciplina}",
    "assunto": "Assunto específico da questão (um dos listados)",
    "dificuldade": "${dificuldade}"
  }
]

REGRAS OBRIGATÓRIAS:
1. As questões devem PARECER de verdade da banca ${banca} — copie o estilo, tom, tamanho e padrão dessa banca
2. Cada questão OBRIGATORIAMENTE precisa ter 5 alternativas (A a E)
3. VARIE a letra da resposta correta (não deixe sempre em A ou B)
4. VARIE os assuntos entre as questões (não repita todas sobre o mesmo tema)
5. A explicação deve ser DIDÁTICA, extensa e citar fundamentos legais/teóricos
6. O campo "segredo" é FUNDAMENTAL — revele padrões, macetes e dicas que só examinadores experientes conhecem
7. O campo "pegadinha" deve identificar a armadilha específica da questão
8. Se a banca for CESPE/Quadrix, os enunciados podem ser mais longos (2-4 parágrafos)
9. Se a banca for FCC/VUNESP, seja mais objetivo e direto
10. Retorne SOMENTE o JSON, sem markdown, sem \`\`\`json, sem texto adicional`;

  const resposta = await callGemini(prompt, apiKey);
  return extractJSON(resposta);
}

export async function gerarFlashcards(config, apiKey) {
  const { disciplina, assunto, quantidade } = config;

  const prompt = `Gere ${quantidade || 10} flashcards de estudo para concurso público.

Disciplina: ${disciplina}
Assunto: ${assunto}

RETORNE APENAS um JSON válido:
[
  {
    "frente": "Pergunta ou conceito chave",
    "verso": "Resposta detalhada e clara",
    "dica": "Dica ou mnemônico para memorizar",
    "disciplina": "${disciplina}",
    "assunto": "${assunto}"
  }
]

Retorne SOMENTE o JSON`;

  const resposta = await callGemini(prompt, apiKey);
  return extractJSON(resposta);
}

export async function gerarResumo(config, apiKey) {
  const { disciplina, assunto, nivel } = config;

  const prompt = `Gere um resumo completo e didático para estudo de concurso público.

Disciplina: ${disciplina}
Assunto: ${assunto}
Nível de detalhe: ${nivel || 'completo'}

O resumo deve:
1. Começar com os conceitos fundamentais
2. Apresentar definições claras
3. Incluir exemplos práticos
4. Destacar o que mais cai em provas
5. Incluir dicas de memorização
6. Ter marcadores e organização clara
7. Finalizar com pontos-chave para revisão rápida

Use formatação Markdown com títulos, subtítulos, listas e destaques em negrito.`;

  return await callGemini(prompt, apiKey);
}

export async function gerarCronograma(config, apiKey) {
  const { disciplinas, horariosDisponiveis, diasSemana, duracaoSemanas } = config;
  const disciplinasResumo = disciplinas.map(d => `- ${d.nome} (${d.assuntos.length} assuntos)`).join('\n');
  const semanasReais = Math.min(duracaoSemanas, 2);

  const prompt = `Crie um cronograma de estudos otimizado para concurso público.

DISCIPLINAS:
${disciplinasResumo}

DISPONIBILIDADE:
- Dias: ${diasSemana.join(', ')}
- Horários: ${horariosDisponiveis.map(h => `${h.inicio}-${h.fim}`).join(', ')}
- Gerar: ${semanasReais} semana(s) completa(s)

RETORNE APENAS um JSON válido:
[
  {
    "dia": "Segunda-feira",
    "data": "Semana 1 - Dia 1",
    "slots": [
      {
        "inicio": "08:00",
        "fim": "09:30",
        "disciplina": "Nome",
        "assunto": "Assunto",
        "tipo": "teoria",
        "concluido": false
      }
    ]
  }
]

REGRAS:
- Divida cada horário em blocos de 1h30 com 15min de pausa
- Alterne disciplinas para evitar fadiga
- Tipos válidos: "teoria", "exercicios", "revisao", "simulado"
- Um simulado por semana (sábado se disponível)
- Retorne SOMENTE o JSON`;

  const resposta = await callGemini(prompt, apiKey);
  return extractJSON(resposta);
}

export async function gerarSimulado(config, apiKey) {
  const { disciplinas, quantidade, banca, dificuldade } = config;
  
  const disciplinasTexto = disciplinas.map(d => 
    `- ${d.nome}: ${d.assuntos.slice(0, 8).join(', ')}`
  ).join('\n');

  const prompt = `Você é um EXAMINADOR SÊNIOR da banca ${banca} com décadas de experiência elaborando provas reais de concurso público brasileiro.

MISSÃO: Elabore ${quantidade} questões DE MÚLTIPLA ESCOLHA (A a E) em estilo AUTÊNTICO da banca ${banca}, MISTURANDO todas as disciplinas abaixo (como em uma prova real!):

DISCIPLINAS E ASSUNTOS:
${disciplinasTexto}

DIFICULDADE: ${dificuldade}

REGRAS OBRIGATÓRIAS:
1. Distribua as questões PROPORCIONALMENTE entre as disciplinas listadas
2. Cada questão precisa ter EXATAMENTE 5 alternativas (A, B, C, D, E)
3. VARIE bastante qual letra é a correta (não deixe sempre em A ou B)
4. As questões devem ser realistas, como em uma prova real dessa banca
5. Retorne SOMENTE o JSON, sem markdown, sem \`\`\`json

RETORNE APENAS um JSON válido no formato:
[
  {
    "id": 1,
    "enunciado": "Texto completo da questão no estilo da banca",
    "alternativas": [
      {"letra": "A", "texto": "Alternativa A"},
      {"letra": "B", "texto": "Alternativa B"},
      {"letra": "C", "texto": "Alternativa C"},
      {"letra": "D", "texto": "Alternativa D"},
      {"letra": "E", "texto": "Alternativa E"}
    ],
    "respostaCorreta": "A",
    "explicacao": "Explicação detalhada e didática",
    "segredo": "Macete e dica para acertar",
    "pegadinha": "Qual a armadilha da questão",
    "disciplina": "Nome da disciplina",
    "assunto": "Assunto específico",
    "dificuldade": "${dificuldade}"
  }
]`;

  const resposta = await callGemini(prompt, apiKey);
  return extractJSON(resposta);
}

export async function gerarAnalisePreditiva(dados, apiKey) {
  const { 
    totalQuestoes, 
    acertos, 
    erros, 
    porDisciplina, 
    historico, 
    sequenciaDias,
    maiorSequencia,
    diasEstudados,
    dataProva,
    nomeConcurso,
    simulados,
    cadernoErros,
    conquistas,
  } = dados;

  const taxaGeral = totalQuestoes > 0 ? ((acertos / totalQuestoes) * 100).toFixed(1) : 0;

  // Prepara dados por disciplina
  const disciplinasStats = Object.entries(porDisciplina || {})
    .map(([nome, val]) => ({
      nome,
      total: val.total,
      acertos: val.acertos,
      taxa: val.total > 0 ? ((val.acertos / val.total) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => Number(a.taxa) - Number(b.taxa));

  const piores = disciplinasStats.slice(0, 5);
  const melhores = [...disciplinasStats].reverse().slice(0, 5);

  // Simulados recentes
  const simuladosResumo = (simulados || []).slice(-5).map(s => ({
    data: new Date(s.data).toLocaleDateString('pt-BR'),
    nota: s.nota,
    quantidade: s.quantidade,
    banca: s.banca,
    acertos: s.acertos,
    erros: s.erros,
    embranco: s.embranco,
  }));

  // Últimos 14 dias
  const ultimos14dias = (historico || []).slice(-14).map(h => ({
    data: h.data,
    total: h.total,
    acertos: h.acertos,
    taxa: h.total > 0 ? ((h.acertos / h.total) * 100).toFixed(0) : 0,
  }));

  // Dias até prova
  let diasProva = null;
  if (dataProva) {
    const prova = new Date(dataProva);
    const agora = new Date();
    diasProva = Math.ceil((prova - agora) / (1000 * 60 * 60 * 24));
  }

  const prompt = `Você é um COACH EXPERIENTE DE CONCURSOS PÚBLICOS com décadas de experiência aprovando alunos. Sua missão é analisar os dados de estudo abaixo e criar uma ANÁLISE PREDITIVA COMPLETA e MOTIVADORA para o candidato.

📊 DADOS DO CANDIDATO:

🎯 DESEMPENHO GERAL:
- Total de questões respondidas: ${totalQuestoes}
- Acertos: ${acertos} (${taxaGeral}%)
- Erros: ${erros}
- Dias estudados no total: ${diasEstudados || 0}
- Sequência atual (streak): ${sequenciaDias || 0} dias
- Maior sequência já: ${maiorSequencia || 0} dias

🏛️ CONCURSO/PROVA:
- Concurso: ${nomeConcurso || 'Não informado'}
- Dias até a prova: ${diasProva !== null ? diasProva + ' dias' : 'não informado'}

📚 DESEMPENHO POR DISCIPLINA (${disciplinasStats.length} disciplinas):

🔴 PIORES DESEMPENHOS (precisam de atenção):
${piores.map(d => `- ${d.nome}: ${d.taxa}% (${d.acertos}/${d.total} questões)`).join('\n')}

🟢 MELHORES DESEMPENHOS:
${melhores.map(d => `- ${d.nome}: ${d.taxa}% (${d.acertos}/${d.total} questões)`).join('\n')}

📈 EVOLUÇÃO DOS ÚLTIMOS 14 DIAS:
${ultimos14dias.map(h => `- ${h.data}: ${h.total} questões, ${h.taxa}% acerto`).join('\n') || 'Sem dados recentes'}

🔥 SIMULADOS RECENTES (${(simulados || []).length} total):
${simuladosResumo.length > 0 
  ? simuladosResumo.map(s => `- ${s.data}: Nota ${s.nota}% (${s.acertos}✅ ${s.erros}❌ ${s.embranco}⚪) - Banca ${s.banca}`).join('\n')
  : 'Nenhum simulado feito ainda'}

📓 CADERNO DE ERROS:
- Total de erros registrados: ${(cadernoErros || []).length}
- Erros pendentes de revisão: ${(cadernoErros || []).filter(e => !e.dominado).length}
- Erros dominados: ${(cadernoErros || []).filter(e => e.dominado).length}

🏆 CONQUISTAS DESBLOQUEADAS: ${(conquistas || []).length}

---

MISSÃO: Elabore uma análise COMPLETA em formato Markdown, com os seguintes tópicos OBRIGATÓRIOS (use exatamente esses títulos):

## 🎯 Diagnóstico Geral
- Análise honesta e realista da situação atual
- Identifique padrões nos dados (evolução, consistência, etc)
- Compare com o desempenho típico de aprovados
- Seja específico com números

## 🔮 Previsão de Nota
- Com base nos dados, estime uma faixa de nota atual (ex: "entre 55% e 65%")
- Explique o raciocínio
- Aponte o que precisa mudar para chegar em 70%+ (nota geralmente necessária para aprovação)
- Se houver simulados, use eles como referência principal

## 💪 Pontos Fortes
- Liste 3-5 pontos fortes REAIS baseados nos dados
- Elogie sinceramente onde a pessoa está indo bem
- Mostre como usar essas forças a favor

## 🎯 Pontos de Atenção
- Liste 3-5 pontos que precisam de foco urgente
- Seja específico: mencione as disciplinas com piores taxas
- Explique POR QUE isso é importante
- Não seja duro, seja construtivo

## 📋 Plano de Ação para os Próximos 7 Dias
- Cronograma específico DIA A DIA (segunda a domingo)
- Quantas questões fazer por dia (baseado no histórico atual)
- Quais disciplinas priorizar (as com pior desempenho)
- Quantos simulados fazer
- Tempo de revisão do Caderno de Erros
- Inclua pausas e descanso

## 💡 Recomendações Estratégicas
- 5-7 dicas ESPECÍFICAS baseadas nos dados
- Não seja genérico! Use os números reais
- Ex: "Você tem 45% em Matemática Financeira, isso indica que..."
- Sugira macetes práticos

## 🔥 Mensagem Motivacional
- Termine com uma mensagem inspiradora
- Reconheça o esforço até aqui
- Celebre as conquistas
- Aponte a luz no fim do túnel
- Seja genuíno, não clichê

REGRAS OBRIGATÓRIAS:
1. Use números REAIS dos dados fornecidos, não invente
2. Seja ESPECÍFICO — cite disciplinas pelo nome, mencione as taxas exatas
3. Tom: profissional mas humano. Como um mentor experiente e amigo
4. Use emojis moderadamente para deixar visualmente agradável
5. Formatação: Markdown com títulos (##), negritos (**texto**), listas (-)
6. Linguagem: português brasileiro, tratando por "você"
7. Se dados forem insuficientes (ex: só 5 questões), seja honesto sobre isso
8. NUNCA use frases genéricas tipo "continue estudando" sem embasamento
9. Ao mencionar disciplinas fracas, sugira COMO melhorar
10. Retorne o texto em MARKDOWN puro, sem \`\`\`markdown ou similares`;

  return await callGemini(prompt, apiKey);
}

export async function chatProfessor(config, apiKey) {
  const { 
    mensagens, 
    disciplina, 
    assunto, 
    banca,
    contextoEdital,
    nivelDetalhamento = 'médio',
  } = config;

  // Constrói o histórico da conversa
  const historico = mensagens.map(m => ({
    role: m.autor === 'usuario' ? 'user' : 'model',
    parts: [{ text: m.texto }],
  }));

  // System prompt = personalidade do professor
  const contextoBanca = banca ? ` A banca do concurso é ${banca}, então explique considerando o estilo dessa banca.` : '';
  const contextoDisciplina = disciplina 
    ? `\n\nFOCO ATUAL: A conversa é sobre a disciplina "${disciplina}"${assunto ? `, especificamente o assunto "${assunto}"` : ''}.` 
    : '';
  const contextoConteudo = contextoEdital 
    ? `\n\nCONTEÚDO DO EDITAL DO ALUNO (para contextualizar): ${contextoEdital}` 
    : '';

  const systemPrompt = `Você é um PROFESSOR PARTICULAR ALTAMENTE EXPERIENTE, especialista em preparar candidatos para concursos públicos brasileiros. Você tem décadas de experiência aprovando milhares de alunos e conhece PROFUNDAMENTE todas as disciplinas cobradas em concursos.${contextoBanca}${contextoDisciplina}${contextoConteudo}

SUA PERSONALIDADE E ESTILO:
- Didático, paciente e acolhedor (como um professor querido que se preocupa com o aluno)
- Usa linguagem clara e acessível, mas tecnicamente precisa
- Adapta o nível de detalhe: ${nivelDetalhamento === 'simples' ? 'explica de forma bem simples, como para iniciantes' : nivelDetalhamento === 'aprofundado' ? 'explica de forma aprofundada, com detalhes técnicos e nuances' : 'equilibrado entre acessível e técnico'}
- Usa emojis moderadamente para deixar a conversa mais leve
- Cita artigos de lei, súmulas, jurisprudência quando relevante
- Dá EXEMPLOS PRÁTICOS e ANALOGIAS pra facilitar o entendimento
- Compartilha MACETES e "PEGADINHAS" das bancas
- Motiva o aluno quando percebe insegurança
- Divide explicações longas em partes menores e organizadas
- Usa formatação Markdown para destacar pontos importantes (## títulos, **negrito**, listas)

REGRAS ESTRITAS:
1. Se o aluno perguntar algo fora do escopo de concursos públicos, gentilmente redirecione para o estudo
2. Se não souber algo com certeza, seja honesto — nunca invente informações
3. Ao explicar, sempre relacione com o que cai em provas
4. Se a resposta ficar longa demais, quebre em partes e pergunte se quer continuar
5. Termine respostas complexas oferecendo ajuda adicional: "Quer que eu explique com mais detalhes alguma parte?" ou "Posso criar um exercício sobre isso?"
6. Ao criar exercícios/questões, use o estilo autêntico da banca do aluno
7. Use SEMPRE português brasileiro
8. Trate o aluno por "você"

O ALUNO PODE PEDIR PARA VOCÊ:
- Explicar conceitos, temas, artigos de lei
- Dar exemplos práticos
- Criar exercícios/questões pra praticar
- Corrigir respostas dele
- Comparar assuntos parecidos
- Dar dicas de memorização (mnemônicos)
- Revelar pegadinhas das bancas
- Fazer resumos rápidos
- Tirar dúvidas específicas sobre qualquer tópico

Agora responda a próxima mensagem do aluno de forma didática, útil e motivadora.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: historico,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro na API: ${response.status}`);
  }

  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui gerar uma resposta. Tente novamente.';
}