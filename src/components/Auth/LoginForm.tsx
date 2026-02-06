import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  UserCredential 
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import '../../styles/auth.css';

interface LoginFormProps {
  onToggleForm: () => void;
}

export function LoginForm({ onToggleForm }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();

  // Email/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Google / Facebook OAuth login
  const handleProviderLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    setLoading(true);

    try {
      let authProvider;

      if (provider === 'google') {
        authProvider = new GoogleAuthProvider();
        authProvider.setCustomParameters({
          prompt: 'select_account'
        });
        authProvider.addScope('profile');
        authProvider.addScope('email');
      } else {
        authProvider = new FacebookAuthProvider();
        authProvider.addScope('email');
        authProvider.addScope('public_profile');
      }

      const result: UserCredential = await signInWithPopup(auth, authProvider);

      if (provider === 'google') {
        const idToken = await result.user.getIdToken();
        const { error } = await signInWithGoogle(idToken);
        if (error) throw error;
      } else {
        const credential = FacebookAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          throw new Error('Facebook access token unavailable');
        }
        const { error } = await signInWithFacebook(credential.accessToken);
        if (error) throw error;
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Allow pop-ups to continue.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('Account exists with different sign-in method.');
      } else {
        setError(error.message || 'OAuth login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <LogIn className="w-8 h-8 text-blue-600" style={{ marginRight: '0.5rem' }} />
        <h2 className="auth-title">Login</h2>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}

        <div>
          <label className="auth-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="auth-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-button-primary">
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="auth-divider">or continue with</div>

        <div className="auth-social-container">
          <button
            type="button"
            className="auth-social-button google"
            onClick={() => handleProviderLogin('google')}
            disabled={loading}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              className="auth-social-logo"
            />
            Continue with Google
          </button>

          <button
            type="button"
            className="auth-social-button facebook"
            onClick={() => handleProviderLogin('facebook')}
            disabled={loading}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
              alt="Facebook logo"
              className="auth-social-logo"
            />
            Continue with Facebook
          </button>
        </div>

        <p className="auth-footer">
          Don’t have an account?{' '}
          <button type="button" onClick={onToggleForm}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}