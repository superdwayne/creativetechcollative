import React, { useState, useEffect } from 'react';
import { supabase } from '../super';

const AdminPage = () => {
  const [session, setSession] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMembers();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMembers();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      setLoginError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setMembers([]);
  };

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setActionMessage('Error loading members: ' + error.message);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (member) => {
    const confirmed = window.confirm(`Delete ${member.email} from the directory?`);
    if (!confirmed) return;

    setActionMessage('');
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('email', member.email);

    if (error) {
      setActionMessage('Error deleting: ' + error.message);
    } else {
      setActionMessage(`${member.email} removed from directory.`);
      fetchMembers();
    }
  };

  const handleResetPassword = async (email) => {
    setActionMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/create-password',
    });

    if (error) {
      setActionMessage('Error sending reset email: ' + error.message);
    } else {
      setActionMessage(`Password reset email sent to ${email}.`);
    }
  };

  if (!session) {
    return (
      <div className="admin-page">
        <div className="admin-login-container">
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Admin email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              autoComplete="off"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            {loginError && <p className="admin-error">{loginError}</p>}
            <button type="submit">Log In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h2>Member Directory</h2>
          <div className="admin-header-actions">
            <span className="admin-user">{session.user.email}</span>
            <button onClick={handleLogout} className="admin-btn-logout">Log Out</button>
          </div>
        </div>

        {actionMessage && <p className="admin-action-message">{actionMessage}</p>}

        <button onClick={fetchMembers} className="admin-btn-refresh" disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', opacity: 0.5 }}>
                    No members found
                  </td>
                </tr>
              )}
              {members.map((member, idx) => (
                <tr key={member.id || idx}>
                  <td>{member.email}</td>
                  <td>
                    {member.created_at
                      ? new Date(member.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="admin-actions">
                    <button
                      onClick={() => handleResetPassword(member.email)}
                      className="admin-btn-reset"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      className="admin-btn-delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
