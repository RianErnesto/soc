import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CompartilharResumo({ resumo, onClose }) {
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const previewRef = useRef(null);

  if (!resumo) return null;

  const mostrarMensagem = (texto, tipo = 'sucesso') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 3000);
  };

  // Renderiza markdown como HTML pra preview e exportação
  const renderizarMarkdown = (texto) => {
    if (!texto) return '';
    return texto
      .split('\n')
      .map(linha => {
        if (linha.startsWith('### ')) return `<h3 style="color:#8b5cf6;font-size:16px;font-weight:700;margin:16px 0 8px 0;">${linha.replace('### ', '')}</h3>`;
        if (linha.startsWith('## ')) return `<h2 style="color:#4f7df9;font-size:18px;font-weight:700;margin:20px 0 10px 0;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">${linha.replace('## ', '')}</h2>`;
        if (linha.startsWith('# ')) return `<h1 style="color:#0f172a;font-size:22px;font-weight:800;margin:24px 0 12px 0;">${linha.replace('# ', '')}</h1>`;
        if (linha.match(/^\s*-\s/)) return `<li style="margin-left:24px;margin-bottom:4px;line-height:1.6;">${renderizarNegrito(linha.replace(/^\s*-\s/, ''))}</li>`;
        if (linha.match(/^\d+\.\s/)) return `<li style="margin-left:24px;margin-bottom:4px;line-height:1.6;list-style-type:decimal;">${renderizarNegrito(linha.replace(/^\d+\.\s/, ''))}</li>`;
        if (linha.trim() === '') return '<div style="height:6px;"></div>';
        return `<p style="margin-bottom:8px;line-height:1.7;color:#334155;">${renderizarNegrito(linha)}</p>`;
      })
      .join('');
  };

  const renderizarNegrito = (texto) => {
    return texto.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#4f7df9;">$1</strong>');
  };

  // 📄 Exportar como PDF
  const exportarPDF = async () => {
    setProcessando(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const larguraPagina = pdf.internal.pageSize.getWidth();
      const alturaPagina = pdf.internal.pageSize.getHeight();
      const larguraImg = larguraPagina - 20; // margem de 10mm de cada lado
      const alturaImg = (canvas.height * larguraImg) / canvas.width;
      
      let alturaRestante = alturaImg;
      let posicaoY = 10;
      
      pdf.addImage(imgData, 'PNG', 10, posicaoY, larguraImg, alturaImg);
      alturaRestante -= (alturaPagina - 20);
      
      // Se tiver mais de uma página
      while (alturaRestante > 0) {
        pdf.addPage();
        posicaoY = -(alturaImg - alturaRestante) + 10;
        pdf.addImage(imgData, 'PNG', 10, posicaoY, larguraImg, alturaImg);
        alturaRestante -= (alturaPagina - 20);
      }
      
      const nome = `resumo-${resumo.assunto.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
      pdf.save(nome);
      mostrarMensagem('✅ PDF baixado com sucesso!');
    } catch (err) {
      mostrarMensagem('❌ Erro ao gerar PDF: ' + err.message, 'erro');
    } finally {
      setProcessando(false);
    }
  };

  // 🖼️ Exportar como Imagem PNG
  const exportarImagem = async () => {
    setProcessando(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });
      
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resumo-${resumo.assunto.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        mostrarMensagem('✅ Imagem baixada com sucesso!');
      });
    } catch (err) {
      mostrarMensagem('❌ Erro ao gerar imagem: ' + err.message, 'erro');
    } finally {
      setProcessando(false);
    }
  };

  // 📋 Copiar Markdown
  const copiarMarkdown = () => {
    const texto = `# ${resumo.assunto}\n\n**Disciplina:** ${resumo.disciplina}\n**Nível:** ${resumo.nivel}\n**Criado em:** ${new Date(resumo.criadoEm).toLocaleDateString('pt-BR')}\n\n---\n\n${resumo.conteudo}\n\n---\n\n_Gerado pelo StudyPower Concursos_`;
    
    navigator.clipboard.writeText(texto).then(() => {
      mostrarMensagem('✅ Markdown copiado! Cole em Notion, Obsidian, etc.');
    }).catch(() => {
      mostrarMensagem('❌ Erro ao copiar', 'erro');
    });
  };

  // 📄 Copiar texto puro
  const copiarTextoPuro = () => {
    // Remove marcações markdown
    const textoLimpo = resumo.conteudo
      .replace(/#{1,6}\s/g, '')  // remove #
      .replace(/\*\*(.*?)\*\*/g, '$1')  // remove negritos
      .replace(/\*(.*?)\*/g, '$1')  // remove itálicos
      .replace(/`(.*?)`/g, '$1');  // remove código
    
    const texto = `${resumo.assunto}\n${resumo.disciplina} - Nível: ${resumo.nivel}\n\n${textoLimpo}\n\n--- StudyPower Concursos ---`;
    
    navigator.clipboard.writeText(texto).then(() => {
      mostrarMensagem('✅ Texto copiado!');
    }).catch(() => {
      mostrarMensagem('❌ Erro ao copiar', 'erro');
    });
  };

  // 💾 Baixar como TXT
  const baixarTXT = () => {
    const texto = `${resumo.assunto}\n${'='.repeat(resumo.assunto.length)}\n\nDisciplina: ${resumo.disciplina}\nNível: ${resumo.nivel}\nCriado em: ${new Date(resumo.criadoEm).toLocaleDateString('pt-BR')}\n\n${'-'.repeat(50)}\n\n${resumo.conteudo}\n\n${'-'.repeat(50)}\n\nGerado pelo StudyPower Concursos\n${new Date().toLocaleString('pt-BR')}`;
    
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resumo-${resumo.assunto.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    mostrarMensagem('✅ Arquivo TXT baixado!');
  };

  // 🖨️ Imprimir
  const imprimir = () => {
    const janela = window.open('', '_blank');
    janela.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${resumo.assunto} - Resumo</title>
        <meta charset="UTF-8">
        <style>
          @media print {
            @page { margin: 2cm; }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            border-bottom: 3px solid #4f7df9;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .titulo {
            font-size: 24px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 8px;
          }
          .meta {
            color: #64748b;
            font-size: 12px;
          }
          .meta span {
            display: inline-block;
            padding: 3px 10px;
            background: #f1f5f9;
            border-radius: 6px;
            margin-right: 8px;
            margin-top: 4px;
          }
          h1 { font-size: 22px; color: #0f172a; margin-top: 20px; }
          h2 { font-size: 18px; color: #4f7df9; margin-top: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
          h3 { font-size: 16px; color: #8b5cf6; margin-top: 16px; }
          p { margin: 8px 0; }
          strong { color: #4f7df9; }
          ul, ol { margin-left: 24px; }
          li { margin: 4px 0; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="titulo">📝 ${resumo.assunto}</div>
          <div class="meta">
            <span>📚 ${resumo.disciplina}</span>
            <span>⚡ Nível: ${resumo.nivel}</span>
            <span>📅 ${new Date(resumo.criadoEm).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <div>${renderizarMarkdown(resumo.conteudo)}</div>
        <div class="footer">
          Gerado pelo <strong>StudyPower Concursos</strong> • ${new Date().toLocaleString('pt-BR')}
        </div>
      </body>
      </html>
    `);
    janela.document.close();
    setTimeout(() => janela.print(), 500);
    mostrarMensagem('🖨️ Janela de impressão aberta!');
  };

  // 📱 Compartilhar via WhatsApp
  const compartilharWhatsApp = () => {
    const texto = `📝 *${resumo.assunto}*\n📚 ${resumo.disciplina}\n\n${resumo.conteudo.substring(0, 500)}...\n\n_Resumo criado no StudyPower Concursos_ 🎯`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
    mostrarMensagem('📱 Abrindo WhatsApp...');
  };

  // 📧 Compartilhar via Email
  const compartilharEmail = () => {
    const assunto = `Resumo: ${resumo.assunto}`;
    const corpo = `Olá!\n\nCompartilho com você um resumo sobre ${resumo.assunto} (${resumo.disciplina}):\n\n${resumo.conteudo}\n\n---\nCriado no StudyPower Concursos`;
    const url = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = url;
    mostrarMensagem('📧 Abrindo cliente de email...');
  };

  // 📨 Compartilhar via Telegram
  const compartilharTelegram = () => {
    const texto = `📝 ${resumo.assunto}\n📚 ${resumo.disciplina}\n\n${resumo.conteudo.substring(0, 1000)}...`;
    const url = `https://t.me/share/url?url=${encodeURIComponent('StudyPower Concursos')}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
    mostrarMensagem('📨 Abrindo Telegram...');
  };

  return (
    <div
      style={{
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
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          width: '95%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              📤 Compartilhar Resumo
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {resumo.assunto} • {resumo.disciplina}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '20px',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Conteúdo com layout de duas colunas */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 400px)', 
          gap: '20px', 
          padding: '20px',
        }}>
          {/* PREVIEW */}
          <div>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              fontWeight: 700, 
              marginBottom: '10px',
            }}>
              👁️ Preview
            </div>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              overflow: 'auto',
              maxHeight: '65vh',
              border: '1px solid var(--border-color)',
            }}>
              <div 
                ref={previewRef}
                style={{
                  padding: '30px',
                  color: '#333',
                  fontFamily: 'Arial, sans-serif',
                  background: '#fff',
                  minWidth: '500px',
                }}
              >
                <div style={{
                  borderBottom: '3px solid #4f7df9',
                  paddingBottom: '12px',
                  marginBottom: '20px',
                }}>
                  <h1 style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: '0 0 8px 0',
                  }}>
                    📝 {resumo.assunto}
                  </h1>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: '#eff6ff', color: '#4f7df9', borderRadius: '6px', marginRight: '8px', marginTop: '4px' }}>
                      📚 {resumo.disciplina}
                    </span>
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: '#f3e8ff', color: '#8b5cf6', borderRadius: '6px', marginRight: '8px', marginTop: '4px' }}>
                      ⚡ Nível: {resumo.nivel}
                    </span>
                    <span style={{ display: 'inline-block', padding: '3px 10px', background: '#f1f5f9', color: '#64748b', borderRadius: '6px', marginTop: '4px' }}>
                      📅 {new Date(resumo.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: renderizarMarkdown(resumo.conteudo) }} />
                <div style={{
                  marginTop: '40px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e2e8f0',
                  textAlign: 'center',
                  fontSize: '11px',
                  color: '#94a3b8',
                }}>
                  Gerado pelo <strong style={{ color: '#4f7df9' }}>StudyPower Concursos</strong> 🎯
                </div>
              </div>
            </div>
          </div>

          {/* OPÇÕES DE EXPORTAÇÃO */}
          <div>
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              fontWeight: 700, 
              marginBottom: '10px',
            }}>
              💾 Baixar Arquivo
            </div>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={exportarPDF}
                disabled={processando}
                style={{
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: processando ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: processando ? 0.5 : 1,
                  transition: 'transform 0.2s',
                }}
                onMouseOver={e => !processando && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '24px' }}>📄</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div>PDF Profissional</div>
                  <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 400 }}>Ideal para imprimir ou compartilhar</div>
                </div>
              </button>

              <button
                onClick={exportarImagem}
                disabled={processando}
                style={{
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: processando ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: processando ? 0.5 : 1,
                  transition: 'transform 0.2s',
                }}
                onMouseOver={e => !processando && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '24px' }}>🖼️</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div>Imagem PNG</div>
                  <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 400 }}>Para redes sociais e mensagens</div>
                </div>
              </button>

              <button
                onClick={baixarTXT}
                disabled={processando}
                style={{
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #64748b, #475569)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '24px' }}>💾</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div>Arquivo TXT</div>
                  <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 400 }}>Texto puro, sem formatação</div>
                </div>
              </button>

              <button
                onClick={imprimir}
                style={{
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: '24px' }}>🖨️</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div>Imprimir</div>
                  <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 400 }}>Envia para impressora ou PDF</div>
                </div>
              </button>
            </div>

            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              fontWeight: 700, 
              marginBottom: '10px',
            }}>
              📋 Copiar Texto
            </div>
            <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={copiarMarkdown}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '10px',
                  color: 'var(--accent-purple)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '20px' }}>📝</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div>Copiar como Markdown</div>
                  <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>Para Notion, Obsidian, etc.</div>
                </div>
              </button>

              <button
                onClick={copiarTextoPuro}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(79,125,249,0.1)',
                  border: '1px solid rgba(79,125,249,0.3)',
                  borderRadius: '10px',
                  color: 'var(--accent-blue)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '20px' }}>📃</span>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div>Copiar Texto Puro</div>
                  <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>Sem marcações, texto limpo</div>
                </div>
              </button>
            </div>

            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              fontWeight: 700, 
              marginBottom: '10px',
            }}>
              🚀 Compartilhar
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                onClick={compartilharWhatsApp}
                style={{
                  padding: '14px 8px',
                  background: 'rgba(37,211,102,0.1)',
                  border: '1px solid rgba(37,211,102,0.3)',
                  borderRadius: '10px',
                  color: '#25d366',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>💬</div>
                WhatsApp
              </button>
              <button
                onClick={compartilharTelegram}
                style={{
                  padding: '14px 8px',
                  background: 'rgba(0,136,204,0.1)',
                  border: '1px solid rgba(0,136,204,0.3)',
                  borderRadius: '10px',
                  color: '#0088cc',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>✈️</div>
                Telegram
              </button>
              <button
                onClick={compartilharEmail}
                style={{
                  padding: '14px 8px',
                  background: 'rgba(234,88,12,0.1)',
                  border: '1px solid rgba(234,88,12,0.3)',
                  borderRadius: '10px',
                  color: '#ea580c',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📧</div>
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé com mensagem */}
        {mensagem && (
          <div style={{
            padding: '12px 24px',
            background: mensagem.tipo === 'sucesso' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            borderTop: `1px solid ${mensagem.tipo === 'sucesso' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            color: mensagem.tipo === 'sucesso' ? 'var(--accent-green)' : 'var(--accent-red)',
            fontWeight: 600,
            fontSize: '13px',
            textAlign: 'center',
            animation: 'slideInUp 0.3s ease',
          }}>
            {mensagem.texto}
          </div>
        )}

        {processando && (
          <div style={{
            padding: '12px 24px',
            background: 'rgba(79,125,249,0.1)',
            borderTop: '1px solid var(--accent-blue)',
            color: 'var(--accent-blue)',
            fontWeight: 600,
            fontSize: '13px',
            textAlign: 'center',
          }}>
            ⏳ Gerando arquivo, aguarde alguns segundos...
          </div>
        )}
      </div>
    </div>
  );
}