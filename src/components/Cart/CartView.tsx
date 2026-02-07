import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Edit2, CheckCircle, X, History, AlertCircle } from 'lucide-react';
import { CartItem } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { CartLog } from './CartLog';
import { formatDate } from '../../lib/date';
import '../../styles/dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;


// Cart view component
export function CartView({ refreshKey }: { refreshKey: number }) {
  const { user, client } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editUnits, setEditUnits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showCartLog, setShowCartLog] = useState(false);

  // Load cart items
  useEffect(() => {
    if (client?.c_code || user) loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, client, refreshKey]);

  // Load cart from API
  const loadCart = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const c_code = client?.c_code ? String(client.c_code).trim() : '';
      const url = `${API_URL}/cart${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load cart');
      setCartItems(data || []);
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  };
  // Remove item from cart
  const handleRemove = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const c_code = client?.c_code ? String(client.c_code).trim() : '';
      const url = `${API_URL}/cart/${id}${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error removing item');
      }
      setError('');
      loadCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing item from cart');
    }
  };

  

  // Start editing item
  const handleEdit = (item: CartItem) => {
    setEditingId(item.id);
    setEditAmount(item.amount.toString());
    setEditUnits(item.transaction_type === 'Purchase' || item.transaction_type === 'X-SIP' ? '' : item.units.toString());
  };

  // Save edited item
  const handleSaveEdit = async (id: number) => {
    try {
      const item = cartItems.find(ci => ci.id === id);
      if (!item) throw new Error('Cart item not found');

      const amountVal = parseFloat(editAmount) || 0;
      const unitsVal = parseFloat(editUnits) || 0;

      if (item.transaction_type === 'Purchase') {
        if (amountVal <= 0) throw new Error('Purchase allows amount mode only. Enter valid amount');
      } else if (item.transaction_type === 'X-SIP') {
        if (item.all_units) {
          if (amountVal > 0 || unitsVal > 0) throw new Error('All Units selected: Amount and Units must be empty');
        }
        if (unitsVal > 0) throw new Error('Units are not applicable for X-SIP');
        // amount may be 0 or greater
      } else {
        if (item.all_units) {
          if (amountVal > 0 || unitsVal > 0) throw new Error('All Units selected: Amount and Units must be empty');
        } else {
          if ((amountVal > 0 && unitsVal > 0) || (amountVal <= 0 && unitsVal <= 0)) {
            throw new Error('Enter either Amount OR Units (only one allowed)');
          }
        }
      }

      const token = localStorage.getItem('auth_token');
      const c_code = client?.c_code ? String(client.c_code).trim() : '';
      const url = `${API_URL}/cart/${id}${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ''}`;
      const res = await fetch(url, {
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error updating item');
      }
      setEditingId(null);
      loadCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating item');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
    setEditUnits('');
  };

  // Execute cart order with validation
  const handleExecuteOrder = async () => {
    if (cartItems.length === 0) {
      setError('Cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const c_code = client?.c_code ? String(client.c_code).trim() : '';
      const url = `${API_URL}/cart/execute${c_code ? `?c_code=${encodeURIComponent(c_code)}` : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error executing order');
      loadCart();
      alert(`Order executed successfully! ${cartItems.length} transaction(s) processed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error executing order');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const totalPurchaseAmount = cartItems
    .filter((item) => item.transaction_type === 'Purchase')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalRedemptionAmount = cartItems
    .filter((item) => item.transaction_type === 'Redemption')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalPurchaseUnits = cartItems
    .filter((item) => item.transaction_type === 'Purchase')
    .reduce((sum, item) => sum + item.units, 0);

  const totalRedemptionUnits = cartItems
    .filter((item) => item.transaction_type === 'Redemption')
    .reduce((sum, item) => sum + item.units, 0);

  return (
    <div className="dashboard-card">
      {showCartLog && <CartLog onClose={() => setShowCartLog(false)} />}

      <div className="card-header card-header-space">
        <div className="card-header">
          <ShoppingCart className="card-header-icon" />
          <h2 className="card-title">Transaction Cart</h2>
          <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
            {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowCartLog(true)} className="secondary-button" title="View Cart History">
            <History className="w-5 h-5" style={{ marginRight: '0.35rem' }} />
            History
          </button>
          {cartItems.length > 0 && (
            <button onClick={handleExecuteOrder} disabled={loading} className="primary-button">
              <CheckCircle className="w-5 h-5" style={{ marginRight: '0.35rem' }} />
              {loading ? 'Processing...' : 'Execute Order'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card-error">
          <AlertCircle className="w-5 h-5" style={{ marginRight: '0.5rem' }} />
          {error}
        </div>
      )}

      

      {cartItems.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart className="empty-state-icon" />
          <p>Your cart is empty</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Add transactions to your cart to execute them together
          </p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table cart-table">
              <thead>
                <tr>
                  <th>Transaction Type</th>
                  <th>Scheme Details</th>
                  <th>AMC</th>
                  <th className="numeric">Amount (₹)</th>
                  <th className="numeric">Units</th>
                  <th className="numeric">NAV (₹)</th>
                  <th>Folio Number</th>
                  <th>Date</th>
                  <th className="numeric">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td className="type-cell">
                      <span className="badge" data-type={item.transaction_type}>
                        {item.transaction_type}
                      </span>
                    </td>
                    <td className="scheme-cell" title={item.scheme_name || item.scheme_code || ''}>
                      <div style={{ fontWeight: '500' }}>
                        {item.scheme_name || item.scheme_code || 'Unknown Scheme'}
                      </div>
                      {item.scheme_code && item.scheme_name && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Code: {item.scheme_code}
                        </div>
                      )}
                    </td>
                    <td>{(item as any).scheme_amc || '-'}</td>
                    <td className="numeric">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editAmount}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditAmount(v);
                        if (item.transaction_type !== 'Purchase' && item.transaction_type !== 'X-SIP' && parseFloat(v) > 0) {
                          setEditUnits('');
                        }
                      }}
                      className="table-input"
                      step="0.01"
                      placeholder="Amount"
                      disabled={item.all_units}
                    />
                      ) : (
                        <span style={{ fontWeight: '500' }}>₹{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )}
                    </td>
                    <td className="numeric">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editUnits}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditUnits(v);
                        if (parseFloat(v) > 0) {
                          setEditAmount('');
                        }
                      }}
                      className="table-input"
                      step="0.0001"
                      placeholder="Units"
                      disabled={item.transaction_type === 'Purchase' || item.transaction_type === 'X-SIP' || item.all_units}
                    />
                      ) : (
                        <>{(item.units || 0).toFixed(4)}</>
                      )}
                    </td>
                    <td className="numeric">
                      {(item as any).nav ? `₹${(item as any).nav.toFixed(2)}` : '-'}
                    </td>
                    <td>
                      {item.folio_no || (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not assigned</span>
                      )}
                    </td>
                    <td>
                      {(item as any).transaction_date ? formatDate((item as any).transaction_date) : formatDate(new Date())}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {editingId === item.id ? (
                          <>
                            <button onClick={() => handleSaveEdit(item.id)} className="icon-button edit" title="Save Changes">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={handleCancelEdit} className="icon-button" title="Cancel">
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(item)} className="icon-button edit" title="Edit Item">
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleRemove(item.id)} className="icon-button delete" title="Remove from Cart">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary" style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
              Transaction Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {totalPurchaseAmount > 0 && (
                <div className="summary-amount">
                  <p className="summary-label">Total Purchase Amount</p>
                  <p className="summary-value" style={{ color: '#059669' }}>
                    ₹{totalPurchaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Units: {totalPurchaseUnits.toFixed(4)}
                  </p>
                </div>
              )}
              {totalRedemptionAmount > 0 && (
                <div className="summary-amount">
                  <p className="summary-label">Total Redemption Amount</p>
                  <p className="summary-value" style={{ color: '#dc2626' }}>
                    ₹{totalRedemptionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Units: {totalRedemptionUnits.toFixed(4)}
                  </p>
                </div>
              )}
              <div className="summary-amount">
                <p className="summary-label">Net Amount</p>
                <p className="summary-value" style={{ color: totalPurchaseAmount - totalRedemptionAmount >= 0 ? '#059669' : '#dc2626' }}>
                  ₹{(totalPurchaseAmount - totalRedemptionAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Net Units: {(totalPurchaseUnits - totalRedemptionUnits).toFixed(4)}
                  </p>
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
