import React, { useState, useEffect, createContext, useContext } from 'react';

// ─── Config & Context ─────────────────────────────────────────
const API = 'http://localhost:8001';
const AuthContext = createContext(null);

const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('bb_token');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
};

// ─── Auth Provider ─────────────────────────────────────────────
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('bb_user');
    return s ? JSON.parse(s) : null;
  });

  const login = async (email, password) => {
    const form = new URLSearchParams({ username: email, password });
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', body: form,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('bb_token', data.access_token);
    const me = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    }).then(r => r.json());
    localStorage.setItem('bb_user', JSON.stringify(me));
    setUser(me);
    return me;
  };

  const register = async (payload) => {
    await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    return login(payload.email, payload.password);
  };

  const logout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Global CSS ────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Sora', sans-serif; background: #f0f2f7; color: #1c2233; -webkit-font-smoothing: antialiased; }
    input, textarea, select, button { font-family: inherit; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #f0f2f7; }
    ::-webkit-scrollbar-thumb { background: #c5cad8; border-radius: 3px; }

    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    .fade-up { animation: fadeUp .32s ease both; }

    .card { background: #fff; border-radius: 12px; border: 1px solid #e4e8f0; padding: 20px 22px; }

    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; border: none; transition: all .18s; letter-spacing: .01em;
    }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-primary:disabled { background: #93aef5; cursor: not-allowed; }
    .btn-outline { background: transparent; color: #2563eb; border: 1.5px solid #2563eb; }
    .btn-outline:hover { background: #eff6ff; }
    .btn-ghost { background: transparent; color: #6b7280; border: 1px solid #e4e8f0; }
    .btn-ghost:hover { background: #f5f7fb; color: #1c2233; }
    .btn-danger { background: #fee2e2; color: #dc2626; border: none; }
    .btn-danger:hover { background: #fecaca; }
    .btn-success { background: #dcfce7; color: #16a34a; border: none; }
    .btn-success:hover { background: #bbf7d0; }
    .btn-sm { padding: 5px 12px; font-size: 12px; border-radius: 6px; }

    .inp {
      width: 100%; padding: 10px 13px;
      border: 1.5px solid #e4e8f0; border-radius: 8px;
      font-size: 13px; color: #1c2233; background: #fff; outline: none;
      transition: border-color .18s, box-shadow .18s;
    }
    .inp:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
    .inp::placeholder { color: #9ba3b8; }
    select.inp { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }

    .lbl { font-size: 11px; font-weight: 700; color: #6b7280; margin-bottom: 5px; letter-spacing: .04em; text-transform: uppercase; display: block; }

    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600; letter-spacing: .03em;
    }
    .badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: .7; }
    .badge-pending   { background: #fef9c3; color: #a16207; }
    .badge-approved  { background: #dcfce7; color: #15803d; }
    .badge-rejected  { background: #fee2e2; color: #dc2626; }
    .badge-fulfilled { background: #dbeafe; color: #1d4ed8; }
    .badge-confirmed { background: #dcfce7; color: #15803d; }
    .badge-completed { background: #e0f2fe; color: #0369a1; }
    .badge-cancelled { background: #f3f4f6; color: #6b7280; }
    .badge-normal    { background: #f0fdf4; color: #15803d; }
    .badge-urgent    { background: #fef9c3; color: #a16207; }
    .badge-critical  { background: #fee2e2; color: #dc2626; }
    .badge-available   { background: #dcfce7; color: #15803d; }
    .badge-unavailable { background: #fee2e2; color: #dc2626; }
    .badge-donation    { background: #eff6ff; color: #1d4ed8; }
    .badge-transfusion { background: #fdf4ff; color: #9333ea; }

    table { width: 100%; border-collapse: collapse; }
    th { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; padding: 11px 16px; border-bottom: 1.5px solid #f0f2f7; text-align: left; white-space: nowrap; }
    td { font-size: 13px; padding: 12px 16px; border-bottom: 1px solid #f5f7fb; color: #374151; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafbff; }

    .err { background: #fee2e2; color: #dc2626; padding: 9px 13px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
    .suc { background: #dcfce7; color: #15803d; padding: 9px 13px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }

    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
    .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
    .grid-inv { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 22px;
    }
    .page-title { font-size: 22px; font-weight: 700; color: #1c2233; }

    .tbl-wrap { border-radius: 12px; border: 1px solid #e4e8f0; overflow: hidden; background: #fff; }
    .tbl-header { padding: 13px 18px; border-bottom: 1.5px solid #f0f2f7; background: #fafbff; display: flex; align-items: center; justify-content: space-between; }

    .form-section { background: #fff; border-radius: 12px; border: 1px solid #e4e8f0; padding: 20px 22px; margin-bottom: 20px; }
    .form-title { font-size: 15px; font-weight: 700; color: #1c2233; margin-bottom: 16px; }

    .stat-card {
      background: #fff; border-radius: 12px; border: 1px solid #e4e8f0;
      padding: 18px 20px; display: flex; align-items: center; gap: 14px;
    }
    .stat-icon { width: 46px; height: 46px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .stat-label { font-size: 11px; color: #9ba3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 3px; }
    .stat-value { font-size: 28px; font-weight: 700; font-family: 'JetBrains Mono', monospace; line-height: 1; }

    .inv-cell {
      border-radius: 10px; padding: 13px 10px; text-align: center;
      border: 1px solid transparent; transition: transform .15s;
    }
    .inv-cell:hover { transform: translateY(-2px); }
    .inv-cell-group { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 15px; margin-bottom: 4px; }
    .inv-cell-units { font-size: 22px; font-weight: 700; line-height: 1; margin-bottom: 2px; }
    .inv-cell-label { font-size: 10px; font-weight: 500; opacity: .6; }

    .bg-chip {
      font-family: 'JetBrains Mono', monospace;
      padding: 4px 11px; border-radius: 8px; font-size: 13px; font-weight: 700;
      display: inline-block; letter-spacing: .03em;
    }
    .bg-A\\+ { background: #dbeafe; color: #1e40af; }
    .bg-A- { background: #e0e7ff; color: #3730a3; }
    .bg-B\\+ { background: #ede9fe; color: #5b21b6; }
    .bg-B- { background: #f3e8ff; color: #7e22ce; }
    .bg-AB\\+ { background: #fce7f3; color: #9d174d; }
    .bg-AB- { background: #ffe4e6; color: #9f1239; }
    .bg-O\\+ { background: #ffedd5; color: #9a3412; }
    .bg-O- { background: #fee2e2; color: #991b1b; }

    .progress-bar { height: 6px; border-radius: 3px; overflow: hidden; background: #f0f2f7; }
    .progress-fill { height: 100%; border-radius: 3px; transition: width .5s ease; }
  `}</style>
);

// ─── Helpers ───────────────────────────────────────────────────
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const BG_COLORS = {
  'A+':  { bg: '#dbeafe', color: '#1e40af', inv: '#eff6ff', border: '#bfdbfe' },
  'A-':  { bg: '#e0e7ff', color: '#3730a3', inv: '#eef2ff', border: '#c7d2fe' },
  'B+':  { bg: '#ede9fe', color: '#5b21b6', inv: '#f5f3ff', border: '#ddd6fe' },
  'B-':  { bg: '#f3e8ff', color: '#7e22ce', inv: '#faf5ff', border: '#e9d5ff' },
  'AB+': { bg: '#fce7f3', color: '#9d174d', inv: '#fdf2f8', border: '#fbcfe8' },
  'AB-': { bg: '#ffe4e6', color: '#9f1239', inv: '#fff1f2', border: '#fecdd3' },
  'O+':  { bg: '#ffedd5', color: '#9a3412', inv: '#fff7ed', border: '#fed7aa' },
  'O-':  { bg: '#fee2e2', color: '#991b1b', inv: '#fff5f5', border: '#fecaca' },
};

function BloodGroupBadge({ group }) {
  const c = BG_COLORS[group] || { bg: '#dbeafe', color: '#1e40af' };
  return (
    <span style={{ background: c.bg, color: c.color, fontFamily: "'JetBrains Mono', monospace", padding: '4px 11px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
      {group}
    </span>
  );
}

// ─── Navbar ────────────────────────────────────────────────────
const TABS = ['dashboard', 'donors', 'inventory', 'requests', 'appointments'];

function Navbar({ page, setPage }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #e4e8f0',
      padding: '0 28px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', height: 58,
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => setPage('dashboard')}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#dc2626,#ef4444)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12 3C12 3 5 11 5 15.5a7 7 0 0014 0C19 11 12 3 12 3z"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1c2233', letterSpacing: '-0.02em' }}>
            BloodBank<span style={{ color: '#dc2626', fontWeight: 700 }}>+</span>
          </span>
        </div>

        {/* Nav tabs */}
        {user && (
          <div style={{ display: 'flex', gap: 2 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setPage(t)} style={{
                background: page === t ? '#eff6ff' : 'none',
                color: page === t ? '#2563eb' : '#6b7280',
                border: 'none', cursor: 'pointer',
                padding: '7px 14px', borderRadius: 7,
                fontSize: 13, fontWeight: page === t ? 600 : 400,
                transition: 'all .15s', textTransform: 'capitalize',
              }}>{t}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f7fb', borderRadius: 8, padding: '5px 12px' }}>
              <div style={{ width: 26, height: 26, background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1c2233' }}>{user.name}</span>
              <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                {user.role}
              </span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); setPage('login'); }}>Logout</button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('login')}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={() => setPage('register')}>Register</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────
function DashboardPage({ setPage }) {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/inventory'),
      apiFetch('/requests').catch(() => []),
      apiFetch('/donors').catch(() => []),
      user?.role === 'admin' ? apiFetch('/dashboard/stats').catch(() => null) : Promise.resolve(null),
    ]).then(([inv, reqs, dnrs, s]) => {
      setInventory(inv); setRequests(reqs); setDonors(dnrs); setStats(s);
      setLoading(false);
    });
  }, []);

  const totalUnits = inventory.reduce((s, i) => s + i.units_available, 0);

  const statCards = [
    { label: 'Total Donors', value: stats?.total_donors ?? donors.length, icon: '🩸', bg: '#eff6ff', color: '#2563eb' },
    { label: 'Total Requests', value: stats?.total_requests ?? requests.length, icon: '📋', bg: '#f5f3ff', color: '#7c3aed' },
    { label: 'Pending', value: stats?.pending_requests ?? requests.filter(r => r.status === 'pending').length, icon: '⏳', bg: '#fffbeb', color: '#d97706' },
    { label: 'Units Available', value: totalUnits, icon: '💉', bg: '#ecfdf5', color: '#059669' },
  ];

  return (
    <div className="fade-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
      {/* Top bar */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div style={{ fontSize: 13, color: '#9ba3b8', marginTop: 3 }}>Blood Bank Management Overview</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Dashboard', 'Demo', 'Inventory', 'Requests'].map((t, i) => (
            <button key={t} className={i === 0 ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}>
              {t}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 16, padding: '5px 10px' }}>⊞</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid4" style={{ marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div className="stat-card" key={i} style={{ animationDelay: i * 60 + 'ms' }}>
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{ marginBottom: 24 }}>
        {/* Inventory grid */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Blood Inventory</div>
            <button className="btn btn-outline btn-sm" onClick={() => setPage('inventory')}>Manage →</button>
          </div>
          <div className="grid-inv">
            {inventory.map(inv => {
              const c = BG_COLORS[inv.blood_group] || { inv: '#f0f2f7', border: '#e4e8f0', color: '#1c2233', bg: '#f0f2f7' };
              const level = inv.units_available > 10 ? 'good' : inv.units_available > 3 ? 'low' : 'critical';
              const levelColor = level === 'good' ? c.color : level === 'low' ? '#d97706' : '#dc2626';
              return (
                <div key={inv.id} className="inv-cell" style={{ background: c.inv, borderColor: c.border }}>
                  <div className="inv-cell-group" style={{ color: c.color }}>{inv.blood_group}</div>
                  <div className="inv-cell-units" style={{ color: levelColor }}>{inv.units_available}</div>
                  <div className="inv-cell-label">units</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Blood Requests */}
        <div className="card" style={{ padding: 0 }}>
          <div className="tbl-header">
            <div style={{ fontWeight: 700, fontSize: 16 }}>Blood Requests</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <span style={{ fontSize: 11, color: '#9ba3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Senders</span>
              <span style={{ fontSize: 11, color: '#9ba3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Status</span>
            </div>
          </div>
          {requests.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9ba3b8', fontSize: 13 }}>No requests yet</div>
          ) : (
            <table>
              <thead><tr><th>Patient</th><th>Group</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {requests.slice(0, 6).map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.patient_name}</td>
                    <td><BloodGroupBadge group={r.blood_group} /></td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td style={{ fontSize: 12, color: '#9ba3b8' }}>{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Donor Table */}
      <div className="tbl-wrap">
        <div className="tbl-header">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Donor Management</div>
          <button className="btn btn-outline btn-sm" onClick={() => setPage('donors')}>View All →</button>
        </div>
        {donors.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ba3b8', fontSize: 13 }}>No donors registered yet</div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Blood Group</th><th>Status</th><th>Last Donation</th></tr></thead>
            <tbody>
              {donors.slice(0, 5).map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>Donor #{d.id}</td>
                  <td><BloodGroupBadge group={d.blood_group} /></td>
                  <td><span className={`badge ${d.is_available ? 'badge-available' : 'badge-unavailable'}`}>{d.is_available ? 'Available' : 'Inactive'}</span></td>
                  <td style={{ fontSize: 12, color: '#9ba3b8' }}>{fmtDate(d.last_donation_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Donors Page ───────────────────────────────────────────────
function DonorsPage() {
  const { user } = useContext(AuthContext);
  const [donors, setDonors] = useState([]);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [form, setForm] = useState({ blood_group: 'A+', age: '', weight: '', medical_notes: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = () => apiFetch('/donors' + (filter ? `?blood_group=${encodeURIComponent(filter)}` : '')).then(setDonors).catch(() => {});
  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    if (user) apiFetch('/donors/me').then(setMyProfile).catch(() => {});
  }, []);

  const submitDonor = async () => {
    if (!form.age || !form.weight) return setMsg({ type: 'err', text: 'Age and weight are required' });
    try {
      await apiFetch('/donors', { method: 'POST', body: JSON.stringify({ ...form, age: parseInt(form.age), weight: parseFloat(form.weight) }) });
      setMsg({ type: 'suc', text: 'Donor profile registered!' });
      setShowForm(false);
      load();
      apiFetch('/donors/me').then(setMyProfile).catch(() => {});
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  return (
    <div className="fade-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Donor Management</h1>
          <div style={{ fontSize: 13, color: '#9ba3b8', marginTop: 3 }}>{donors.length} registered donors</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="inp" style={{ width: 150 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {user && !myProfile && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Register as Donor</button>
          )}
        </div>
      </div>

      {msg.text && <div className={msg.type}>{msg.text}</div>}

      {showForm && (
        <div className="form-section">
          <div className="form-title">Register Donor Profile</div>
          <div className="grid2" style={{ marginBottom: 12 }}>
            <div><label className="lbl">Blood Group</label>
              <select className="inp" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="lbl">Age</label>
              <input className="inp" type="number" placeholder="e.g. 28" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
            </div>
            <div><label className="lbl">Weight (kg)</label>
              <input className="inp" type="number" placeholder="e.g. 68" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div><label className="lbl">Medical Notes</label>
              <input className="inp" placeholder="Optional" value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={submitDonor}>Submit</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="tbl-wrap">
        <table>
          <thead><tr><th>ID</th><th>Blood Group</th><th>Age</th><th>Weight</th><th>Status</th><th>Medical Notes</th><th>Registered</th></tr></thead>
          <tbody>
            {donors.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: '#9ba3b8', padding: 36 }}>No donors found</td></tr>
            ) : donors.map(d => (
              <tr key={d.id}>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#9ba3b8' }}>#{d.id}</td>
                <td><BloodGroupBadge group={d.blood_group} /></td>
                <td>{d.age} yrs</td>
                <td>{d.weight} kg</td>
                <td><span className={`badge ${d.is_available ? 'badge-available' : 'badge-unavailable'}`}>{d.is_available ? 'Available' : 'Unavailable'}</span></td>
                <td style={{ color: '#6b7280', fontSize: 12 }}>{d.medical_notes || '—'}</td>
                <td style={{ fontSize: 12, color: '#9ba3b8' }}>{fmtDate(d.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inventory Page ────────────────────────────────────────────
function InventoryPage() {
  const { user } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = () => apiFetch('/inventory').then(setInventory).catch(() => {});
  useEffect(() => { load(); }, []);

  const saveEdit = async (bg) => {
    try {
      await apiFetch(`/inventory/${encodeURIComponent(bg)}`, { method: 'PUT', body: JSON.stringify({ units: parseInt(editVal) }) });
      setMsg({ type: 'suc', text: 'Inventory updated successfully!' });
      setEditId(null);
      load();
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setTimeout(() => setMsg({ type: '', text: '' }), 2500);
  };

  const totalUnits = inventory.reduce((s, i) => s + i.units_available, 0);

  return (
    <div className="fade-up" style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Blood Inventory</h1>
          <div style={{ fontSize: 13, color: '#9ba3b8', marginTop: 3 }}>
            Total available: <strong style={{ color: '#1c2233' }}>{totalUnits} units</strong>
          </div>
        </div>
      </div>

      {msg.text && <div className={msg.type}>{msg.text}</div>}

      <div className="tbl-wrap">
        <div className="tbl-header">
          <span style={{ fontWeight: 700, fontSize: 14 }}>Blood Group Inventory</span>
          <span style={{ fontSize: 12, color: '#9ba3b8' }}>Units Available {user?.role === 'admin' ? '(editable)' : ''}</span>
        </div>
        <table>
          <thead><tr><th>Blood Group</th><th>Units</th><th>Stock Level</th>{user?.role === 'admin' && <th>Update</th>}</tr></thead>
          <tbody>
            {inventory.map(inv => {
              const pct = Math.min((inv.units_available / 30) * 100, 100);
              const fillColor = inv.units_available > 10 ? '#22c55e' : inv.units_available > 3 ? '#f59e0b' : '#ef4444';
              const level = inv.units_available > 10 ? 'Good' : inv.units_available > 3 ? 'Low' : inv.units_available > 0 ? 'Critical' : 'Empty';
              return (
                <tr key={inv.id}>
                  <td><BloodGroupBadge group={inv.blood_group} /></td>
                  <td>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: fillColor }}>
                      {inv.units_available}
                    </span>
                  </td>
                  <td style={{ minWidth: 200 }}>
                    <div className="progress-bar" style={{ marginBottom: 5 }}>
                      <div className="progress-fill" style={{ width: pct + '%', background: fillColor }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#9ba3b8' }}>{level} · Updated {fmtDate(inv.last_updated)}</div>
                  </td>
                  {user?.role === 'admin' && (
                    <td>
                      {editId === inv.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input className="inp" type="number" min="0" value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            style={{ width: 72, padding: '6px 10px', fontSize: 13 }}
                          />
                          <button className="btn btn-success btn-sm" onClick={() => saveEdit(inv.blood_group)}>✓</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setEditId(null)}>✕</button>
                        </div>
                      ) : (
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditId(inv.id); setEditVal(inv.units_available); }}>
                          Edit
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Requests Page ─────────────────────────────────────────────
function RequestsPage() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ blood_group: 'A+', units_needed: 1, urgency: 'normal', hospital_name: '', patient_name: '', notes: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [filterStatus, setFilterStatus] = useState('');

  const load = () => apiFetch('/requests').then(setRequests).catch(() => {});
  useEffect(() => { load(); }, []);

  const submitRequest = async () => {
    if (!form.patient_name || !form.hospital_name) return setMsg({ type: 'err', text: 'Patient name and hospital are required' });
    try {
      await apiFetch('/requests', { method: 'POST', body: JSON.stringify({ ...form, units_needed: parseInt(form.units_needed) }) });
      setMsg({ type: 'suc', text: 'Blood request submitted successfully!' });
      setShowForm(false); setForm({ blood_group: 'A+', units_needed: 1, urgency: 'normal', hospital_name: '', patient_name: '', notes: '' });
      load();
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const updateStatus = async (id, action) => {
    try { await apiFetch(`/requests/${id}/${action}`, { method: 'PUT' }); load(); }
    catch (e) { alert(e.message); }
  };

  const filtered = filterStatus ? requests.filter(r => r.status === filterStatus) : requests;

  return (
    <div className="fade-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Requests / Approvals</h1>
          <div style={{ fontSize: 13, color: '#9ba3b8', marginTop: 3 }}>{requests.length} total requests</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="inp" style={{ width: 150 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
          {user && <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ New Request</button>}
        </div>
      </div>

      {msg.text && <div className={msg.type}>{msg.text}</div>}

      {showForm && (
        <div className="form-section">
          <div className="form-title">New Blood Request</div>
          <div className="grid2" style={{ marginBottom: 14 }}>
            <div><label className="lbl">Patient Name</label><input className="inp" placeholder="Full name" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} /></div>
            <div><label className="lbl">Hospital Name</label><input className="inp" placeholder="Hospital name" value={form.hospital_name} onChange={e => setForm({ ...form, hospital_name: e.target.value })} /></div>
            <div><label className="lbl">Blood Group</label>
              <select className="inp" value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}>
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label className="lbl">Units Needed</label><input className="inp" type="number" min="1" value={form.units_needed} onChange={e => setForm({ ...form, units_needed: e.target.value })} /></div>
            <div><label className="lbl">Urgency</label>
              <select className="inp" value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div><label className="lbl">Notes</label><input className="inp" placeholder="Additional info" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={submitRequest}>Submit Request</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="tbl-wrap">
        <div className="tbl-header">
          <span style={{ fontWeight: 700, fontSize: 14 }}>Requests</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ fontSize: 11, color: '#9ba3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Senders</span>
            <span style={{ fontSize: 11, color: '#9ba3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Status</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Patient</th><th>Hospital</th><th>Blood Group</th>
              <th>Units</th><th>Urgency</th><th>Status</th><th>Date</th>
              {(user?.role === 'admin' || user?.role === 'doctor') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: '#9ba3b8', padding: 36 }}>No requests found</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#c5cad8' }}>#{r.id}</td>
                <td style={{ fontWeight: 500 }}>{r.patient_name}</td>
                <td style={{ color: '#6b7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.hospital_name}</td>
                <td><BloodGroupBadge group={r.blood_group} /></td>
                <td style={{ fontWeight: 600 }}>{r.units_needed}</td>
                <td><span className={`badge badge-${r.urgency}`}>{r.urgency}</span></td>
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                <td style={{ fontSize: 12, color: '#9ba3b8', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                {(user?.role === 'admin' || user?.role === 'doctor') && (
                  <td>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(r.id, 'approve')}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(r.id, 'reject')}>Reject</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Appointments Page ─────────────────────────────────────────
function AppointmentsPage() {
  const { user } = useContext(AuthContext);
  const [appts, setAppts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ appointment_type: 'donation', scheduled_date: '', notes: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = () => apiFetch('/appointments').then(setAppts).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.scheduled_date) return setMsg({ type: 'err', text: 'Please select a date and time' });
    try {
      await apiFetch('/appointments', { method: 'POST', body: JSON.stringify({ ...form, scheduled_date: new Date(form.scheduled_date).toISOString() }) });
      setMsg({ type: 'suc', text: 'Appointment booked successfully!' });
      setShowForm(false);
      load();
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const updateStatus = async (id, action) => {
    try { await apiFetch(`/appointments/${id}/${action}`, { method: 'PUT' }); load(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="fade-up" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <div style={{ fontSize: 13, color: '#9ba3b8', marginTop: 3 }}>{appts.length} appointments scheduled</div>
        </div>
        {user && <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Book Appointment</button>}
      </div>

      {msg.text && <div className={msg.type}>{msg.text}</div>}

      {showForm && (
        <div className="form-section">
          <div className="form-title">Book Appointment</div>
          <div className="grid3" style={{ marginBottom: 14 }}>
            <div><label className="lbl">Type</label>
              <select className="inp" value={form.appointment_type} onChange={e => setForm({ ...form, appointment_type: e.target.value })}>
                <option value="donation">Donation</option>
                <option value="transfusion">Transfusion</option>
              </select>
            </div>
            <div><label className="lbl">Date & Time</label>
              <input className="inp" type="datetime-local" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
            </div>
            <div><label className="lbl">Notes (optional)</label>
              <input className="inp" placeholder="Any special notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={submit}>Book</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Type</th><th>Scheduled Date</th><th>Status</th><th>Notes</th>
              {(user?.role === 'admin' || user?.role === 'doctor') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {appts.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: '#9ba3b8', padding: 36 }}>No appointments found</td></tr>
            ) : appts.map(a => (
              <tr key={a.id}>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#c5cad8' }}>#{a.id}</td>
                <td><span className={`badge badge-${a.appointment_type}`} style={{ textTransform: 'capitalize' }}>{a.appointment_type}</span></td>
                <td style={{ fontWeight: 500 }}>{fmtDateTime(a.scheduled_date)}</td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                <td style={{ color: '#6b7280', fontSize: 12 }}>{a.notes || '—'}</td>
                {(user?.role === 'admin' || user?.role === 'doctor') && (
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {a.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(a.id, 'confirm')}>Confirm</button>
                      )}
                      {!['cancelled', 'completed'].includes(a.status) && (
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(a.id, 'cancel')}>Cancel</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Login Page ─────────────────────────────────────────────────
function LoginPage({ setPage }) {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try { await login(form.email, form.password); setPage('dashboard'); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 600 }} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#dc2626,#ef4444)', borderRadius: 14, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M12 3C12 3 5 11 5 15.5a7 7 0 0014 0C19 11 12 3 12 3z"/></svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 5 }}>Blood Bank Portal</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Sign in to access the management system</p>
        </div>

        <div className="grid2">
          {/* Login */}
          <div className="card" style={{ border: '2px solid #2563eb' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2563eb', marginBottom: 18 }}>Login</div>
            <div style={{ marginBottom: 12 }}>
              <label className="lbl">Email Address</label>
              <input className="inp" type="email" placeholder="you@hospital.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="lbl">Password</label>
              <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
            {error && <div className="err">{error}</div>}
            <button className="btn btn-primary" style={{ width: '100%', padding: '11px 0', fontSize: 14 }} onClick={submit} disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#9ba3b8', marginTop: 14 }}>
              Don't have an account?{' '}
              <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => setPage('register')}>Sign Up</span>
            </div>
          </div>

          {/* Signup teaser */}
          <div className="card" style={{ background: '#fafbff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center', borderStyle: 'dashed' }}>
            <div style={{ width: 50, height: 50, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🩸</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Join the Network</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>Register as a donor, patient, or healthcare professional to access all features</div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setPage('register')}>Create Account →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Register Page ──────────────────────────────────────────────
function RegisterPage({ setPage }) {
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'patient', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) return setError('Name, email, and password are required');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try { await register({ name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone || undefined }); setPage('dashboard'); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', background: '#f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 640 }} className="fade-up">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 5 }}>Create Account</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Join the blood bank management network</p>
        </div>

        <div className="grid2" style={{ alignItems: 'start' }}>
          {/* Login teaser */}
          <div className="card" style={{ background: '#fafbff', borderStyle: 'dashed' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Login</div>
            <div style={{ marginBottom: 10 }}>
              <label className="lbl">Full Name</label>
              <input className="inp" placeholder="Already registered?" disabled style={{ background: '#f5f7fb', color: '#c5cad8' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="lbl">Password</label>
              <input className="inp" type="password" placeholder="••••••••" disabled style={{ background: '#f5f7fb', color: '#c5cad8' }} />
            </div>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setPage('login')}>Sign In →</button>
          </div>

          {/* Register */}
          <div className="card" style={{ border: '2px solid #2563eb' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#2563eb', marginBottom: 16 }}>Sign Up</div>
            {error && <div className="err">{error}</div>}
            <div style={{ marginBottom: 10 }}><label className="lbl">Full Name</label><input className="inp" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div style={{ marginBottom: 10 }}><label className="lbl">Email Address</label><input className="inp" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div style={{ marginBottom: 10 }}><label className="lbl">Password</label><input className="inp" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div style={{ marginBottom: 10 }}><label className="lbl">Confirm Password</label><input className="inp" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} /></div>
            <div style={{ marginBottom: 10 }}><label className="lbl">Role</label>
              <select className="inp" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="patient">Patient</option>
                <option value="donor">Donor</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}><label className="lbl">Phone (optional)</label><input className="inp" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '11px 0', fontSize: 14 }} onClick={submit} disabled={loading}>
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root App ───────────────────────────────────────────────────
function AppInner() {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(user ? 'dashboard' : 'login');

  useEffect(() => {
    if (!user && !['login', 'register'].includes(page)) setPage('login');
  }, [user]);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <DashboardPage setPage={setPage} />;
      case 'donors':       return <DonorsPage />;
      case 'inventory':    return <InventoryPage />;
      case 'requests':     return <RequestsPage />;
      case 'appointments': return <AppointmentsPage />;
      case 'login':        return <LoginPage setPage={setPage} />;
      case 'register':     return <RegisterPage setPage={setPage} />;
      default:             return <DashboardPage setPage={setPage} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f7' }}>
      <Navbar page={page} setPage={setPage} />
      {renderPage()}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalStyle />
      <AppInner />
    </AuthProvider>
  );
}

// In index.js just render: <App />
// No need for a separate AuthProvider wrapper — it's built in.
