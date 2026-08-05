import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Dashboard from './modules/Dashboard';
import EditalImport from './modules/EditalImport';
import Cronograma from './modules/Cronograma';
import Questoes from './modules/Questoes';
import Simulado from './modules/Simulado';
import CadernoErros from './modules/CadernoErros';
import Flashcards from './modules/Flashcards';
import Resumos from './modules/Resumos';
import Desempenho from './modules/Desempenho';
import Configuracoes from './modules/Configuracoes';
import AnaliseIA from './modules/AnaliseIA';
import Personalizacao from './modules/Personalizacao';
import ChatProfessor from './modules/ChatProfessor';
import MinhasProvas from './modules/MinhasProvas';
import PomodoroTimer from './components/PomodoroTimer';
import BuscaGlobal from './components/BuscaGlobal';
import { DataProvider, useData } from './context/DataContext';
import { aplicarTema } from './utils/temas';

function AppContent() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data } = useData();

  // 🎨 Aplica o tema sempre que as configurações mudarem
  useEffect(() => {
    aplicarTema(data.configuracoes);
  }, [data.configuracoes]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard onNavigate={setActiveModule} />;
      case 'editais': return <EditalImport />;
      case 'provas': return <MinhasProvas />;
      case 'cronograma': return <Cronograma />;
      case 'questoes': return <Questoes />;
      case 'simulado': return <Simulado />;
      case 'caderno': return <CadernoErros />;
      case 'flashcards': return <Flashcards />;
      case 'resumos': return <Resumos />;
      case 'chat': return <ChatProfessor />;
      case 'desempenho': return <Desempenho />;
      case 'analise': return <AnaliseIA />;
      case 'personalizacao': return <Personalizacao />;
      case 'configuracoes': return <Configuracoes />;
      default: return <Dashboard onNavigate={setActiveModule} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        active={activeModule}
        onSelect={setActiveModule}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? '70px' : '260px',
        padding: '24px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
      }}>
        {renderModule()}
      </main>
      <PomodoroTimer />
      <BuscaGlobal onNavigate={setActiveModule} />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}