import { useState, useEffect } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { AMC, SchemeType, Scheme } from "../../lib/types";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/dashboard.css";
import "../../styles/transaction-form.css";
import "../../styles/quick-invest.css";
import { SearchableSelect } from "../common/SearchableSelect";

const TRANSACTION_TYPES = ["Purchase", "Redemption", "Switch", "X-SIP", "I-SIP", "SPREAD", "STP", "SWP"];
const FREQUENCIES = ["Daily", "Fortnightly", "Monthly", "Quarterly", "Yearly"];
const MANDATE_IDS = ["MANDATE-001", "MANDATE-002", "MANDATE-003"];
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

type BSEScheme = {
  ID: number;
  Unique_No?: string;
  Scheme_Code: string;
  ISIN: string;
  AMC_Code: string;
  Scheme_Name: string;
  RTA_Scheme_Code?: string;
  AMC_Scheme_Code?: string;
  SIP_FLAG?: string;
  STP_FLAG?: string;
  SWP_FLAG?: string;
  Purchase_Allowed?: string;
  Redemption_Allowed?: string;
};

type FormState = {
  // Common fields (visible in all transactions)
  client_search_type: string;
  client_name: string;
  transaction_type: string;
  amc_name: string;
  scheme_type: string;
  is_bse_scheme: boolean;
  scheme_code: string;
  scheme_name: string;
  nav: string;
  portfolio_type: string;
  remarks: string;
  keep_client_selected: boolean;
  keep_scheme_selected: boolean;
  
  // I-SIP and NORMAL SIP fields
  txn_type: string; // Fresh / Additional
  installment_amount: string;
  number_of_installments: string;
  folio_number: string;
  sip_frequency: string;
  sip_date: string;
  start_date: string;
  first_order_flag: boolean;
  mandate_id: string;
  balance_units: string;
  current_value: string;
  
  // Redemption fields
  bank_account_id: string;
  redeem_amount: string;
  redeem_units: string;
  redeem_all_units: boolean;
  
  // SPREAD fields
  investment_amount: string;
  redemption_amount: string;
  redemption_date: string;
  
  // STP fields
  scheme_from: string;
  scheme_to: string;
  stp_amount: string;
  stp_frequency: string;
  stp_number_of_installments: string;
  stp_first_order_flag: boolean;
  stp_start_date: string;
  stp_end_date: string;
  
  // SWITCH fields
  switch_amount: string;
  switch_units: string;
  target_scheme: string;
  source_scheme: string;
  
  // SWP fields
  withdrawal_amount: string;
  withdrawal_units: string;
  swp_frequency: string;
  swp_number_of_installments: string;
  swp_start_date: string;
  swp_end_date: string;
  
  // X-SIP fields (similar to I-SIP)
  x_sip_frequency: string;
  x_sip_date: string;
  x_sip_start_date: string;
  x_sip_first_order_flag: boolean;
  x_sip_mandate_id: string;
  
  // PURCHASE fields
  client_code: string;
  amount: string;
  units: string;
  all_units: boolean;
  frequency: string;
  sip_day: string;
  
  // Common fields used across multiple transaction types
  amc_id: string;
  type_id: string;
  scheme_to_code: string;
  comment: string;
  end_date: string;
  keep_client_blocked: boolean;
  keep_scheme_blocked: boolean;
  bank_name: string;
  quantity: string;
  isin: string;
  folio_no: string;
  bse_scheme: boolean;
  bal_unit: string;
  
  // Legacy fields referenced in code
  portfolio: string;
  no_of_installments: string;
  sip_date_day_allowed: string;
  sip_start_date: string;
  swp_no_of_installments: string;
  stp_no_of_installments: string;
  bank_acc_no: string;
  tin_type: string;
};

const getDefaultStartDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const createInitialFormState = (): FormState => ({
  // Common fields (visible in all transactions)
  client_search_type: "Name",
  client_name: "",
  transaction_type: "Purchase",
  amc_name: "",
  scheme_type: "",
  is_bse_scheme: false,
  scheme_code: "",
  scheme_name: "",
  nav: "",
  portfolio_type: "",
  remarks: "",
  keep_client_selected: false,
  keep_scheme_selected: false,
  
  // I-SIP and NORMAL SIP fields
  txn_type: "Fresh",
  installment_amount: "",
  number_of_installments: "",
  folio_number: "",
  sip_frequency: FREQUENCIES[2],
  sip_date: "1",
  start_date: getDefaultStartDate(),
  first_order_flag: false,
  mandate_id: MANDATE_IDS[0],
  balance_units: "",
  current_value: "",
  
  // Redemption fields
  bank_account_id: "",
  redeem_amount: "",
  redeem_units: "",
  redeem_all_units: false,
  
  // SPREAD fields
  investment_amount: "",
  redemption_amount: "",
  redemption_date: "",
  
  // STP fields
  scheme_from: "",
  scheme_to: "",
  stp_amount: "",
  stp_frequency: FREQUENCIES[2],
  stp_number_of_installments: "",
  stp_start_date: getDefaultStartDate(),
  stp_end_date: "",
  stp_first_order_flag: false,
  
  // SWITCH fields
  switch_amount: "",
  switch_units: "",
  target_scheme: "",
  source_scheme: "",
  
  // SWP fields
  withdrawal_amount: "",
  withdrawal_units: "",
  swp_frequency: FREQUENCIES[2],
  swp_number_of_installments: "",
  swp_start_date: getDefaultStartDate(),
  swp_end_date: "",
  
  // X-SIP fields (similar to I-SIP)
  x_sip_frequency: FREQUENCIES[2],
  x_sip_date: "1",
  x_sip_start_date: getDefaultStartDate(),
  x_sip_first_order_flag: false,
  x_sip_mandate_id: MANDATE_IDS[0],
  
  // PURCHASE fields
  client_code: "",
  amount: "",
  units: "",
  all_units: false,
  frequency: FREQUENCIES[2],
  sip_day: "1",
  
  // Common fields used across multiple transaction types
  amc_id: "",
  type_id: "",
  scheme_to_code: "",
  comment: "",
  end_date: "",
  keep_client_blocked: false,
  keep_scheme_blocked: false,
  bank_name: "",
  quantity: "",
  isin: "",
  folio_no: "",
  bse_scheme: false,
  bal_unit: "",
  
  // Legacy fields referenced in code
  portfolio: "",
  no_of_installments: "",
  sip_date_day_allowed: "1",
  sip_start_date: getDefaultStartDate(),
  swp_no_of_installments: "",
  stp_no_of_installments: "",
  bank_acc_no: "",
  tin_type: "",
});

