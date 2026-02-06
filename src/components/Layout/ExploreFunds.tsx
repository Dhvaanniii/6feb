import { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import '../../styles/dashboard.css';
import '../../styles/explore-funds.css';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

const normalizeAmc = (name: string) =>
  String(name || '')
    .toLowerCase()
    .replace(/mutual\s+fund|asset\s+management|company|co\.|limited|ltd\.|amc/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const AMC_DOMAINS: Record<string, string[]> = {
  'sbi': ['sbimf.com'],
  'hdfc': ['hdfcfund.com', 'hdfcmf.com'],
  'icici prudential': ['icicipruamc.com', 'iciciprumf.com'],
  'axis': ['axismf.com'],
  'nippon india': ['nipponindiamf.com'],
  'kotak': ['kotakmf.com', 'kotak.com'],
  'aditya birla sun life': ['adityabirlacapital.com'],
  'dsp': ['dspim.com'],
  'franklin templeton': ['franklintempletonindia.com', 'franklintempleton.com'],
  'mirae asset': ['miraeassetmf.co.in', 'miraeasset.com'],
  'tata': ['tatamutualfund.com', 'tata.com'],
  'canara robeco': ['canararobeco.com'],
  'edelweiss': ['edelweissmf.com', 'edelweissfin.com'],
  'motilal oswal': ['motilaloswalmf.com', 'motilaloswal.com'],
  'pgim india': ['pgimindia.com'],
  'lic': ['licmf.com', 'licindia.in'],
  'union': ['unionmf.com', 'unionbankofindia.co.in'],
  'hsbc': ['hsbc.co.in', 'hsbc.com'],
  'quantum': ['quantumamc.com'],
  'baroda bnp paribas': ['barodabnpparibasmf.in', 'bnpparibas-am.com'],
  'bandhan': ['bandhanmutual.com', 'bandhanbank.com'],
  'jm financial': ['jmfinancialmf.com', 'jmfinancial.in'],
  'invesco': ['invescoindia.com', 'invesco.com'],
  'sundaram': ['sundarammutual.com', 'sundaramfinance.in'],
  'uti': ['utimf.com'],
  'quant': ['quantmutual.com'],
  'mahindra manulife': ['mahindramanulife.com'],
  'jm': ['jmfinancialmf.com']
};

const AMC_SYNONYMS: Record<string, string> = {
  'jm': 'jm financial',
  'jm mutual fund': 'jm financial',
  'mahindra': 'mahindra manulife',
  'manulife': 'mahindra manulife',
  'mahindra manulife': 'mahindra manulife',
  'icici': 'icici prudential',
  'icici prudential': 'icici prudential',
  'quant': 'quant',
  'aditya birla': 'aditya birla sun life',
  'absl': 'aditya birla sun life',
  'nippon': 'nippon india',
  'dsp': 'dsp',
  'uti': 'uti',
  'axis': 'axis',
  'sbi': 'sbi',
  'hdfc': 'hdfc',
  'kotak': 'kotak',
  'mirae': 'mirae asset'
};

const urlsFromKey = (key: string) => {
  const domains = AMC_DOMAINS[key] || [];
  const toFavicons = (d: string) => [
    `https://www.google.com/s2/favicons?domain=${d}&sz=128`,
     `https://icons.duckduckgo.com/ip3/${d}.ico`,
    `https://www.google.com/s2/favicons?domain=www.${d}&sz=128`,
  ];
  return domains.flatMap(toFavicons);
};

const getLogoUrls = (amc: string) => {
  const key = normalizeAmc(amc);
  return urlsFromKey(key);
};

const detectLogoKeyFromText = (text: string): string | null => {
  const n = normalizeAmc(text);
  const syn = Object.keys(AMC_SYNONYMS).find((s) => n.includes(s));
  if (syn) return AMC_SYNONYMS[syn];
  const direct = Object.keys(AMC_DOMAINS).find((k) => n.includes(k));
  return direct || null;
};

function FundLogoBadge(props: any) {
  const { amc, name, code, radius } = props;
  const [idx, setIdx] = useState(0);
  const urlsBase = getLogoUrls(amc);
  const detected = urlsBase.length ? urlsBase : (() => {
    const key = detectLogoKeyFromText(name);
    return key ? urlsFromKey(key) : [];
  })();
  if (!detected.length || idx === -1) return code;
  const src = detected[Math.max(0, Math.min(idx, detected.length - 1))];
  return (
    <img
      src={src}
      alt={amc}
      onError={() => {
        if (idx < detected.length - 1) setIdx((v: number) => v + 1);
        else setIdx(-1);
      }}
      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: radius ?? 12 }}
    />
  );
}

