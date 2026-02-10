import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../super';

const CreatePassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');

    await supabase.auth.signOut();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setSuccess(true);
      setMessage('Account created! Check your email to confirm.');
    }

    setLoading(false);
  };

  if (!email) {
    return (
      <div className="create-password-page">
        <div className="create-password-container">
          <h2>No email provided</h2>
          <p>Please sign up from the main page first.</p>
          <button onClick={() => navigate('/')}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-password-page">
      <div className="create-password-container">
        <h2>Create Your Password</h2>
        <p className="create-password-email">
          Setting up account for <strong>{email}</strong>
        </p>

        {success ? (
          <div className="create-password-success">
            <p>{message}</p>
            <button onClick={() => navigate('/')}>Back to Home</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-field">
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {message && <p className="create-password-error">{message}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePassword;
