import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

interface RegisterFormProps {
  onToggleForm: () => void;
}

// Registration form component
export function RegisterForm({ onToggleForm }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    c_code: '',
    c_name: '',
    email: '',
    password: '',
    mobile: '',
    pan: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { password, email, ...clientData } = formData;
    const { error } = await signUp(email, password, clientData);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <UserPlus className="w-8 h-8 text-blue-600" style={{ marginRight: '0.5rem' }} />
        <h2 className="auth-title">Register</h2>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}

        <div className="auth-grid-2">
          <div>
            <label className="auth-label">Client Code *</label>
            <input
              type="text"
              name="c_code"
              value={formData.c_code}
              onChange={handleChange}
              required
              className="auth-input"
              placeholder="Code"
            />
          </div>
          <div>
            <label className="auth-label">Client Name *</label>
            <input
              type="text"
              name="c_name"
              value={formData.c_name}
              onChange={handleChange}
              required
              className="auth-input"
              placeholder="Name"
            />
          </div>
        </div>

        <div>
          <label className="auth-label">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="auth-input"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="auth-label">Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="auth-input"
            placeholder="Min 6 characters"
          />
        </div>

        <div className="auth-grid-2">
          <div>
            <label className="auth-label">Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="auth-input"
              placeholder="Mobile number"
            />
          </div>
          <div>
            <label className="auth-label">PAN</label>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              className="auth-input"
              placeholder="PAN number"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="auth-button-primary">
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p className="auth-footer">
          Already have an account?{' '}
          <button type="button" onClick={onToggleForm}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