const pickKey = (obj: any, keys: string[]) => {
  const normalize = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
  return Object.keys(obj).find(k => {
    const nk = normalize(k);
    return keys.some(key => nk === normalize(key) || nk.includes(normalize(key)));
  });
};

interface ExploreFundsProps {
  onInvest: (fund: any) => void;
}

export function ExploreFunds({ onInvest }: ExploreFundsProps) {
  const { client } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [folioFunds, setFolioFunds] = useState<any[]>([]);
  const [allSchemes, setAllSchemes] = useState<any[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const categories = ['All', ...new Set(folioFunds.map((f: any) => f?.category).filter(Boolean))];
  const displayedFunds = selectedFilter === 'All'
    ? folioFunds
    : folioFunds.filter((f: any) => f?.category === selectedFilter);

  // Fetch Folio Balance (My Funds)
  useEffect(() => {
    const fetchFolioBalance = async () => {
      if (!client?.c_code) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token");
        const c_code = String(client.c_code).trim();
        const url = `${API_URL}/folio/balance${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ""}`;
        
        const res = await fetch(url, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        
        const data = await res.json();
        
        if (res.ok && Array.isArray(data)) {
          const transformed = data.map((row: any, index: number) => {
            const schemeNameKey: string = pickKey(row, ["SchemeName", "s_name", "scheme", "S_NAME"]) ?? "";
            const amcKey: string = pickKey(row, ["AMC", "amc_name", "amc"]) ?? "";
            const navKey: string = pickKey(row, ["Nav", "nav", "currentnav", "current_nav"]) ?? "";
            const valKey: string = pickKey(row, ["BalAmt", "bal_amt", "balamount", "currentvalue", "current_value"]) ?? "";
            const schemeCodeKey: string = pickKey(row, ["RTACode", "rta_code", "s_code", "sCode"]) ?? "";
            const natureKey: string = pickKey(row, ["Nature", "scheme_type", "type"]) ?? "";
            const folioKey: string = pickKey(row, ["FolioNo", "folioNo", "folio_no", "folio"]) ?? "";
            return {
              id: `folio-${index}`,
              code: row[schemeCodeKey] ? String(row[schemeCodeKey]).substring(0, 2).toUpperCase() : 'MF',
              name: row[schemeNameKey] || 'Unknown Fund',
              amc: row[amcKey] || 'Existing Holding',
              category: row[natureKey] || 'Existing',
              risk: 'Existing',
              nav: row[navKey] || 'N/A',
              returns1y: 'N/A',
              currentValue: row[valKey] || '0',
              color: '#10b981',
              is_folio: true,
              folio_no: row[folioKey],
              scheme_code: row[schemeCodeKey],
              original: row
            };
          });
          setFolioFunds(transformed);
        }
      } catch (err) {
        console.error("Error fetching folio balance:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFolioBalance();
  }, [client]);

  // Fetch All BSE Schemes for Search
  useEffect(() => {
    const fetchAllSchemes = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const url = `${API_URL}/bse-schemes`;
        const res = await fetch(url, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setAllSchemes(data);
        }
      } catch (err) {
        console.error("Error fetching all schemes:", err);
      }
    };
    fetchAllSchemes();
  }, []);

  // Handle Search
  useEffect(() => {
    if (!searchTerm.trim()) {
        setFilteredSchemes([]);
        setShowDropdown(false);
        return;
    }

    const lowerTerm = searchTerm.toLowerCase();
    const filtered = allSchemes.filter(scheme => 
        (scheme.Scheme_Name && scheme.Scheme_Name.toLowerCase().includes(lowerTerm)) ||
        (scheme.Scheme_Code && scheme.Scheme_Code.toLowerCase().includes(lowerTerm))
    ).slice(0, 50); // Limit to 50 results

    setFilteredSchemes(filtered);
    setShowDropdown(true);
  }, [searchTerm, allSchemes]);

  const handleSchemeSelect = (scheme: any) => {
      // Prepare fund object for Dashboard -> TransactionForm
      const fundData = {
          scheme_name: scheme.Scheme_Name,
          amc_name: scheme.AMC_Code || 'BSE Scheme', 
          scheme_type: scheme.Scheme_Type,
          scheme_code: scheme.Scheme_Code,
          is_bse_scheme: true,
          isin: scheme.ISIN,
          nav: 'N/A', // API doesn't return NAV for BSE schemes
          transaction_type: "Purchase" // Default to Purchase
      };
      onInvest(fundData);
      setShowDropdown(false);
      setSearchTerm('');
  };

  return (
    <div className="explore-funds-container">
      <div className="explore-header">
        <h1 className="explore-title">My Portfolio Funds</h1>
        <p className="explore-subtitle">Your existing investments and wealth overview.</p>
      </div>

      <div className="explore-controls">
        <div className="search-bar-container" style={{ maxWidth: '400px', width: '100%' }}>
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search to invest in new schemes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            onFocus={() => { if(searchTerm) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          
          {showDropdown && filteredSchemes.length > 0 && (
            <div className="search-dropdown">
              {filteredSchemes.map(scheme => (
                <div
                  key={scheme.Unique_No || scheme.Scheme_Code}
                  className="search-result-item"
                  onMouseDown={() => handleSchemeSelect(scheme)}
                >
                  <div className="result-name">{scheme.Scheme_Name}</div>
                  <div className="result-meta">
                    <span className="result-category">{scheme.Scheme_Type}</span>
                    {scheme.ISIN && <span className="result-isin">ISIN: {scheme.ISIN}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {folioFunds.length > 0 && (
          <div className="filters-container">
            {categories.map((category: any) => (
              <button
                key={category}
                className={`filter-button ${selectedFilter === category ? 'active' : 'inactive'}`}
                onClick={() => setSelectedFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="loading-container">
            <Loader className="animate-spin" />
        </div>
      ) : (
      <div className="funds-grid">
        {displayedFunds.length === 0 ? (
             <div className="no-funds-message">
                 {selectedFilter === 'All' ? (
                   <>
                     <p>No investments found in your portfolio.</p>
                     <p>Use the search bar above to start investing!</p>
                   </>
                 ) : (
                   <p>No {selectedFilter} funds found in your portfolio.</p>
                 )}
             </div>
        ) : (
        displayedFunds.map((fund: any) => (
          <div key={fund.id} className="fund-card">
            <div className="fund-header">
              <div className="fund-icon" style={{ backgroundColor: `${fund.color}20`, color: fund.color }}>
                <FundLogoBadge amc={fund.amc} name={fund.name} code={fund.code} radius={8} />
              </div>
              <span className={`risk-badge ${fund.risk.includes('High') ? 'risk-high' : fund.risk.includes('Low') ? 'risk-low' : 'risk-moderate'}`}>
                {fund.risk.toUpperCase()}
              </span>
            </div>

            <h3 className="fund-name">{fund.name}</h3>
            <p className="fund-meta">{fund.amc} • {fund.category}</p>

            <div className="fund-stats">
              <div>
                <p className="stat-label">NAV (₹)</p>
                <p className="stat-value">{fund.nav !== 'N/A' ? Number(fund.nav).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : 'N/A'}</p>
              </div>
              <div className="stat-right">
                <p className="stat-label">Current Value</p>
                <p className="stat-value-green">₹{Number(fund.currentValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
              </div>
            </div>

            <button
              onClick={() => onInvest(fund)}
              className="invest-button"
            >
              Invest More
            </button>
          </div>
        )))}
      </div>
      )}
    </div>
  );
}
