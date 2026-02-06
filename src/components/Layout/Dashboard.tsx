import { useState } from 'react';
import { LogOut, User, TrendingUp, Settings, LayoutDashboard, Compass, PieChart, Bot } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TransactionForm } from '../Transaction/TransactionForm';
import { CartView } from '../Cart/CartView';
import { TransactionHistory } from '../Transaction/TransactionHistory';
import { UserProfile } from '../User/UserProfile';
import { Calendar } from '../../Reminders/Calendar';
import { ExploreFunds } from './ExploreFunds';
import '../../styles/dashboard.css';

// Main dashboard component
export function Dashboard() {
  const { client, signOut } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'explore' | 'portfolio' | 'advisor' | 'transaction' | 'history' | 'reminders'>('explore');
  const [cartRefreshKey, setCartRefreshKey] = useState(0);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [transactionInitialData, setTransactionInitialData] = useState<any>(null);

  // Refresh cart when item is added
  const handleAddToCart = () => {
    setCartRefreshKey((prev) => prev + 1);
  };

  const handleInvest = (fund: any) => {
    // Prepare the initial data for the transaction form
    const initialData: any = {
      scheme_name: fund.scheme_name || fund.name,
      amc_name: fund.amc_name || fund.amc,
      scheme_type: fund.scheme_type || fund.category,
      scheme_code: fund.scheme_code, 
      folio_no: fund.folio_no,
      is_bse_scheme: fund.is_bse_scheme,
      is_folio: fund.is_folio,
      nav: fund.nav,
      isin: fund.isin,
      transaction_type: fund.transaction_type || "Purchase"
    };

    setTransactionInitialData(initialData);
    setActiveView('transaction');
  };

  return (
    <div className="dashboard-shell" style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ width: '260px', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div className="sidebar-brand" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--color-primary)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
             <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Transaction Cart</span>
        </div>

        <nav className="sidebar-nav" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`nav-item ${activeView === 'dashboard' || activeView === 'history' || activeView === 'reminders' ? 'active' : ''}`}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', 
              backgroundColor: activeView === 'dashboard' || activeView === 'history' || activeView === 'reminders' ? '#1e293b' : 'transparent',
              color: activeView === 'dashboard' || activeView === 'history' || activeView === 'reminders' ? 'var(--color-primary)' : '#94a3b8',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', fontWeight: 500, width: '100%'
            }}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView('explore')}
            className={`nav-item ${activeView === 'explore' || activeView === 'transaction' ? 'active' : ''}`}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', 
              backgroundColor: activeView === 'explore' || activeView === 'transaction' ? 'var(--color-primary)' : 'transparent',
              color: activeView === 'explore' || activeView === 'transaction' ? 'white' : '#94a3b8',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', fontWeight: 500, width: '100%'
            }}
          >
            <Compass size={20} />
            Explore Funds
          </button>
           <button 
            onClick={() => setActiveView('portfolio')}
            className={`nav-item ${activeView === 'portfolio' ? 'active' : ''}`}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', 
              backgroundColor: activeView === 'portfolio' ? '#1e293b' : 'transparent',
              color: activeView === 'portfolio' ? 'var(--color-primary)' : '#94a3b8',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', fontWeight: 500, width: '100%'
            }}
          >
            <PieChart size={20} />
            My Portfolio
          </button>
           <button 
            onClick={() => setActiveView('advisor')}
            className={`nav-item ${activeView === 'advisor' ? 'active' : ''}`}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', 
              backgroundColor: activeView === 'advisor' ? '#1e293b' : 'transparent',
              color: activeView === 'advisor' ? '#6366f1' : '#94a3b8',
              border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', fontWeight: 500, width: '100%'
            }}
          >
            
          </button>
        </nav>
        
        <div className="sidebar-user" style={{ padding: '1.5rem', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client?.c_name || 'User'}</p>
                </div>
                <button onClick={() => setShowUserProfile(true)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} title="Edit Profile">
                    <Settings size={16} />
                </button>
            </div>
            <button onClick={signOut} style={{ width: '100%', padding: '0.5rem', background: '#334155', border: 'none', borderRadius: '0.375rem', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <LogOut size={16} /> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f3f4f6' }}>
        {activeView === 'explore' && <ExploreFunds onInvest={handleInvest} />}
        
        {activeView === 'transaction' && (
             <div className="dashboard-column" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <button onClick={() => setActiveView('explore')} style={{ border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>←</span> Back to Explore
                    </button>
                </div>
                <TransactionForm onAddToCart={handleAddToCart} initialData={transactionInitialData} />
                <CartView refreshKey={cartRefreshKey} />
             </div>
        )}

        {/* Dashboard View (Legacy + Tabs) */}
        {(activeView === 'dashboard' || activeView === 'history' || activeView === 'reminders') && (
            <div style={{ padding: '2rem' }}>
                <div className="dashboard-tabs" style={{ marginBottom: '2rem' }}>
                    <button 
                        className={`dashboard-tab ${activeView === 'dashboard' ? 'active' : ''}`} 
                        onClick={() => setActiveView('dashboard')}
                    >
                        Overview
                    </button>
                    <button 
                        className={`dashboard-tab ${activeView === 'history' ? 'active' : ''}`} 
                        onClick={() => setActiveView('history')}
                    >
                        History
                    </button>
                    <button 
                        className={`dashboard-tab ${activeView === 'reminders' ? 'active' : ''}`} 
                        onClick={() => setActiveView('reminders')}
                    >
                        Reminders
                    </button>
                </div>

                {activeView === 'dashboard' && (
                     <div className="overview-content">
                         <h2>Overview</h2>
                         <p>Welcome back, {client?.c_name}!</p>
                         <div style={{ marginTop: '2rem' }}>
                            <TransactionHistory />
                         </div>
                     </div>
                )}
                
                {activeView === 'history' && <TransactionHistory />}
                {activeView === 'reminders' && <Calendar />}
            </div>
        )}

        {activeView === 'portfolio' && (
             <div style={{ padding: '2rem' }}>
                <h2>My Portfolio</h2>
                <CartView refreshKey={cartRefreshKey} />
            </div>
        )}

        {activeView === 'advisor' && (
             <div style={{ padding: '2rem', textAlign: 'center', marginTop: '4rem' }}>
                <Bot size={64} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                <h2>AI Advisor</h2>
                <p style={{ color: '#64748b' }}>Coming soon! Your personal AI investment assistant.</p>
            </div>
        )}
      </main>
      
      {showUserProfile && <UserProfile onClose={() => setShowUserProfile(false)} />}
    </div>
  );
}
