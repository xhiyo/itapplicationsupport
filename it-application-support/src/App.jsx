import { useState, useEffect } from "react";
import Layout from "./components/layout";

import Dashboard from "./pages/dashboard";
import ChatbotAI from "./pages/chatbot-ai";
import PICIT from "./pages/pic-it";
import KnowledgeBase from "./pages/knowledge-base";
import LaporkanKendala from "./pages/laporkan-kendala";
import TicketDetail from "./pages/ticket-detail";
import Laporan from "./pages/laporan";
import Pengaturan from "./pages/pengaturan";
import LandingPage from "./pages/landing-page";
import ResetPassword from "./pages/auth/reset-password";
import { LanguageProvider } from "./contexts/LanguageContext";

function App() {
  // Auth State
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  const [activePage, setActivePage] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return token && user ? "Dashboard" : "Landing";
  });

  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [showBell, setShowBell] = useState(true);
  const [adminViewAs, setAdminViewAs] = useState('Semua PIC');
  
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

    if (!auth) {
      root.classList.add('light');
      return;
    }

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme, auth]);

  const renderPage = () => {
    if (activePage.startsWith("TicketDetail_")) {
      const ticketId = activePage.split("_")[1];
      return <TicketDetail ticketId={ticketId} goBack={() => setActivePage("Tiket")} />;
    }

    switch (activePage) {
      case "Dashboard": return <Dashboard setActivePage={setActivePage} globalSearchTerm={globalSearchTerm} adminViewAs={adminViewAs} setAdminViewAs={setAdminViewAs} />;
      case "PIC": return <PICIT user={auth.user} />;
      case "Knowledge Base": return <KnowledgeBase />;
      case "Tiket": return <LaporkanKendala setActivePage={setActivePage} globalSearchTerm={globalSearchTerm} user={auth.user} adminViewAs={adminViewAs} />;
      case "Recurring Task": return <div className="flex items-center justify-center h-full text-slate-500 font-medium">Halaman Recurring Task belum tersedia</div>;
      case "Laporan": return <Laporan setActivePage={setActivePage} user={auth.user} adminViewAs={adminViewAs} />;
      case "Pengaturan": return <Pengaturan theme={theme} setTheme={setTheme} showBell={showBell} setShowBell={setShowBell} language={language} setLanguage={setLanguage} />;
      default: return <Dashboard setActivePage={setActivePage} globalSearchTerm={globalSearchTerm} adminViewAs={adminViewAs} setAdminViewAs={setAdminViewAs} />;
    }
  };

  const getNavbarTitle = () => {
    if (activePage.startsWith("TicketDetail_")) {
      const parts = activePage.split("_");
      return parts.length > 2 ? parts.slice(2).join("_") : "Detail Tiket";
    }
    return activePage;
  };

  if (!auth) {
    if (activePage === "ResetPassword") {
      return <ResetPassword setActivePage={setActivePage} />;
    }
    return (
      <LandingPage
        onGetStarted={() => setActivePage("Dashboard")}
        setAuth={(data) => {
          setAuth(data);
          setActivePage("Dashboard");
        }}
        isAuthenticated={!!auth}
        setActivePage={setActivePage}
      />
    );
  }

  return (
    <LanguageProvider currentLanguage={language}>
      <Layout activePage={activePage} navbarTitle={getNavbarTitle()} setActivePage={setActivePage} globalSearchTerm={globalSearchTerm} setGlobalSearchTerm={setGlobalSearchTerm} showBell={showBell} user={auth.user} setAuth={setAuth}>
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
