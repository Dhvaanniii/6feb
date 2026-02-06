import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Edit2, CheckCircle, X, FileDown } from 'lucide-react';
import { Transaction, Scheme, AMC, SchemeType } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../../lib/date';
import '../../styles/dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;
const TRANSACTION_TYPES = ['Purchase', 'Redemption', 'Switch', 'X-SIP'];

// Transaction history component
export function TransactionHistory() {
  const { client } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [amcList, setAmcList] = useState<AMC[]>([]);
  const [schemeTypes, setSchemeTypes] = useState<SchemeType[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});

  const [filters, setFilters] = useState({
    transaction_types: [] as string[],
    amc_ids: [] as string[],
    type_ids: [] as string[],
    scheme_codes: [] as string[],
    date_from: '',
    date_to: '',
  });

  // Load data on mount
  useEffect(() => {
    loadMasterData();
    if (client) loadTransactions();
  }, [client]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, transactions]);

  // Load schemes and extract AMC/types
  const loadMasterData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const resSchemes = await fetch(`${API_URL}/schemes`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!resSchemes.ok) throw new Error('Failed to load schemes');
      const data: Scheme[] = await resSchemes.json();
      setSchemes(data);

      const amcMap = new Map<string, AMC>();
      const typeMap = new Map<string, SchemeType>();
      data.forEach((s) => {
        if (!amcMap.has(s.amc)) {
          amcMap.set(s.amc, { id: s.amc, amc_name: s.amc, is_active: true } as AMC);
        }
        if (!typeMap.has(s.type)) {
          typeMap.set(s.type, { id: s.type, type_name: s.type, is_active: true } as SchemeType);
        }
      });
      setAmcList(Array.from(amcMap.values()));
      setSchemeTypes(Array.from(typeMap.values()));
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  // Load transactions from API
  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const c_code = client?.c_code ? String(client.c_code).trim() : '';
      const url = `${API_URL}/transactions${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load transactions');
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  // Apply filters to transactions
  const applyFilters = () => {
    let filtered = transactions;
    if (filters.transaction_types.length > 0) {
      filtered = filtered.filter((t) => filters.transaction_types.includes(t.transaction_type));
    }
    if (filters.amc_ids.length > 0) {
      filtered = filtered.filter((t) => (t.scheme_amc ? filters.amc_ids.includes(t.scheme_amc) : false));
    }
    if (filters.type_ids.length > 0) {
      filtered = filtered.filter((t) => (t.scheme_type ? filters.type_ids.includes(t.scheme_type) : false));
    }
    if (filters.scheme_codes.length > 0) {
      filtered = filtered.filter((t) => filters.scheme_codes.includes(t.scheme_code));
    }
    if (filters.date_from) filtered = filtered.filter((t) => t.transaction_date >= filters.date_from);
    if (filters.date_to) filtered = filtered.filter((t) => t.transaction_date <= filters.date_to);
    setFilteredTransactions(filtered);
  };

  // Update multi-select filters
  const updateFilterList = (key: 'transaction_types' | 'amc_ids' | 'type_ids' | 'scheme_codes', values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  };

  // Handle native multi-select changes
  const handleMultiSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    key: 'transaction_types' | 'amc_ids' | 'type_ids' | 'scheme_codes'
  ) => {
    const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    updateFilterList(key, values);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      transaction_types: [],
      amc_ids: [],
      type_ids: [],
      scheme_codes: [],
      date_from: '',
      date_to: '',
    });
  };

  // Start editing transaction
  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditData({
      amount: transaction.amount,
      units: transaction.transaction_type === 'Purchase' ? 0 : transaction.units,
    });
  };

  // Save edited transaction
  const handleSaveEdit = async (id: number) => {
    try {
      const original = transactions.find(t => t.id === id);
      if (!original) throw new Error('Transaction not found');

      const type = original.transaction_type;
      const allUnits = original.all_units;
      const amountVal = Number(editData.amount) || 0;
      const unitsVal = Number(editData.units) || 0;

      if (type === 'Purchase') {
        if (amountVal <= 0) throw new Error('Purchase allows amount mode only. Enter valid amount');
        // Units should not be edited for Purchase
      } else if (type === 'Redemption' || type === 'Switch') {
        if (allUnits) {
          if (amountVal > 0 || unitsVal > 0) throw new Error('All Units selected: Amount and Units must be empty');
        } else {
          const hasAmount = amountVal > 0;
          const hasUnits = unitsVal > 0;
          if ((hasAmount && hasUnits) || (!hasAmount && !hasUnits)) {
            throw new Error('Enter either Amount OR Units (only one allowed)');
          }
        }
      } else if (type === 'X-SIP') {
        // SIP amount not required; allow zero
      }

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      body: JSON.stringify({
        amount: amountVal,
        units: unitsVal,
      }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error updating transaction');
      setEditingId(null);
      loadTransactions();
    } catch (err) {
      console.error('Error updating transaction:', err);
      alert('Error updating transaction');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Export transactions to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Scheme', 'AMC', 'Amount', 'Units', 'Folio', 'Status', 'Comment'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.transaction_date),
      t.transaction_type,
      t.scheme_name || t.scheme_code,
      t.scheme_amc || '',
      t.amount,
      t.units,
      t.folio_no || '',
      t.status,
      t.comment || '',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export transactions to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text('Transaction History', pageWidth / 2, 15, { align: 'center' });
    
    // Client info
    if (client) {
      doc.setFontSize(12);
      doc.text(`Client: ${client.c_name}`, 14, 25);
      doc.text(`Email: ${client.email || ''}`, 14, 32);
    }
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 14, 25, { align: 'right' });
    doc.text(`Total Records: ${filteredTransactions.length}`, pageWidth - 14, 32, { align: 'right' });
    
    // Table data
    const tableData = filteredTransactions.map((t) => [
      formatDate(t.transaction_date),
      t.transaction_type,
      t.scheme_name || t.scheme_code || '-',
      t.scheme_amc || '-',
      `INR ${t.amount.toFixed(2)}`,
      t.units.toFixed(4),
      t.folio_no || '-',
      t.status,
    ]);
    
    // Create table
    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Type', 'Scheme', 'AMC', 'Amount', 'Units', 'Folio', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
      },
    });
    
    // Save PDF
    doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="dashboard-card">
      <div className="history-header">
        <div className="card-header">
          <FileText className="card-header-icon" />
          <h2 className="card-title">Transaction History ({filteredTransactions.length})</h2>
        </div>
        <div className="history-actions">
          <button onClick={() => setShowFilters(!showFilters)} className="secondary-button">
            <Filter className="w-5 h-5" style={{ marginRight: '0.35rem' }} />
            Filters
          </button>
          <button onClick={exportToCSV} disabled={filteredTransactions.length === 0} className="secondary-button">
            <Download className="w-5 h-5" style={{ marginRight: '0.35rem' }} />
            CSV
          </button>
          <button onClick={exportToPDF} disabled={filteredTransactions.length === 0} className="secondary-button">
            <FileDown className="w-5 h-5" style={{ marginRight: '0.35rem' }} />
            PDF
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="form-field">
              <label>Transaction Type</label>
              <select multiple value={filters.transaction_types} onChange={(e) => handleMultiSelectChange(e, 'transaction_types')}>
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>AMC</label>
              <select multiple value={filters.amc_ids} onChange={(e) => handleMultiSelectChange(e, 'amc_ids')}>
                {amcList.map((amc) => (
                  <option key={amc.id} value={amc.id}>{amc.amc_name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Scheme Type</label>
              <select multiple value={filters.type_ids} onChange={(e) => handleMultiSelectChange(e, 'type_ids')}>
                {schemeTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.type_name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Scheme Name</label>
              <select multiple value={filters.scheme_codes} onChange={(e) => handleMultiSelectChange(e, 'scheme_codes')}>
                {schemes.map((scheme) => (
                  <option key={scheme.s_code} value={scheme.s_code}>{scheme.s_name}</option>
                ))}
              </select>
            </div>
            </div>

          <div className="filters-grid">
            <div className="form-field">
              <label>From Date</label>
              <input type="date" name="date_from" value={filters.date_from} onChange={handleDateChange} />
            </div>

            <div className="form-field">
              <label>To Date</label>
              <input type="date" name="date_to" value={filters.date_to} onChange={handleDateChange} />
            </div>
          </div>

          <div className="filters-actions">
            <button onClick={resetFilters} className="link-button">
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <FileText className="empty-state-icon" />
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Scheme</th>
                <th>AMC</th>
                <th className="numeric">Amount</th>
                <th className="numeric">Units</th>
                <th>Folio</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.transaction_date)}</td>
                  <td>
                    <span className={`badge ${transaction.transaction_type === 'Purchase' ? 'badge-success' : 'badge-warning'}`}>
                      {transaction.transaction_type}
                    </span>
                  </td>
                  <td>{transaction.scheme_name || transaction.scheme_code}</td>
                  <td>{transaction.scheme_amc || '-'}</td>
                  <td className="numeric">
                    {editingId === transaction.id ? (
                      <input
                        type="number"
                        value={editData.amount || 0}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          const isPurchase = transaction.transaction_type === 'Purchase';
                          const isXSIP = transaction.transaction_type === 'X-SIP';
                          const next: Partial<Transaction> = { ...editData, amount: v };
                          if (!isPurchase && !isXSIP && v > 0) next.units = 0;
                          setEditData(next);
                        }}
                        className="table-input"
                        step="0.01"
                        disabled={transaction.all_units}
                      />
                    ) : (
                      <>₹{transaction.amount.toFixed(2)}</>
                    )}
                  </td>
                  <td className="numeric">
                    {editingId === transaction.id ? (
                      <input
                        type="number"
                        value={editData.units || 0}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          const next: Partial<Transaction> = { ...editData, units: v };
                          if (v > 0) next.amount = 0;
                          setEditData(next);
                        }}
                        className="table-input"
                        step="0.0001"
                        disabled={transaction.transaction_type === 'Purchase' || transaction.transaction_type === 'X-SIP' || transaction.all_units}
                      />
                    ) : (
                      <>{transaction.units.toFixed(4)}</>
                    )}
                  </td>
                  <td>{transaction.folio_no || '-'}</td>
                  <td>
                    <span className={`badge ${transaction.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>
                    {editingId === transaction.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(transaction.id)} className="icon-button save" title="Save">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={handleCancelEdit} className="icon-button" title="Cancel">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleEdit(transaction)} className="icon-button edit" title="Edit">
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
