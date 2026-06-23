import { useState, useEffect } from "react";
import Layout from "./components/layout";

import Dashboard from "./pages/dashboard";
import ChatbotAI from "./pages/chatbot-ai";
import PICIT from "./pages/pic-it";
import KnowledgeBase from "./pages/knowledge-base";
import LaporkanKendala from "./pages/laporkan-kendala";
import TicketDetail from "./pages/ticket-detail";
import Pengaturan from "./pages/pengaturan";
import Laporan from "./pages/laporan";
import LandingPage from "./pages/landing-page";
import { LanguageProvider } from "./contexts/LanguageContext";

function App() {
  const [activePage, setActivePage] = useState("Landing");
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [showBell, setShowBell] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'Inggris';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const renderPage = () => {
    if (activePage.startsWith("TicketDetail_")) {
      const ticketId = activePage.split("_")[1];
      return <TicketDetail ticketId={ticketId} goBack={() => setActivePage("Tiket")} />;
    }

    switch (activePage) {
      case "Dashboard": return <Dashboard setActivePage={setActivePage} globalSearchTerm={globalSearchTerm} />;
      case "PIC": return <PICIT />;
      case "Knowledge Base": return <KnowledgeBase />;
      case "Tiket": return <LaporkanKendala setActivePage={setActivePage} globalSearchTerm={globalSearchTerm} />;
      case "Recurring Task": return <div className="flex items-center justify-center h-full text-slate-500 font-medium">Halaman Recurring Task belum tersedia</div>;
      case "Laporan": return <Laporan />;
      case "Pengaturan": return <Pengaturan theme={theme} setTheme={setTheme} showBell={showBell} setShowBell={setShowBell} language={language} setLanguage={setLanguage} />;
      default: return <Dashboard setActivePage={setActivePage} globalSearchTerm={globalSearchTerm} />;
    }
  };

  const getNavbarTitle = () => {
    if (activePage.startsWith("TicketDetail_")) {
      const parts = activePage.split("_");
      return parts.length > 2 ? parts.slice(2).join("_") : "Detail Tiket";
    }
    return activePage;
  };

  if (activePage === "Landing") {
    return (
      <>
        <LandingPage onGetStarted={() => setActivePage("Dashboard")} />
      </>
    );
  }

  return (
    <LanguageProvider currentLanguage={language}>
      <Layout activePage={activePage} navbarTitle={getNavbarTitle()} setActivePage={setActivePage} globalSearchTerm={globalSearchTerm} setGlobalSearchTerm={setGlobalSearchTerm} showBell={showBell}>
          <div className="w-full h-full relative">
          {/* Biarkan Chatbot selalu di-render (tidak di-unmount) agar state/loading AI tetap berjalan di background */}
          <div className={`w-full h-full absolute inset-0 ${activePage === "Chatbot AI" ? "block z-10" : "hidden -z-10"}`}>
            <ChatbotAI />
          </div>
          
          {/* Halaman lainnya di-render secara dinamis */}
          {activePage !== "Chatbot AI" && (
            <div key={activePage} className="w-full h-full relative z-0">
              {renderPage()}
            </div>
          )}
        </div>
      </Layout>
    </LanguageProvider>
  );
}

export default App;