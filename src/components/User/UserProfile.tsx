import { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Client } from '../../lib/types';
import '../../styles/dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

interface UserProfileProps {
  onClose: () => void;
}

// User profile edit component
export function UserProfile({ onClose }: UserProfileProps) {
  const { client, user } = useAuth();
  const [formData, setFormData] = useState<Partial<Client>>({
    c_name: '',
    email: '',
    mobile: '',
    pan: '',
    bank_name_1: '',
    acc_no_1: '',
    micr_1: '',
    ifsc_1: '',
    bank_name_2: '',
    acc_no_2: '',
    micr_2: '',
    ifsc_2: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load client data
  useEffect(() => {
    if (client) {
      setFormData({
        c_name: client.c_name || '',
        email: client.email || user?.email || '',
        mobile: client.mobile || '',
        pan: client.pan || '',
        bank_name_1: client.bank_name_1 || '',
        acc_no_1: client.acc_no_1 || '',
        micr_1: client.micr_1 || '',
        ifsc_1: client.ifsc_1 || '',
        bank_name_2: client.bank_name_2 || '',
        acc_no_2: client.acc_no_2 || '',
        micr_2: client.micr_2 || '',
        ifsc_2: client.ifsc_2 || '',
      });
    }
  }, [client, user]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error updating profile');

      alert('Profile updated successfully!');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User className="card-header-icon" />
            <h2 className="modal-title">Edit Profile</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="card-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-row two">
            <div className="form-field">
              <label>Client Name *</label>
              <input
                type="text"
                name="c_name"
                value={formData.c_name}
                onChange={handleChange}
                required
                placeholder="Client name"
              />
            </div>
            <div className="form-field">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="form-row two">
            <div className="form-field">
              <label>Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Mobile number"
              />
            </div>
            <div className="form-field">
              <label>PAN</label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                placeholder="PAN number"
              />
            </div>
          </div>

          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Bank Account 1</h3>
          <div className="form-row two">
            <div className="form-field">
              <label>Bank Name</label>
              <input
                type="text"
                name="bank_name_1"
                value={formData.bank_name_1}
                onChange={handleChange}
                placeholder="Bank name"
              />
            </div>
            <div className="form-field">
              <label>Account Number</label>
              <input
                type="text"
                name="acc_no_1"
                value={formData.acc_no_1}
                onChange={handleChange}
                placeholder="Account number"
              />
            </div>
          </div>

          <div className="form-row two">
            <div className="form-field">
              <label>MICR</label>
              <input
                type="text"
                name="micr_1"
                value={formData.micr_1}
                onChange={handleChange}
                placeholder="MICR code"
              />
            </div>
            <div className="form-field">
              <label>IFSC</label>
              <input
                type="text"
                name="ifsc_1"
                value={formData.ifsc_1}
                onChange={handleChange}
                placeholder="IFSC code"
              />
            </div>
          </div>

          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Bank Account 2</h3>
          <div className="form-row two">
            <div className="form-field">
              <label>Bank Name</label>
              <input
                type="text"
                name="bank_name_2"
                value={formData.bank_name_2}
                onChange={handleChange}
                placeholder="Bank name"
              />
            </div>
            <div className="form-field">
              <label>Account Number</label>
              <input
                type="text"
                name="acc_no_2"
                value={formData.acc_no_2}
                onChange={handleChange}
                placeholder="Account number"
              />
            </div>
          </div>

          <div className="form-row two">
            <div className="form-field">
              <label>MICR</label>
              <input
                type="text"
                name="micr_2"
                value={formData.micr_2}
                onChange={handleChange}
                placeholder="MICR code"
              />
            </div>
            <div className="form-field">
              <label>IFSC</label>
              <input
                type="text"
                name="ifsc_2"
                value={formData.ifsc_2}
                onChange={handleChange}
                placeholder="IFSC code"
              />
            </div>
          </div>

          <div className="button-group">
            <button type="button" onClick={onClose} className="secondary-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