// Transaction form component
export function TransactionForm({ onAddToCart, initialData }: { onAddToCart: () => void; initialData?: Partial<FormState>; }) {
  const { client } = useAuth();
  const [amcList, setAmcList] = useState<AMC[]>([]);
  const [schemeTypes, setSchemeTypes] = useState<SchemeType[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
  const [folioOptions, setFolioOptions] = useState<{ label: string; value: string }[]>([]);
  const [bankOptions, setBankOptions] = useState<{ label: string; value: string }[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [manualFolio, setManualFolio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [folioBalanceRows, setFolioBalanceRows] = useState<Record<string, any>[]>([]);
  const [folioDetailsRows, setFolioDetailsRows] = useState<Record<string, any>[]>([]);
  const [folioBalanceLoading, setFolioBalanceLoading] = useState(false);
  const [folioDetailsLoading, setFolioDetailsLoading] = useState(false);
  const [showFolioBalance, setShowFolioBalance] = useState(false);
  const [showFolioDetails, setShowFolioDetails] = useState(false);
  const [showSchemeSelection, setShowSchemeSelection] = useState(false);

  // BSE Scheme states
  const [bseSchemes, setBseSchemes] = useState<BSEScheme[]>([]);
  const [filteredBseSchemes, setFilteredBseSchemes] = useState<BSEScheme[]>([]);
  const [bseSearchType, setBseSearchType] = useState<"ISIN" | "Name">("ISIN");
  const [bseSearchTerm, setBseSearchTerm] = useState("");
  const [bseLoading, setBseLoading] = useState(false);

  const [formData, setFormData] = useState<FormState>(createInitialFormState);

  // Load master data on mount
  useEffect(() => {
    loadMasterData();
    loadFolioOptions();
  }, []);

  useEffect(() => {
    if (!client) return;
    setFormData((prev) => ({
      ...prev,
      client_name: client.c_name,
    }));
    loadFolioOptions();
    loadBankOptions();
    loadFolioBalance(); // Always load folio balance for auto-fill
    if (showFolioDetails) loadFolioDetails();
  }, [client]);

  // Apply initial data if provided
  useEffect(() => {
    if (initialData) {
      const newFormData = { ...initialData };
      
      // If it's a BSE scheme (New Investment)
      if (initialData.is_bse_scheme) {
         // Handle Folio for Fresh Purchase
         if (!initialData.folio_no) {
             setManualFolio(true);
             newFormData.folio_no = "New";
         }
         
         // Handle Search Dropdown pre-fill
         if (initialData.scheme_code) {
             if (initialData.isin) {
                setBseSearchType("ISIN");
                setBseSearchTerm(initialData.isin);
             } else if (initialData.scheme_name) {
                setBseSearchType("Name");
                setBseSearchTerm(initialData.scheme_name);
             }
         }
      }

      setFormData((prev) => ({
        ...prev,
        ...newFormData
      }));
    }
  }, [initialData]);

  // Auto-fill balance when folio and scheme are selected
  useEffect(() => {
    if (formData.folio_no && formData.scheme_code && folioBalanceRows.length > 0) {
      // Find matching row in folioBalanceRows
      // We perform a loose match similar to selectBalanceRow
      const normalize = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      const match = folioBalanceRows.find(row => {
        // Find folio key
        const folioKeys = ["FolioNo", "folioNo", "folio_no", "folio"];
        const folioKey = Object.keys(row).find(k => {
           const nk = normalize(k);
           return folioKeys.some(fk => nk === normalize(fk) || nk.includes(normalize(fk)));
        });
        
        // Find scheme code key
        const schemeKeys = ["RTACode", "rta_code", "s_code", "sCode", "schemecode", "scheme_code", "scode"];
        const schemeKey = Object.keys(row).find(k => {
           const nk = normalize(k);
           return schemeKeys.some(sk => nk === normalize(sk) || nk.includes(normalize(sk)));
        });
        
        const rowFolio = folioKey && row[folioKey] ? String(row[folioKey]).trim() : "";
        const rowScheme = schemeKey && row[schemeKey] ? String(row[schemeKey]).trim() : "";
        
        return rowFolio === formData.folio_no && rowScheme === formData.scheme_code;
      });

      if (match) {
         // Find qty and amt keys
         const qtyKeys = ["BalQty", "bal_qty", "balunit", "bal_unit", "unit", "qty"];
         const amtKeys = ["BalAmt", "bal_amt", "balamount", "currentvalue", "current_value", "amount", "amt"];
         
         const qtyKey = Object.keys(match).find(k => {
           const nk = normalize(k);
           return qtyKeys.some(qk => nk === normalize(qk) || nk.includes(normalize(qk)));
         });
         
         const amtKey = Object.keys(match).find(k => {
           const nk = normalize(k);
           return amtKeys.some(ak => nk === normalize(ak) || nk.includes(normalize(ak)));
         });
         
         const qtyValue = qtyKey && match[qtyKey] ? String(match[qtyKey]).trim() : "";
         const amtValue = amtKey && match[amtKey] ? String(match[amtKey]).trim() : "";
         
         setFormData(prev => ({
           ...prev,
           bal_unit: qtyValue || prev.bal_unit,
           current_value: amtValue || prev.current_value
         }));
      }
    }
  }, [formData.folio_no, formData.scheme_code, folioBalanceRows]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  // Filter schemes when AMC or type changes
  useEffect(() => {
    filterSchemes();
  }, [formData.amc_id, formData.type_id, schemes]);

  useEffect(() => {
    const scheme = schemes.find((s) => s.s_code === formData.scheme_code);
    if (!scheme) return;
    setFormData((prev) => ({
      ...prev,
      amc_name: scheme.amc || prev.amc_name,
      scheme_type: scheme.type || prev.scheme_type,
    }));
  }, [formData.scheme_code, schemes]);

  // Load schemes and extract AMC/types
  const loadMasterData = async () => {
    try {
      setError("");
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const url = `${API_URL}/schemes?take=20000`;
      let res = await fetch(url, { headers });
      if (!res.ok && token) {
        res = await fetch(url);
      }
      if (!res.ok) throw new Error("Failed to load schemes..!");
      const data: Scheme[] = await res.json();
      setSchemes(data);

      const amcMap = new Map<string, AMC>();
      const typeMap = new Map<string, SchemeType>();
      data.forEach((s) => {
        const amcName = String(s.amc ?? "").trim();
        const typeName = String(s.type ?? "").trim();
        if (amcName && !amcMap.has(amcName)) {
          amcMap.set(amcName, { id: amcName, amc_name: amcName, is_active: true } as AMC);
        }
        if (typeName && !typeMap.has(typeName)) {
          typeMap.set(typeName, { id: typeName, type_name: typeName, is_active: true } as SchemeType);
        }
      });
      setAmcList(Array.from(amcMap.values()));
      setSchemeTypes(Array.from(typeMap.values()));
    } catch (err) {
      console.error("Error loading master data:", err);
      setSchemes([]);
      setFilteredSchemes([]);
      setAmcList([]);
      setSchemeTypes([]);
      setError(err instanceof Error ? err.message : "Failed to load master data");
    }
  };

  const loadFolioOptions = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const c_code = client?.c_code ? String(client.c_code).trim() : "";
      if (!token && !c_code) return;
      const url = `${API_URL}/folio/folios${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Failed to load folios");
      const data: { folio_no?: string }[] = await res.json();
      const folios = Array.from(new Set(data.map((t) => t.folio_no).filter((folio): folio is string => Boolean(folio))));
      setFolioOptions(folios.map((folio) => ({ label: folio, value: folio })));
    } catch (err) {
      console.error("Error loading folios:", err);
    }
  };



  const loadBankOptions = async () => {
    try {
      setBankLoading(true);
      const token = localStorage.getItem("auth_token");
      const bsClientCode = client?.bse_code ? String(client.bse_code).trim() : "";
      
      if (!token && !bsClientCode) {
        console.log("No token or BSE code available, skipping bank options");
        setBankOptions([]);
        return;
      }

      const params = bsClientCode ? `?bs_client_code=${encodeURIComponent(bsClientCode)}` : "";
      const url = `${API_URL}/folio/bank-details${params}`;
      console.log("Loading bank options from:", url);
      
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      
      if (!res.ok) {
        console.warn(`Bank details API returned ${res.status}: ${res.statusText}`);
        setBankOptions([]);
        return;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.warn("Bank details API returned non-JSON response:", contentType);
        setBankOptions([]);
        return;
      }

      const data = await res.json();
      console.log("Bank options loaded:", data?.length || 0);
      
      const rows: Record<string, any>[] = Array.isArray(data) ? data : [];
      const options = rows
        .map((r) => ({
          value: String(r.AccNo ?? r.accno ?? "").trim(),
          label: String(r.BankName ?? r.bankname ?? "").trim(),
        }))
        .filter((o) => o.value && o.label && o.value !== "0");
      setBankOptions(options);
    } catch (err) {
      console.error("Error loading bank details:", err);
      setBankOptions([]);
    } finally {
      setBankLoading(false);
    }
  };

  const loadFolioBalance = async () => {
    try {
      setFolioBalanceLoading(true);
      const token = localStorage.getItem("auth_token");
      const c_code = client?.c_code ? String(client.c_code).trim() : "";
      if (!token && !c_code) {
        setFolioBalanceRows([]);
        return;
      }
      const url = `${API_URL}/folio/balance${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load folio balance");
      setFolioBalanceRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading folio balance:!", err);
      setFolioBalanceRows([]);
    } finally {
      setFolioBalanceLoading(false);
    }
  };

  const loadFolioDetails = async () => {
    try {
      setFolioDetailsLoading(true);
      const token = localStorage.getItem("auth_token");
      const c_code = client?.c_code ? String(client.c_code).trim() : "";
      if (!token && !c_code) {
        setFolioDetailsRows([]);
        return;
      }
      const url = `${API_URL}/folio/details${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load folio details");
      setFolioDetailsRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading folio details:", err);
      setFolioDetailsRows([]);
    } finally {
      setFolioDetailsLoading(false);
    }
  };

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

  const pickKey = (row: Record<string, any>, preferred: string[]) => {
    const normalized = Object.keys(row).map((k) => ({ k, n: normalizeKey(k) }));
    for (const p of preferred) {
      const pn = normalizeKey(p);
      const hit = normalized.find((x) => x.n === pn) ?? normalized.find((x) => x.n.includes(pn));
      if (hit) return hit.k;
    }
    return null;
  };

  const buildColumns = (rows: Record<string, any>[], preferred: string[]) => {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    const preferredNormalized = preferred.map((p) => normalizeKey(p));
    const scored = keys.map((k) => {
      const nk = normalizeKey(k);
      const idx = preferredNormalized.findIndex((p) => nk === p || nk.includes(p));
      return { k, idx: idx === -1 ? 9999 : idx };
    });
    return scored
      .sort((a, b) => a.idx - b.idx || a.k.localeCompare(b.k))
      .map((x) => x.k)
      .slice(0, 9);
  };

  const selectBalanceRow = (row: Record<string, any>) => {
    const folioKey = pickKey(row, ["FolioNo", "folioNo", "folio_no", "folio"]);
    const qtyKey = pickKey(row, ["BalQty", "bal_qty", "balunit", "bal_unit", "unit", "qty"]);
    const amtKey = pickKey(row, ["BalAmt", "bal_amt", "balamount", "currentvalue", "current_value", "amount", "amt"]);
    const schemeCodeKey = pickKey(row, ["RTACode", "rta_code", "s_code", "sCode", "schemecode", "scheme_code", "scode"]);
    const schemeNameKey = pickKey(row, ["SchemeName", "s_name", "scheme", "S_NAME"]);
    const natureKey = pickKey(row, ["Nature", "scheme_type", "type"]);

    const folioValue = folioKey && row[folioKey] !== null && row[folioKey] !== undefined ? String(row[folioKey]).trim() : "";
    const qtyValue = qtyKey && row[qtyKey] !== null && row[qtyKey] !== undefined ? String(row[qtyKey]).trim() : "";
    const amtValue = amtKey && row[amtKey] !== null && row[amtKey] !== undefined ? String(row[amtKey]).trim() : "";
    const schemeValue = schemeCodeKey && row[schemeCodeKey] !== null && row[schemeCodeKey] !== undefined ? String(row[schemeCodeKey]).trim() : "";
    const schemeNameValue = schemeNameKey && row[schemeNameKey] !== null && row[schemeNameKey] !== undefined ? String(row[schemeNameKey]).trim() : "";
    const natureValue = natureKey && row[natureKey] !== null && row[natureKey] !== undefined ? String(row[natureKey]).trim() : "";

    const matchedScheme = schemes.find((s) => s.s_code === schemeValue);

    if (folioValue) setManualFolio(false);
    setFormData((prev) => {
      const nextUnits =
        prev.transaction_type === "Redemption" && (!prev.units || prev.units === "")
          ? qtyValue || prev.units
          : prev.units;
      return {
        ...prev,
        folio_no: folioValue || prev.folio_no,
        bal_unit: qtyValue || prev.bal_unit,
        current_value: amtValue || prev.current_value,
        scheme_code: matchedScheme ? matchedScheme.s_code : schemeValue || prev.scheme_code,
        amc_name: matchedScheme?.amc || prev.amc_name,
        scheme_type: natureValue || matchedScheme?.type || prev.scheme_type,
        comment: schemeNameValue ? `${prev.comment ? prev.comment + " | " : ""}${schemeNameValue}` : prev.comment,
        units: nextUnits,
      };
    });
    setShowFolioBalance(false);
  };
  const selectDetailsRow = (row: Record<string, any>) => {
    const folioKey = pickKey(row, ["FolioNo", "folio", "folio_no"]);
    const schemeCodeKey = pickKey(row, ["Scheme_Code", "RTACode", "s_code", "schemecode", "scode"]);
    const schemeNameKey = pickKey(row, ["SchemeName", "s_name", "scheme"]);
    const natureKey = pickKey(row, ["Nature", "scheme_type", "type"]);
    const folioValue = folioKey && row[folioKey] !== null && row[folioKey] !== undefined ? String(row[folioKey]).trim() : "";
    const schemeValue = schemeCodeKey && row[schemeCodeKey] !== null && row[schemeCodeKey] !== undefined ? String(row[schemeCodeKey]).trim() : "";
    const schemeNameValue = schemeNameKey && row[schemeNameKey] !== null && row[schemeNameKey] !== undefined ? String(row[schemeNameKey]).trim() : "";
    const natureValue = natureKey && row[natureKey] !== null && row[natureKey] !== undefined ? String(row[natureKey]).trim() : "";
    const matchedScheme = schemes.find((s) => s.s_code === schemeValue);
    if (folioValue) setManualFolio(false);
    setFormData((prev) => ({
      ...prev,
      folio_no: folioValue || prev.folio_no,
      scheme_code: matchedScheme ? matchedScheme.s_code : schemeValue || prev.scheme_code,
      amc_name: matchedScheme?.amc || prev.amc_name,
      scheme_type: natureValue || matchedScheme?.type || prev.scheme_type,
      comment: schemeNameValue ? `${prev.comment ? prev.comment + " | " : ""}${schemeNameValue}` : prev.comment,
    }));
    setShowFolioDetails(false);
  };

  const renderDataTable = (rows: Record<string, any>[], preferredColumns: string[], onSelectRow?: (row: Record<string, any>) => void) => {
    if (!rows.length) {
      return (
        <div className="empty-state" style={{ padding: "1.25rem 0.5rem" }}>
          <p>No records found</p>
        </div>
      );
    }

    const columns = buildColumns(rows, preferredColumns);

    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {onSelectRow && <th style={{ width: 90 }}>Select</th>}
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 80).map((row, idx) => (
              <tr key={idx}>
                {onSelectRow && (
                  <td>
                    <button type="button" className="link-button" onClick={() => onSelectRow(row)}>
                      Select
                    </button>
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col}>{row[col] === null || row[col] === undefined ? "" : String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Filter schemes based on selected AMC and type
  const filterSchemes = () => {
    let filtered = schemes;
    if (formData.amc_id) filtered = filtered.filter((s) => s.amc === formData.amc_id);
    if (formData.type_id) filtered = filtered.filter((s) => s.type === formData.type_id);
    setFilteredSchemes(filtered);
  };

  const transactionTypeOptions = TRANSACTION_TYPES.map((type) => ({ label: type, value: type }));
  const amcOptions = [{ label: "All AMCs", value: "" }, ...amcList.sort((a, b) => a.amc_name.localeCompare(b.amc_name)).map((amc) => ({
    label: amc.amc_name,
    value: amc.id,
  }))];
  const schemeTypeOptions = [{ label: "All Types", value: "" }, ...schemeTypes.sort((a, b) => a.type_name.localeCompare(b.type_name)).map((type) => ({
    label: type.type_name,
    value: type.id,
  }))];
  const schemeOptions = filteredSchemes
    .sort((a, b) => a.s_name.localeCompare(b.s_name))
    .map((scheme) => ({ label: scheme.amc ? `${scheme.s_name} (${scheme.amc})` : scheme.s_name, value: scheme.s_code }));

  const selectedScheme = schemes.find((scheme) => scheme.s_code === formData.scheme_code);
  const schemeToOptions =
    selectedScheme
      ? schemes
          .filter((scheme) => scheme.amc === selectedScheme.amc && scheme.s_code !== selectedScheme.s_code)
          .sort((a, b) => a.s_name.localeCompare(b.s_name))
          .map((scheme) => ({ label: scheme.s_name, value: scheme.s_code }))
      : [];

  const isPurchase = formData.transaction_type === "Purchase";
  const isRedemption = formData.transaction_type === "Redemption";
  const isSTP = formData.transaction_type === "STP";
  const isSwitch = formData.transaction_type === "Switch";
  const isISIP = formData.transaction_type === "I-SIP";
  const isNormalSIP = formData.transaction_type === "NORMAL SIP";
  const isSPREAD = formData.transaction_type === "SPREAD";
  const isX_SIP = formData.transaction_type === "X-SIP";
  
  const requiresExclusiveAmountOrUnits = isRedemption || isSwitch;
  const showAllUnitsToggle = isRedemption || isSwitch;
  //const disableAmountInput = (showAllUnitsToggle && formData.all_units) || (requiresExclusiveAmountOrUnits && !!formData.units);
  // const disableUnitsInput = isPurchase || (showAllUnitsToggle && formData.all_units) || (requiresExclusiveAmountOrUnits && !!formData.amount);

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "redeem_amount") {
      setFormData((prev) => ({
        ...prev,
        redeem_amount: value,
        // enforce mutual exclusivity
        redeem_units: value ? "" : prev.redeem_units,
        redeem_all_units: false,
      }));
      return;
    }
    if (name === "redeem_units") {
      setFormData((prev) => ({
        ...prev,
        redeem_units: value,
        // enforce mutual exclusivity
        redeem_amount: value ? "" : prev.redeem_amount,
        redeem_all_units: false,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: keyof FormState, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
    
    // Reset BSE-related fields when unchecking
    if (name === "is_bse_scheme" && !checked) {
      setBseSearchTerm("");
      setBseSearchType("ISIN");
      setFormData((prev) => ({
        ...prev,
        isin: "",
        scheme_code: "",
      }));
    }
    // Redemption: All Units clears amount and units
    if (name === "redeem_all_units") {
      setFormData((prev) => ({
        ...prev,
        redeem_all_units: checked,
        redeem_amount: checked ? "" : prev.redeem_amount,
        redeem_units: checked ? "" : prev.redeem_units,
      }));
    }
  };

  const handleTransactionTypeChange = (value: string) => {
    setManualFolio(false);
    setFormData((prev) => ({
      ...prev,
      transaction_type: value,
      amount: "",
      units: "",
      all_units: false,
      scheme_to_code: "",
      // Reset STP fields when changing transaction type
      stp_amount: "",
      stp_frequency: FREQUENCIES[2],
      stp_no_of_installments: "",
      stp_start_date: getDefaultStartDate(),
      stp_end_date: "",
      target_scheme: "",
      source_scheme: "",
      // Reset SWP fields
      withdrawal_amount: "",
      quantity: "",
      swp_frequency: FREQUENCIES[2],
      swp_no_of_installments: "",
      swp_start_date: getDefaultStartDate(),
      swp_end_date: "",
      // Reset SPREAD fields
      redemption_amount: "",
      redemption_date: "",
      bank_name: "",
      bank_acc_no: "",
      tin_type: "",
      // Reset common fields
      txn_type: "Fresh",
      end_date: "",
    }));

    // Reset new fields when transaction type changes
    resetNewFields();
  };



  const handleUnitsChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      units: value,
      amount: (requiresExclusiveAmountOrUnits && value) || isPurchase ? "" : prev.amount,
    }));
  };

  const handleAllUnitsChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      all_units: checked,
      amount: checked ? "" : prev.amount,
      units: checked ? "" : prev.units,
    }));
  };

  const handleManualFolioToggle = (checked: boolean) => {
    setManualFolio(checked);
    setFormData((prev) => ({ ...prev, folio_no: "" }));
  };

  const handleBseSchemeSelect = (schemeCode: string) => {
    const selected = bseSchemes.find((s) => s.Scheme_Code === schemeCode);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        scheme_code: selected.Scheme_Code,
        isin: selected.ISIN || "",
        amc_name: selected.AMC_Code || "",
        scheme_name: selected.Scheme_Name || prev.scheme_name,
        scheme_type: (selected as any).Scheme_Type || prev.scheme_type,
      }));
    }
  };

  const buildComment = () => {
    let details = "";
    if (isSwitch && formData.scheme_to_code) {
      const schemeTo = schemes.find((scheme) => scheme.s_code === formData.scheme_to_code);
      details = `Switch to ${schemeTo?.s_name || formData.scheme_to_code}`;
    }
    if (false) { // No SIP type anymore
      details = `SIP ${formData.frequency}, Day ${formData.sip_day}, Start ${formData.start_date}, Mandate ${formData.mandate_id}`;
    }
    if (!details) return formData.comment;
    return formData.comment ? `${formData.comment} | ${details}` : details;
  };

  const resetNewFields = () => {
    setFormData((prev) => ({
      ...prev,
      // Reset common fields
      client_name: client?.c_name ?? prev.client_name,
      portfolio: prev.portfolio,
      amc_name: "",
      scheme_type: "",
      isin: "",
      bse_scheme: false,
      current_value: "",
      bal_unit: "",
      txn_type: "Fresh",
      end_date: "",
      keep_client_blocked: false,
      keep_scheme_blocked: false,
      // Reset SIP fields
      installment_amount: "",
      no_of_installments: "",
      sip_date_day_allowed: "1",
      first_order_flag: false,
      sip_start_date: getDefaultStartDate(),
      // Reset SPREAD fields
      redemption_amount: "",
      redemption_date: "",
      bank_name: "",
      bank_acc_no: "",
      tin_type: "",
      // Reset STP fields
      stp_amount: "",
      stp_frequency: FREQUENCIES[2],
      stp_no_of_installments: "",
      stp_start_date: getDefaultStartDate(),
      stp_end_date: "",
      target_scheme: "",
      source_scheme: "",
      // Reset SWP fields
      withdrawal_amount: "",
      quantity: "",
      swp_frequency: FREQUENCIES[2],
      swp_no_of_installments: "",
      swp_start_date: getDefaultStartDate(),
      swp_end_date: "",
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!client) {
      setError("Client data not found");
      setLoading(false);
      return;
    }

    if (!formData.transaction_type) {
      setError("Please select a transaction type");
      setLoading(false);
      return;
    }

    if (!formData.scheme_code) {
      setError("Please select a scheme");
      setLoading(false);
      return;
    }

    if (!formData.folio_no && !manualFolio) {
      setError("Please select a folio number or enable manual entry");
      setLoading(false);
      return;
    }

    if (!formData.folio_no && manualFolio) {
      setError("Please enter a folio number!");
      setLoading(false);
      return;
    }

    const amountValue = isRedemption ? (parseFloat(formData.redeem_amount) || 0) : (parseFloat(formData.amount) || 0);
    const unitsValue = isRedemption ? (parseFloat(formData.redeem_units) || 0) : (parseFloat(formData.units) || 0);

    if (isPurchase && amountValue <= 0) {
      setError("Purchase transactions allow amount mode only. Enter a valid amount.");
      setLoading(false);
      return;
    }

    // I-SIP and NORMAL SIP validation
    if (isISIP || isNormalSIP) {
      const installment = parseFloat(formData.installment_amount) || 0;
      const installments = parseInt(formData.number_of_installments, 10) || 0;
      if (installment <= 0) {
        setError("Please enter a valid installment amount.");
        setLoading(false);
        return;
      }
      if (installments <= 0) {
        setError("Please enter a valid number of installments.");
        setLoading(false);
        return;
      }
      if (!formData.folio_no) {
        setError("Please enter a folio number for SIP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.start_date) {
        setError("Please select a start date for SIP transaction.");
        setLoading(false);
        return;
      }
      if (formData.transaction_type === "I-SIP" && !formData.mandate_id) {
        setError("Please select a valid Mandate ID for I-SIP transaction.");
        setLoading(false);
        return;
      }
    }
    
    // X-SIP validation
    if (isX_SIP) {
      const installment = parseFloat(formData.installment_amount) || 0;
      const installments = parseInt(formData.number_of_installments, 10) || 0;
      if (installment <= 0) {
        setError("Please enter a valid installment amount for X-SIP transaction.");
        setLoading(false);
        return;
      }
      if (installments <= 0) {
        setError("Please enter a valid number of installments for X-SIP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.folio_no) {
        setError("Please enter a folio number for X-SIP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.start_date) {
        setError("Please select a start date for X-SIP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.mandate_id) {
        setError("Please select a valid Mandate ID for X-SIP transaction.");
        setLoading(false);
        return;
      }
    }
    
    // Redemption validation
    if (isRedemption) {
      if (!formData.redeem_all_units && parseFloat(formData.redeem_amount) <= 0 && parseFloat(formData.redeem_units) <= 0) {
        setError("For redemption, please enter either amount or units, or check 'All Units'.");
        setLoading(false);
        return;
      }
      if (!formData.folio_no) {
        setError("Please enter a folio number for redemption transaction.");
        setLoading(false);
        return;
      }
      if (parseFloat(formData.redeem_amount) > 0 && parseFloat(formData.redeem_units) > 0) {
        setError("For redemption, please enter either amount or units (not both).");
        setLoading(false);
        return;
      }
    }
    
    // SPREAD validation
    if (formData.transaction_type === 'SPREAD') {
      if (parseFloat(formData.investment_amount) <= 0) {
        setError("Please enter a valid investment amount for SPREAD transaction.");
        setLoading(false);
        return;
      }
      if (parseFloat(formData.redemption_amount) <= 0) {
        setError("Please enter a valid redemption amount for SPREAD transaction.");
        setLoading(false);
        return;
      }
      if (!formData.folio_no) {
        setError("Please enter a folio number for SPREAD transaction.");
        setLoading(false);
        return;
      }
      if (!formData.redemption_date) {
        setError("Please select a redemption date for SPREAD transaction.");
        setLoading(false);
        return;
      }
    }
    
    // STP validation
    if (isSTP) {
      if (parseFloat(formData.stp_amount) <= 0) {
        setError("Please enter a valid STP amount.");
        setLoading(false);
        return;
      }
      if (parseInt(formData.stp_number_of_installments, 10) <= 0) {
        setError("Please enter a valid number of installments for STP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.scheme_from) {
        setError("Please select the source scheme for STP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.scheme_to) {
        setError("Please select the target scheme for STP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.folio_no) {
        setError("Please enter a folio number for STP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.start_date) {
        setError("Please select a start date for STP transaction.");
        setLoading(false);
        return;
      }
    }
    
    // SWITCH validation
    if (isSwitch) {
      if (parseFloat(formData.switch_amount) <= 0 && parseFloat(formData.switch_units) <= 0) {
        setError("Please enter either switch amount or switch units for SWITCH transaction.");
        setLoading(false);
        return;
      }
      if (parseFloat(formData.switch_amount) > 0 && parseFloat(formData.switch_units) > 0) {
        setError("For SWITCH transaction, please enter either amount or units (not both).");
        setLoading(false);
        return;
      }
      if (!formData.scheme_code) {
        setError("Please select the source scheme for SWITCH transaction.");
        setLoading(false);
        return;
      }
      if (!formData.scheme_to_code) {
        setError("Please select the target scheme for SWITCH transaction.");
        setLoading(false);
        return;
      }
      if (!formData.folio_no) {
        setError("Please enter a folio number for SWITCH transaction.");
        setLoading(false);
        return;
      }
    }
    
    // SWP validation
    if (formData.transaction_type === 'SWP') {
      if (parseFloat(formData.withdrawal_amount) <= 0 && parseFloat(formData.withdrawal_units) <= 0) {
        setError("Please enter either withdrawal amount or withdrawal units for SWP transaction.");
        setLoading(false);
        return;
      }
      if (parseFloat(formData.withdrawal_amount) > 0 && parseFloat(formData.withdrawal_units) > 0) {
        setError("For SWP transaction, please enter either amount or units (not both).");
        setLoading(false);
        return;
      }
      if (parseInt(formData.swp_number_of_installments, 10) <= 0) {
        setError("Please enter a valid number of installments for SWP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.folio_no) {
        setError("Please enter a folio number for SWP transaction.");
        setLoading(false);
        return;
      }
      if (!formData.start_date) {
        setError("Please select a start date for SWP transaction.");
        setLoading(false);
        return;
      }
    }
    
    // PURCHASE validation
    if (isPurchase) {
      if (parseFloat(formData.amount) <= 0) {
        setError("Please enter a valid purchase amount.");
        setLoading(false);
        return;
      }
      if (!formData.folio_no) {
        setError("Please enter a folio number for purchase transaction.");
        setLoading(false);
        return;
      }
    }

    const allUnitsFlag = isRedemption ? formData.redeem_all_units : formData.all_units;
    if (requiresExclusiveAmountOrUnits && !allUnitsFlag && !isSwitch) { // Exclude switch from this check since it has its own validation
      const hasAmount = amountValue > 0;
      const hasUnits = unitsValue > 0;
      if ((hasAmount && hasUnits) || (!hasAmount && !hasUnits)) {
        setError("For Redemption enter either Amount or Units (only one is allowed).");
        setLoading(false);
        return;
      }
    }

    if (isSwitch && !formData.scheme_to_code) {
      setError("Please select the scheme to switch into.");
      setLoading(false);
      return;
    }

    if (false) { // No SIP type anymore
      const day = parseInt(formData.sip_day, 10);
      const validFreq = FREQUENCIES.includes(formData.frequency);
      if (!validFreq) {
        setError("Please select a valid frequency");
        setLoading(false);
        return;
      }
      if (Number.isNaN(day) || day < 1 || day > 31) {
        setError("SIP day must be between 1 and 31");
        setLoading(false);
        return;
      }
      if (!formData.start_date) {
        setError("Please select a start date");
        setLoading(false);
        return;
      }
      if (!MANDATE_IDS.includes(formData.mandate_id)) {
        setError("Please select a valid Mandate ID");
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("auth_token");
      const requestPayload = {
        client_code: client?.c_code ? String(client.c_code).trim() : "",
        transaction_type: formData.transaction_type,
        scheme_code: formData.scheme_code,
        scheme_to_code: formData.scheme_to_code || null,
        amount: isSwitch ? (parseFloat(formData.switch_amount) || 0) : amountValue,
        units: isSwitch ? (allUnitsFlag ? 0 : (parseFloat(formData.switch_units) || 0)) : allUnitsFlag ? 0 : unitsValue,
        folio_no: formData.folio_no,
        all_units: allUnitsFlag,
        comment: buildComment(),
        frequency: formData.sip_frequency || formData.stp_frequency || formData.swp_frequency || formData.frequency,
        sip_day: formData.sip_day,
        start_date: formData.start_date || formData.stp_start_date || formData.swp_start_date || formData.sip_start_date,
        mandate_id: formData.mandate_id,
        // New fields
        client_name: formData.client_name,
        portfolio: formData.portfolio_type,
        amc_name: formData.amc_name,
        scheme_type: formData.scheme_type,
        isin: formData.isin,
        bse_scheme: formData.bse_scheme,
        current_value: parseFloat(formData.current_value) || 0,
        bal_unit: parseFloat(formData.bal_unit) || 0,
        txn_type: formData.txn_type,
        end_date: formData.end_date,
        keep_client_blocked: formData.keep_client_blocked,
        keep_scheme_blocked: formData.keep_scheme_blocked,
        // SIP fields
        installment_amount: parseFloat(formData.installment_amount) || 0,
        no_of_installments: parseInt(formData.no_of_installments) || 0,
        sip_date_day_allowed: formData.sip_date_day_allowed,
        first_order_flag: formData.first_order_flag,
        sip_start_date: formData.sip_start_date,
        // SPREAD fields
        redemption_amount: parseFloat(formData.redemption_amount) || 0,
        redemption_date: formData.redemption_date,
        bank_name: formData.bank_name,
        bank_acc_no: formData.bank_acc_no,
        tin_type: formData.tin_type,
        // STP fields
        stp_amount: parseFloat(formData.stp_amount) || 0,
        stp_frequency: formData.stp_frequency,
        stp_no_of_installments: parseInt(formData.stp_no_of_installments) || 0,
        stp_start_date: formData.stp_start_date,
        stp_end_date: formData.stp_end_date,
        target_scheme: formData.target_scheme,
        source_scheme: formData.source_scheme,
        // SWP fields
        withdrawal_amount: parseFloat(formData.withdrawal_amount) || 0,
        quantity: parseFloat(formData.quantity) || 0,
        swp_frequency: formData.swp_frequency,
        swp_no_of_installments: parseInt(formData.swp_no_of_installments) || 0,
        swp_start_date: formData.swp_start_date,
        swp_end_date: formData.swp_end_date,
      };

      console.log("Submitting transaction to cart API:", requestPayload);

      const res = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(requestPayload),
      });

      console.log("Cart API response status:", res.status);

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        console.error("Cart API returned non-JSON:", contentType);
        throw new Error("Server returned invalid response format. Please contact support.");
      }

      const data = await res.json();
      console.log("Cart API response data:", data);

      if (!res.ok) {
        const errorMessage = data.error || data.message || `Server error: ${res.status}`;
        console.error("Cart API error:", errorMessage);
        throw new Error(errorMessage);
      }

      // Preserve scheme information after adding to cart
      const preservedSchemeInfo = {
        scheme_name: formData.scheme_name,
        amc_name: formData.amc_name,
        scheme_type: formData.scheme_type,
        scheme_code: formData.scheme_code,
        nav: formData.nav,
        isin: formData.isin,
        is_bse_scheme: formData.is_bse_scheme,
        bse_scheme: formData.bse_scheme,
        folio_no: formData.folio_no,
        keep_scheme_selected: formData.keep_scheme_selected
      };
      
      const nextState = createInitialFormState();
      nextState.client_name = client?.c_name ?? "";
      nextState.portfolio = formData.portfolio;
      
      // Restore scheme information to keep the same scheme selected
      Object.assign(nextState, preservedSchemeInfo);
      
      setFormData(nextState);
      setManualFolio(false);
      setError("");
      setSuccess("Transaction successfully added to cart");
      onAddToCart();
    } catch (err) {
      console.error("Error adding to cart:", err);
      const errorMsg = 
        err instanceof Error
          ? err.message
          : "Error adding to cart. Please check your connection and try again.";
      setError(errorMsg);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    // Preserve scheme-related information
    const preservedSchemeInfo = {
      scheme_type: formData.scheme_type,
      is_bse_scheme: formData.is_bse_scheme,
      scheme_code: formData.scheme_code,
      scheme_name: formData.scheme_name,
      nav: formData.nav,
      portfolio_type: formData.portfolio_type,
      keep_scheme_selected: formData.keep_scheme_selected,
      isin: formData.isin,
      bse_scheme: formData.bse_scheme,
      scheme_from: formData.scheme_from,
      scheme_to: formData.scheme_to,
      scheme_to_code: formData.scheme_to_code,
      source_scheme: formData.source_scheme,
      target_scheme: formData.target_scheme,
      amc_name: formData.amc_name,
      amc_id: formData.amc_id,
      type_id: formData.type_id,
      balance_units: formData.balance_units,
      current_value: formData.current_value,
      bal_unit: formData.bal_unit,
    };
    
    const nextState = createInitialFormState();
    nextState.client_name = client?.c_name ?? "";
    nextState.portfolio = formData.portfolio;
    
    // Restore scheme-related information
    Object.assign(nextState, preservedSchemeInfo);
    
    setFormData(nextState);
    setManualFolio(false);
    setError("");
    
    // Preserve the scheme lists to maintain scheme selection options
    // The schemes and filteredSchemes are preserved automatically as they are not being reset
    setBseSearchTerm("");
    
    // Maintain scheme selection visibility based on keep_scheme_selected flag
    if (!formData.keep_scheme_selected) {
      setShowSchemeSelection(false);
    } else {
      // Ensure scheme selection remains visible if keep_scheme_selected is true
      setShowSchemeSelection(true);
    }
  };

  // Load BSE schemes when checkbox is checked
  useEffect(() => {
    if (formData.is_bse_scheme) {
      loadBseSchemes();
    }
  }, [formData.is_bse_scheme]);

  // Filter BSE schemes based on search type and term
  useEffect(() => {
    if (!bseSearchTerm.trim()) {
      setFilteredBseSchemes(bseSchemes);
      return;
    }

    const searchLower = bseSearchTerm.toLowerCase().trim();
    const filtered = bseSchemes.filter((scheme) => {
      if (bseSearchType === "ISIN") {
        return scheme.ISIN?.toLowerCase().includes(searchLower);
      } else {
        return scheme.Scheme_Name?.toLowerCase().includes(searchLower);
      }
    });
    setFilteredBseSchemes(filtered);
  }, [bseSearchTerm, bseSearchType, bseSchemes]);

  const loadBseSchemes = async () => {
    try {
      setBseLoading(true);
      setError("");
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const url = `${API_URL}/bse-schemes`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to load BSE schemes");
      const data: BSEScheme[] = await res.json();
      setBseSchemes(data);
      setFilteredBseSchemes(data);
    } catch (err) {
      console.error("Error loading BSE schemes:", err);
      setError(err instanceof Error ? err.message : "Failed to load BSE schemes");
      setBseSchemes([]);
      setFilteredBseSchemes([]);
    } finally {
      setBseLoading(false);
    }
  };

  const bseSchemeOptions = filteredBseSchemes
    .slice(0, 500) // Limit to 500 for performance
    .map((scheme) => ({
      label: `${scheme.Scheme_Name} (${scheme.Scheme_Code})`,
      value: scheme.Scheme_Code,
    }));

  return (
    <div className="quick-invest-container" style={{ maxWidth: '100%' }}>
      <div className="quick-invest-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus className="card-header-icon" />
            <h2 className="quick-invest-title">New Transaction</h2>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowSchemeSelection(!showSchemeSelection)}
        >
          {showSchemeSelection ? "Hide Scheme" : "Select Scheme"}
        </button>
      </div>

      {formData.scheme_name && (
        <div className="selected-fund-card">
            <div className="fund-icon-large">
                <FundLogoBadge
                  amc={formData.amc_name}
                  name={formData.scheme_name}
                  code={formData.scheme_name.substring(0, 1)}
                  radius={12}
                />
            </div>
            <div className="fund-details">
                <h3>{formData.scheme_name}</h3>
                <p className="fund-nav">
                    {formData.scheme_type} • NAV: {formData.nav ? `₹${formData.nav}` : 'N/A'}
                </p>
            </div>
        </div>
      )}

      {success && <div className="card-success">{success}</div>}
      {error && <div className="card-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="transaction-topbar">
          <div className="transaction-client">
            <div className="transaction-client-primary">{client?.c_name || "Client"}</div>
            <div className="transaction-client-secondary">
              {client?.c_code ? `Code: ${client.c_code}` : "Not logged in"}
              {client?.bse_code ? ` • BSE: ${client.bse_code}` : ""}
              {client?.display_name ? ` • ${client.display_name}` : ""}
            </div>
          </div>
          <div className="transaction-topbar-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={!formData.folio_no || !formData.scheme_code || loading}
              onClick={() => {
                setShowFolioBalance((prev) => {
                  const next = !prev;
                  if (next) loadFolioBalance();
                  return next;
                });
              }}
            >
              Folio Balance
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={!formData.folio_no || !formData.scheme_code || loading}
              onClick={() => {
                setShowFolioDetails((prev) => {
                  const next = !prev;
                  if (next) loadFolioDetails();
                  return next;
                });
              }}
            >
              Folio Details
            </button>
          </div>
        </div>


        {showFolioBalance && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            onMouseDown={() => setShowFolioBalance(false)}
          >
            <div className="modal-card folio-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Folio Balance</div>
                <div className="modal-header-actions">
                  <button type="button" className="link-button" onClick={loadFolioBalance} disabled={folioBalanceLoading}>
                    {folioBalanceLoading ? "Loading..." : "Refresh"}
                  </button>
                  <button type="button" className="modal-close" onClick={() => setShowFolioBalance(false)} aria-label="Close">
                    ×
                  </button>
                </div>
              </div>
              <div className="modal-body">
                {folioBalanceLoading ? (
                  <div className="empty-state" style={{ padding: "1.25rem 0.5rem" }}>
                    <p>Loading...</p>
                  </div>
                ) : (
                  renderDataTable(
                    folioBalanceRows,
                    ["Scheme", "SchemeName", "RTACode", "FolioNo", "BalQty", "BalAmt", "Nature", "ClientName"],
                    selectBalanceRow,
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {showFolioDetails && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            onMouseDown={() => setShowFolioDetails(false)}
          >
            <div className="modal-card folio-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Folio Details</div>
                <div className="modal-header-actions">
                  <button type="button" className="link-button" onClick={loadFolioDetails} disabled={folioDetailsLoading}>
                    {folioDetailsLoading ? "Loading..." : "Refresh"}
                  </button>
                  <button type="button" className="modal-close" onClick={() => setShowFolioDetails(false)} aria-label="Close">
                    ×
                  </button>
                </div>
              </div>
              <div className="modal-body">
                {folioDetailsLoading ? (
                  <div className="empty-state" style={{ padding: "1.25rem 0.5rem" }}>
                    <p>Loading...</p>
                  </div>
                ) : (
                  renderDataTable(
                    folioDetailsRows,
                    ["folio", "FolioNo", "DEMAT", "SchemeName", "Scheme_Code", "Inv_ID", "Name"],
                    selectDetailsRow
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <div className="form-section">
          <div className="form-row two">
            <SearchableSelect
              label="Transaction Type"
              placeholder="Search transaction type..."
              options={transactionTypeOptions}
              value={formData.transaction_type}
              onChange={handleTransactionTypeChange}
              required
            />
            <div className="form-field folio-field">
              {manualFolio ? (
                <>
                  <label>Folio No</label>
                  <input
                    type="text"
                    name="folio_no"
                    value={formData.folio_no}
                    onChange={(e) => setFormData((prev) => ({ ...prev, folio_no: e.target.value }))}
                    placeholder="Enter folio number"
                  />
                </>
              ) : (
                <SearchableSelect
                  label="Folio No"
                  placeholder={folioOptions.length ? "Search folio..." : "No folios found"}
                  options={folioOptions}
                  value={formData.folio_no}
                  onChange={(value) => setFormData((prev) => ({ ...prev, folio_no: value }))}
                />
              )}
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  checked={manualFolio}
                  onChange={(e) => handleManualFolioToggle(e.target.checked)}
                />
                <span className="checkbox-label"> Enter manually</span>
              </div>
            </div>
          </div>

          {showSchemeSelection && (
            <>
              <div className="form-field" style={{ margin: "1rem 0" }}>
                <label style={{ marginBottom: "0.5rem", display: "block" }}>Scheme Type</label>
                <div className="scheme-type-pills">
                  {schemeTypeOptions.map((opt) => (
                    <button
                      key={opt.value || "all"}
                      type="button"
                      className={`scheme-type-pill ${formData.type_id === opt.value ? 'active' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, type_id: opt.value }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <SearchableSelect
                  label="Scheme"
                  placeholder={schemes.length ? "Search scheme..." : "No schemes loaded"}
                  options={schemeOptions}
                  value={formData.scheme_code}
                  onChange={(value) => {
                    const s = schemes.find((scheme) => scheme.s_code === value);
                    setFormData((prev) => ({
                      ...prev,
                      scheme_code: value,
                      scheme_to_code: "",
                      scheme_name: s?.s_name || prev.scheme_name,
                      amc_name: s?.amc || prev.amc_name,
                      scheme_type: s?.type || prev.scheme_type,
                    }));
                  }}
                  required
                />
              </div>
              <div className="form-row four">
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.is_bse_scheme}
                    onChange={(e) => handleCheckboxChange("is_bse_scheme", e.target.checked)}
                  />
                  <span className="checkbox-label">BSE Scheme</span>
                </div>
              </div>

              {/* BSE Scheme Selection Fields */}
              {formData.is_bse_scheme && (
                <div className="form-section bse-panel">
                  <h4 className="bse-title">BSE Scheme Selection</h4>
                  <div className="form-row four bse-grid">
                    <div className="form-field">
                      <label>Search By</label>
                      <select
                        value={bseSearchType}
                        onChange={(e) => {
                          setBseSearchType(e.target.value as "ISIN" | "Name");
                          setBseSearchTerm("");
                        }}
                      >
                        <option value="ISIN">ISIN</option>
                        <option value="Name">Scheme Name</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>{bseSearchType === "ISIN" ? "ISIN" : "Scheme Name"}</label>
                      <input
                        type="text"
                        value={bseSearchTerm}
                        onChange={(e) => setBseSearchTerm(e.target.value)}
                        placeholder={`Search by ${bseSearchType === "ISIN" ? "ISIN" : "Scheme Name"}...`}
                      />
                      {bseLoading && <span className="field-hint">Loading BSE schemes...</span>}
                      {!bseLoading && bseSchemes.length === 0 && <span className="field-hint">No BSE schemes available</span>}
                      {!bseLoading && filteredBseSchemes.length === 0 && bseSearchTerm && (
                        <span className="field-hint">No schemes found matching "{bseSearchTerm}"</span>
                      )}
                    </div>
                    <SearchableSelect
                      label="Select BSE Scheme"
                      placeholder={bseLoading ? "Loading..." : bseSchemeOptions.length ? "Search BSE scheme..." : "No schemes found"}
                      options={bseSchemeOptions}
                      value={formData.scheme_code}
                      onChange={handleBseSchemeSelect}
                      disabled={bseLoading || bseSchemeOptions.length === 0}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {isSwitch && formData.scheme_code && (
          <div className="form-row two">
            <SearchableSelect
              label="Scheme To"
              placeholder="Search scheme to..."
              options={schemeToOptions}
              value={formData.scheme_to_code}
              onChange={(value) => setFormData((prev) => ({ ...prev, scheme_to_code: value }))
              }
              required
            />
          </div>
        )}
        
        {/* I-SIP Fields */}
        {isISIP && (
          <div className="form-section">
            <div className="form-row four">
              <div className="form-field">
                <label>Txn Type (FRESH)</label>
                <select
                  name="txn_type"
                  value={formData.txn_type}
                  onChange={handleBasicChange}
                >
                  <option value="Fresh">FRESH</option>
                  <option value="Additional">Additional</option>
                </select>
              </div>
              <div className="form-field">
                <label>Installment Amt</label>
                <input
                  type="number"
                  name="installment_amount"
                  value={formData.installment_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-field">
                <label>No Of Installments</label>
                <input
                  type="number"
                  name="number_of_installments"
                  value={formData.number_of_installments}
                  onChange={handleBasicChange}
                  placeholder="0"
                />
              </div>
              <div className="form-field">
                <label>Frequency</label>
                <select
                  name="sip_frequency"
                  value={formData.sip_frequency}
                  onChange={handleBasicChange}
                >
                  {FREQUENCIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row four">
              <div className="form-field">
                <label>SIP Dates/Days Allowed</label>
                <input
                  type="text"
                  name="sip_date"
                  value={formData.sip_date}
                  onChange={handleBasicChange}
                  placeholder="SIP Date"
                />
              </div>
              <div className="form-field">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleBasicChange}
                />
              </div>
              <div className="form-field">
                <label>First Order Flag</label>
                <input
                  type="checkbox"
                  name="first_order_flag"
                  checked={formData.first_order_flag}
                  onChange={(e) => handleCheckboxChange("first_order_flag", e.target.checked)}
                />
              </div>
              <div className="form-field">
                <label>Mandate ID</label>
                <select
                  name="mandate_id"
                  value={formData.mandate_id}
                  onChange={handleBasicChange}
                >
                  {MANDATE_IDS.map((mandate) => (
                    <option key={mandate} value={mandate}>
                      {mandate}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* NORMAL SIP Fields */}
        {isNormalSIP && (
          <div className="form-section">
            <h3>NORMAL SIP Details</h3>
            <div className="form-row four">
              <div className="form-field">
                <label>Txn Type</label>
                <select
                  name="txn_type"
                  value={formData.txn_type}
                  onChange={handleBasicChange}
                >
                  <option value="Fresh">Fresh</option>
                  <option value="Additional">Additional</option>
                </select>
              </div>
              <div className="form-field">
                <label>Installment Amt</label>
                <input
                  type="number"
                  name="installment_amount"
                  value={formData.installment_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-field">
                <label>No Of Installments</label>
                <input
                  type="number"
                  name="number_of_installments"
                  value={formData.number_of_installments}
                  onChange={handleBasicChange}
                  placeholder="0"
                />
              </div>
              <div className="form-field">
                <label>Frequency</label>
                <select
                  name="sip_frequency"
                  value={formData.sip_frequency}
                  onChange={handleBasicChange}
                >
                  {FREQUENCIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row four">
              <div className="form-field">
                <label>SIP Dates/Days Allowed</label>
                <input
                  type="text"
                  name="sip_date"
                  value={formData.sip_date}
                  onChange={handleBasicChange}
                  placeholder="SIP Date"
                />
              </div>
              <div className="form-field">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleBasicChange}
                />
              </div>
              <div className="form-field">
                <label>First Order Flag</label>
                <input
                  type="checkbox"
                  name="first_order_flag"
                  checked={formData.first_order_flag}
                  onChange={(e) => handleCheckboxChange("first_order_flag", e.target.checked)}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Redemption Fields */}
        {isRedemption && (
          <div className="form-section">
            <div className="form-row four">
              <SearchableSelect
                label="Select Bank"
                placeholder={bankOptions.length ? "Search bank..." : bankLoading ? "Loading banks..." : "No banks"}
                options={bankOptions}
                value={formData.bank_account_id}
                onChange={(value) => {
                  const selected = bankOptions.find((o) => o.value === value);
                  setFormData((prev) => ({
                    ...prev,
                    bank_account_id: value,
                    bank_name: selected?.label ?? prev.bank_name,
                  }));
                }}
                disabled={bankLoading || bankOptions.length === 0}
              />
              <div className="form-field">
                <label>Amount</label>
                <input
                  type="number"
                  name="redeem_amount"
                  value={formData.redeem_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-field">
                <label>Quantity</label>
                <input
                  type="number"
                  name="redeem_units"
                  value={formData.redeem_units}
                  onChange={handleBasicChange}
                  step="0.0001"
                  placeholder="0.0000"
                />
              </div>
              <div className="form-field">
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.redeem_all_units}
                    onChange={(e) => handleCheckboxChange("redeem_all_units", e.target.checked)}
                  />
                  <span className="checkbox-label">All Units</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* SPREAD Fields */}
        {isSPREAD && (
          <div className="form-section">
            <div className="form-row four">
              <SearchableSelect
                label="Select Bank"
                placeholder={bankOptions.length ? "Search bank..." : bankLoading ? "Loading banks..." : "No banks"}
                options={bankOptions}
                value={formData.bank_account_id}
                onChange={(value) => {
                  const selected = bankOptions.find((o) => o.value === value);
                  setFormData((prev) => ({
                    ...prev,
                    bank_account_id: value,
                    bank_name: selected?.label ?? prev.bank_name,
                  }));
                }}
                disabled={bankLoading || bankOptions.length === 0}
              />
              <div className="form-field">
                <label>Investment Amt</label>
                <input
                  type="number"
                  name="investment_amount"
                  value={formData.investment_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-field">
                <label>Redemption Amt</label>
                <input
                  type="number"
                  name="redemption_amount"
                  value={formData.redemption_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-field">
                <label>Redemption Date</label>
                <input
                  type="date"
                  name="redemption_date"
                  value={formData.redemption_date}
                  onChange={handleBasicChange}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* STP Fields */}
        {isSTP && (
          <div className="form-section">
            <div className="form-row four">
              <div className="form-field">
                <label>Scheme From</label>
                <input
                  type="text"
                  name="scheme_from"
                  value={formData.scheme_from}
                  onChange={handleBasicChange}
                  placeholder="Scheme From"
                />
              </div>
              <div className="form-field">
                <label>Scheme To</label>
                <input
                  type="text"
                  name="scheme_to"
                  value={formData.scheme_to}
                  onChange={handleBasicChange}
                  placeholder="Scheme To"
                />
              </div>
              <div className="form-field">
                <label>Amount</label>
                <input
                  type="number"
                  name="stp_amount"
                  value={formData.stp_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-field">
                <label>Frequency</label>
                <select
                  name="stp_frequency"
                  value={formData.stp_frequency}
                  onChange={handleBasicChange}
                >
                  {FREQUENCIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row four">
              <div className="form-field">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleBasicChange}
                />
              </div>
              <div className="form-field">
                <label>No Of Installments</label>
                <input
                  type="number"
                  name="stp_number_of_installments"
                  value={formData.stp_number_of_installments}
                  onChange={handleBasicChange}
                  placeholder="0"
                />
              </div>
              <div className="form-field">
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleBasicChange}
                />
              </div>
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  name="stp_first_order_flag"
                  checked={formData.stp_first_order_flag}
                  onChange={(e) => handleCheckboxChange("stp_first_order_flag", e.target.checked)}
                />
                <span className="checkbox-label">First Order Flag</span>
              </div>
            </div>
          </div>
        )}
        
        {/* SWITCH Fields */}
        {isSwitch && (
          <div className="form-section">
            <div className="form-row four">
              <div className="form-field">
                <label>Amount</label>
                <input
                  type="number"
                  name="switch_amount"
                  value={formData.switch_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                  disabled={!!formData.switch_units && parseFloat(formData.switch_units) > 0}
                />
              </div>
              <div className="form-field">
                <label>Units</label>
                <input
                  type="number"
                  name="switch_units"
                  value={formData.switch_units}
                  onChange={handleBasicChange}
                  step="0.0001"
                  placeholder="0.0000"
                  disabled={!!formData.switch_amount && parseFloat(formData.switch_amount) > 0}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* SWP Fields */}
        {formData.transaction_type === 'SWP' && (
          <div className="form-section">
            <div className="form-row four">
              <div className="form-field">
                <label>Amount</label>
                <input
                  type="number"
                  name="withdrawal_amount"
                  value={formData.withdrawal_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-field">
                <label>Quantity</label>
                <input
                  type="number"
                  name="withdrawal_units"
                  value={formData.withdrawal_units}
                  onChange={handleBasicChange}
                  step="0.0001"
                  placeholder="0.0000"
                />
              </div>
              <div className="form-field">
                <label>Frequency</label>
                <select
                  name="swp_frequency"
                  value={formData.swp_frequency}
                  onChange={handleBasicChange}
                >
                  {FREQUENCIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>No Of Installments</label>
                <input
                  type="number"
                  name="swp_number_of_installments"
                  value={formData.swp_number_of_installments}
                  onChange={handleBasicChange}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-row four">
              <div className="form-field">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleBasicChange}
                />
              </div>
              <div className="form-field">
                <label>End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleBasicChange}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* X-SIP Fields */}
        {isX_SIP && (
          <div className="form-section">
    
            <div className="form-row four">
              <div className="form-field">
                <label>Installment Amt</label>
                <input
                  type="number"
                  name="installment_amount"
                  value={formData.installment_amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-field">
                <label>No Of Installments</label>
                <input
                  type="number"
                  name="number_of_installments"
                  value={formData.number_of_installments}
                  onChange={handleBasicChange}
                  placeholder="0"
                />
              </div>
              <div className="form-field">
                <label>Frequency</label>
                <select
                  name="x_sip_frequency"
                  value={formData.x_sip_frequency}
                  onChange={handleBasicChange}
                >
                  {FREQUENCIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>SIP Dates/Days Allowed</label>
                <input
                  type="text"
                  name="x_sip_date"
                  value={formData.x_sip_date}
                  onChange={handleBasicChange}
                  placeholder="SIP Date"
                />
              </div>
            </div>
            <div className="form-row four">
              <div className="form-field">
                <label>Start Date</label>
                <input
                  type="date"
                  name="x_sip_start_date"
                  value={formData.x_sip_start_date}
                  onChange={handleBasicChange}
                />
              </div>
              <div className="form-field">
                <label>First Order Flag</label>
                <input
                  type="checkbox"
                  name="x_sip_first_order_flag"
                  checked={formData.x_sip_first_order_flag}
                  onChange={(e) => handleCheckboxChange("x_sip_first_order_flag", e.target.checked)}
                />
              </div>
              <div className="form-field">
                <label>Mandate ID</label>
                <select
                  name="x_sip_mandate_id"
                  value={formData.x_sip_mandate_id}
                  onChange={handleBasicChange}>
                  {MANDATE_IDS.map((mandate) => (
                    <option key={mandate} value={mandate}>
                      {mandate}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* PURCHASE Fields */}
        {isPurchase && (
          <div className="form-section">
            <div className="form-row two">
              <div className="form-field">
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleBasicChange}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-section">
          <div className="form-row four">
            <div className="form-field">
              <label>Bal Unit</label>
              <div className="metric-badge metric-unit">{formData.bal_unit ? Number(formData.bal_unit).toFixed(4) : "0.0000"}</div>
              <span className="field-hint">Select a row from Folio Balance to auto-fill.</span>
            </div>
            <div className="form-field">
              <label>Current Value</label>
              <div className="metric-badge metric-value">
                {formData.current_value ? `₹${Number(formData.current_value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹0.00"}
              </div>
              <span className="field-hint">Auto-filled from Folio Balance.</span>
            </div>
          </div>
        </div>

        {isSwitch && showAllUnitsToggle && (
          <div className="form-field">
            <div className="checkbox-container">
              <input 
                type="checkbox" 
                checked={formData.all_units} 
                onChange={(e) => handleAllUnitsChange(e.target.checked)} 
              />
              <span className="checkbox-label">All Units</span>
            </div>
            <span className="field-hint">Clears and locks Amount & Units.</span>
          </div>
        )}

        <div className="form-section">
      
        <div className="form-row one">
            <div className="form-field">
              <label>Txn Type</label>
              <select name="txn_type" value={formData.txn_type} onChange={handleBasicChange}>
                <option value="Fresh">Fresh</option>
                <option value="Additional">Additional</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-section">
        <div className="form-field">
          <label>Comment</label>
          <textarea name="comment" value={formData.comment} onChange={handleBasicChange} rows={3} placeholder="Add any comments..." className="comment-field" />
        </div>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={handleClear} disabled={loading}>
            Clear
          </button>
          <button type="submit" disabled={loading} className="primary-button">
            <ShoppingCart className="w-5 h-5" style={{ marginRight: "0.5rem" }} />
            {loading ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </form>
    </div>
  );
}
