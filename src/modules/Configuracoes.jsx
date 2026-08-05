import React, { useState, useRef } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useData } from '../context/DataContext';

export default function Configuracoes() {
  const { data, updateConfiguracoes, resetData, exportarBackup, importarBackup } = useData();
  const [apiKey, setApiKey] = useState(data.configuracoes.apiKey || '');
  const [metaQuestoesDia, setMetaQuestoesDia] = useState(data.configuracoes.metaQuestoesDia || 20);
  const [dataProva, setDataProva] = useState(data.configuracoes.dataProva ? data.configuracoes.dataProva.split('T')[0] : '');
  const [nomeConcurso, setNomeConcurso] = useState(data.configuracoes.nomeConcurso || '');
  const [savedMeta, setSavedMeta] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [arquivoImportar, setArquivoImportar] = useState(null);
  const [mensagemBackup, setMensagemBackup] = useState(null);
  const fileInputRef = useRef();

  const salvarConfig = () => {
    updateConfiguracoes({ apiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const salvarMetas = () => {
    updateConfiguracoes({ 
      metaQuestoesDia: Number(metaQuestoesDia), 
      dataProva: dataProva ? new Date(dataProva).toISOString() : null,
      nomeConcurso: nomeConcurso.trim(),
    });
    setSavedMeta(true);
    setTimeout(() => setSavedMeta(false), 3000);
  };

  const handleReset = () => {
    resetData();
    setApiKey('');
    setShowResetConfirm(false);
    setMensagemBackup({ tipo: 'sucesso', texto: '✅ Todos os dados foram apagados!' });
    setTimeout(() => setMensagemBackup(null), 4000);
  };

  const handleExportar = () => {
    try {
      exportarBackup();
      setMensagemBackup({ 
        tipo: 'sucesso', 
        texto: '✅ Backup exportado com sucesso! Guarde o arquivo em local seguro (Google Drive, pen drive, etc.)' 
      });
      setTimeout(() => setMensagemBackup(null), 6000);
    } catch (err) {
      setMensagemBackup({ tipo: 'erro', texto: `❌ Erro ao exportar: ${err.message}` });
      setTimeout(() => setMensagemBackup(null), 6000);
    }
  };

  const handleSelecionarArquivo = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    
    if (!arquivo.name.endsWith('.json')) {
      setMensagemBackup({ tipo: 'erro', texto: '❌ Selecione um arquivo .json válido' });
      setTimeout(() => setMensagemBackup(null), 4000);
      return;
    }
    
    setArquivoImportar(arquivo);
    setShowImportConfirm(true);
  };

  const handleImportar = async () => {
    if (!arquivoImportar) return;
    
    try {
      const resultado = await importarBackup(arquivoImportar);
      setShowImportConfirm(false);
      setArquivoImportar(null);
      setApiKey(data.configuracoes.apiKey || '');
      
      setMensagemBackup({ 
        tipo: 'sucesso', 
        texto: `✅ Backup importado com sucesso! 
📅 Data: ${new Date(resultado.dataExportacao).toLocaleDateString('pt-BR')}
📋 Editais: ${resultado.totalEditais} | ❓ Questões: ${resultado.totalQuestoes} | 🃏 Flashcards: ${resultado.totalFlashcards} | 📝 Resumos: ${resultado.totalResumos}` 
      });
      setTimeout(() => setMensagemBackup(null), 8000);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setMensagemBackup({ tipo: 'erro', texto: `❌ ${err.message}` });
      setTimeout(() => setMensagemBackup(null), 6000);
      setShowImportConfirm(false);
      setArquivoImportar(null);
    }
  };

  const totalDados = {
    editais: data.editais.length,
    questoes: data.questoesRespondidas.length,
    flashcards: data.flashcards.length,
    resumos: data.resumos.length,
    cronograma: data.cronograma.length,
  };

  const temDados = Object.values(totalDados).some(v => v > 0);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>⚙️ Configurações</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure o sistema para funcionar perfeitamente</p>
      </div>

      {/* Mensagem de feedback (aparece quando exporta/importa) */}
      {mensagemBackup && (
        <Card style={{ 
          padding: '16px 20px', 
          marginBottom: '20px',
          background: mensagemBackup.tipo === 'sucesso' 
            ? 'rgba(16,185,129,0.08)' 
            : 'rgba(239,68,68,0.08)',
          borderColor: mensagemBackup.tipo === 'sucesso' 
            ? 'rgba(16,185,129,0.3)' 
            : 'rgba(239,68,68,0.3)',
        }}>
          <div style={{ 
            color: mensagemBackup.tipo === 'sucesso' ? 'var(--accent-green)' : 'var(--accent-red)',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'pre-line',
          }}>
            {mensagemBackup.texto}
          </div>
        </Card>
      )}

      {/* CHAVE API */}
      <Card style={{ padding: '28px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>🔑 Chave API do Google Gemini</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Necessária para todas as funcionalidades de IA. Obtenha grátis em{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>
            aistudio.google.com
          </a>
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Cole sua chave API aqui..."
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: `1px solid ${data.configuracoes.apiKey ? 'var(--accent-green)' : 'var(--border-color)'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                paddingRight: '48px',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <Button onClick={salvarConfig} variant={saved ? 'success' : 'primary'}>
            {saved ? '✅ Salvo!' : '💾 Salvar'}
          </Button>
        </div>

        {data.configuracoes.apiKey && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(16,185,129,0.08)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--accent-green)',
          }}>
            ✅ Chave API configurada e ativa
          </div>
        )}
      </Card>

      {/* 🎯 NOVO: METAS E OBJETIVOS */}
      <Card style={{ padding: '28px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>🎯 Metas e Objetivos</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Configure sua meta diária e a data da prova para acompanhar seu progresso!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
              🎯 Meta diária de questões
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={metaQuestoesDia}
              onChange={e => setMetaQuestoesDia(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Recomendado: 20-30 questões/dia
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
              📅 Data da Prova
            </label>
            <input
              type="date"
              value={dataProva}
              onChange={e => setDataProva(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Aparecerá contagem regressiva no Dashboard
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>
              📝 Nome do Concurso
            </label>
            <input
              type="text"
              value={nomeConcurso}
              onChange={e => setNomeConcurso(e.target.value)}
              placeholder="Ex: CAIXA 2025, TRT-SP..."
              style={{
                width: '100%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Opcional
            </div>
          </div>
        </div>

        <Button onClick={salvarMetas} variant={savedMeta ? 'success' : 'primary'} icon={savedMeta ? '✅' : '💾'}>
          {savedMeta ? 'Metas salvas!' : 'Salvar Metas'}
        </Button>

        {/* Lista de Conquistas */}
        {data.estatisticas.conquistas && data.estatisticas.conquistas.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '14px' }}>
              🏆 Suas Conquistas ({data.estatisticas.conquistas.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
              {data.estatisticas.conquistas.map((c, i) => (
                <div key={i} style={{
                  padding: '12px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '4px' }}>{c.icone}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-orange)' }}>{c.titulo}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.desc}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(c.data).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* NOVO: BACKUP E RESTAURAÇÃO */}
      <Card style={{ padding: '28px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>💾 Backup e Restauração</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          Seus dados ficam salvos apenas neste navegador. Faça backup regular para não perder nada!
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px',
          marginBottom: '20px',
        }}>
          {/* EXPORTAR */}
          <div style={{
            padding: '20px',
            background: 'rgba(79,125,249,0.06)',
            borderRadius: '12px',
            border: '1px solid rgba(79,125,249,0.2)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📥</div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--accent-blue)' }}>Exportar Backup</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Baixa um arquivo <strong>.json</strong> com TODOS os seus dados: editais, questões respondidas, flashcards, resumos, cronograma e estatísticas.
            </p>
            <Button 
              onClick={handleExportar} 
              variant="primary" 
              disabled={!temDados}
              icon="📥"
              style={{ width: '100%' }}
            >
              {temDados ? 'Exportar Backup Agora' : 'Sem dados para exportar'}
            </Button>
          </div>

          {/* IMPORTAR */}
          <div style={{
            padding: '20px',
            background: 'rgba(139,92,246,0.06)',
            borderRadius: '12px',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📤</div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--accent-purple)' }}>Importar Backup</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              Restaura seus dados de um arquivo <strong>.json</strong> exportado anteriormente. Útil para recuperar após limpar cache ou mudar de PC.
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="secondary"
              icon="📤"
              style={{ width: '100%' }}
            >
              Selecionar Arquivo de Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleSelecionarArquivo}
            />
          </div>
        </div>

        <div style={{
          padding: '14px 16px',
          background: 'rgba(245,158,11,0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(245,158,11,0.2)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
        }}>
          💡 <strong style={{ color: 'var(--accent-orange)' }}>DICA IMPORTANTE:</strong> Faça backup pelo menos <strong>1x por semana</strong>! Guarde o arquivo no Google Drive, OneDrive ou pen drive. Se você limpar o navegador ou formatar o PC, seus dados serão perdidos SEM backup.
        </div>
      </Card>

      {/* COMO OBTER API */}
      <Card style={{ padding: '28px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>📖 Como obter a chave API (Grátis!)</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            { step: 1, text: 'Acesse aistudio.google.com/app/apikey', icon: '🌐' },
            { step: 2, text: 'Faça login com sua conta Google', icon: '👤' },
            { step: 3, text: 'Clique em "Criar chave de API"', icon: '🔑' },
            { step: 4, text: 'Copie a chave gerada', icon: '📋' },
            { step: 5, text: 'Cole no campo acima e salve', icon: '💾' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--gradient-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                flexShrink: 0,
              }}>
                {item.step}
              </span>
              <span style={{ fontSize: '14px' }}>{item.icon} {item.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* DADOS ARMAZENADOS */}
      <Card style={{ padding: '28px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>📊 Dados Armazenados</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {Object.entries(totalDados).map(([key, value]) => (
            <div key={key} style={{
              padding: '16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)' }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key}</div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '16px',
          background: 'rgba(239,68,68,0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <h4 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-red)' }}>⚠️ Zona de Perigo</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Isso apagará TODOS os seus dados: editais, questões, flashcards, resumos e cronogramas.
            <br />
            <strong style={{ color: 'var(--accent-orange)' }}>💡 Recomendação: Faça um backup antes!</strong>
          </p>
          {!showResetConfirm ? (
            <Button variant="danger" size="sm" onClick={() => setShowResetConfirm(true)}>
              🗑️ Resetar Todos os Dados
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--accent-red)', fontWeight: 600 }}>Tem certeza?</span>
              <Button variant="danger" size="sm" onClick={handleReset}>Sim, apagar tudo</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>Cancelar</Button>
            </div>
          )}
        </div>
      </Card>

      {/* SOBRE */}
      <Card style={{ padding: '28px' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '12px' }}>ℹ️ Sobre o Sistema</h3>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <p><strong>StudyPower Concursos</strong> v2.1</p>
          <p>Sistema completo de estudos para concursos públicos com inteligência artificial.</p>
        </div>
      </Card>

      {/* MODAL DE CONFIRMAÇÃO DE IMPORTAÇÃO */}
      {showImportConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <Card style={{ 
            padding: '32px', 
            maxWidth: '500px', 
            width: '90%',
            background: 'var(--bg-secondary)',
          }}>
            <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>
              Confirmar Importação
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', textAlign: 'center', lineHeight: '1.6' }}>
              Ao importar, <strong style={{ color: 'var(--accent-orange)' }}>TODOS os dados atuais serão SUBSTITUÍDOS</strong> pelos dados do backup.
              <br /><br />
              <strong>Arquivo:</strong> {arquivoImportar?.name}
              <br />
              <strong>Tamanho:</strong> {(arquivoImportar?.size / 1024).toFixed(2)} KB
              <br /><br />
              Tem certeza que deseja continuar?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => { setShowImportConfirm(false); setArquivoImportar(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleImportar} icon="📤">
                Sim, Importar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}