import { useState, useEffect } from 'react';
import { History, X, FileDown } from 'lucide-react';
import { Transaction } from '../../lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../../lib/date';
import '../../styles/dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

interface CartLogProps {
  onClose: () => void;
}

// Cart log component - shows executed cart history
export function CartLog({ onClose }: CartLogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Load cart log
  useEffect(() => {
    loadCartLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load cart log from API
  const loadCartLog = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/cart/log`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load cart log');
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading cart log:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export cart log to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text('Cart Execution Log', pageWidth / 2, 15, { align: 'center' });
    
    // Date and count
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 14, 25, { align: 'right' });
    doc.text(`Total Records: ${filteredTransactions.length}`, pageWidth - 14, 32, { align: 'right' });
    
    // Table data
    const tableData = filteredTransactions.map((t) => [
      formatDate(t.transaction_date),
      t.transaction_type || '-',
      t.scheme_name || t.scheme_code || '-',
      (t as any).scheme_amc || '-',
      `INR ${(t.amount || 0).toFixed(2)}`,
      (t.units || 0).toFixed(4),
      t.folio_no || '-',
      t.status || '-',
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
    doc.save(`cart_log_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Filter transactions by type
  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => t.transaction_type === filterType);

  // Calculate totals
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalUnits = filteredTransactions.reduce((sum, t) => sum + t.units, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1100px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History className="card-header-icon" />
            <h2 className="modal-title">Cart Execution History</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {transactions.length > 0 && (
              <>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}
                >
                  <option value="all">All Types</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Redemption">Redemption</option>
                </select>
                <button onClick={exportToPDF} className="secondary-button">
                  <FileDown className="w-5 h-5" style={{ marginRight: '0.35rem' }} />
                  Export PDF
                </button>
              </>
            )}
            <button className="modal-close" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading history...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <History className="empty-state-icon" />
            <p>No cart execution history found</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Executed cart transactions will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Scheme Details</th>
                    <th>AMC</th>
                    <th className="numeric">Amount (₹)</th>
                    <th className="numeric">Units</th>
                    <th className="numeric">NAV (₹)</th>
                    <th>Folio Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.transaction_date)}</td>
                      <td>
                        <span className="badge" data-type={transaction.transaction_type}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>
                          {transaction.scheme_name || transaction.scheme_code || 'Unknown'}
                        </div>
                        {transaction.scheme_code && transaction.scheme_name && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {transaction.scheme_code}
                          </div>
                        )}
                      </td>
                      <td>{(transaction as any).scheme_amc || '-'}</td>
                      <td className="numeric" style={{ fontWeight: '500' }}>
                        ₹{(transaction.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="numeric">{(transaction.units || 0).toFixed(4)}</td>
                      <td className="numeric">
                        {(transaction as any).nav ? `₹${(transaction as any).nav.toFixed(2)}` : '-'}
                      </td>
                      <td>{transaction.folio_no || '-'}</td>
                      <td>
                        <span className={`badge ${transaction.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                          {transaction.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Total Records:</strong> {filteredTransactions.length}
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <strong>Total Amount:</strong> ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div>
                  <strong>Total Units:</strong> {totalUnits.toFixed(4)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

