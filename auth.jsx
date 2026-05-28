/* global React, ReactDOM, supabase */
const { useState, useEffect } = React;

const SUPABASE_URL = "https://vckhnigfycrgmzsfrzyf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZja2huaWdmeWNyZ216c2ZyenlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDczMDYsImV4cCI6MjA5MzkyMzMwNn0.0BhnorXTpmthkets0XxoIHUI67UAf1HYRT2_rrrZyMg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      if (!email || !password) return setError("Please enter both email and password.");
    } else {
      if (!tag || !name || !email || !password) return setError("Please fill in all fields.");
    }
    
    setError("");
    
    if (isLogin) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      if (error) return setError(error.message);
      window.location.href = "dashboard.html";
    } else {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            driver_tag: tag,
            full_name: name
          }
        }
      });
      if (error) return setError(error.message);
      window.location.href = "dashboard.html";
    }
  };

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = "dashboard.html";
      }
    });
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    els.forEach(el => el.classList.remove("in"));
    setTimeout(() => {
      els.forEach(el => el.classList.add("in"));
    }, 50);
  }, [isLogin]);

  return (
    <>
      <header className="nav nav-scrolled">
        <a className="nav-brand" href="A54 Racing.html">
          <img src="assets/a54-logo-dark.png" alt="A54" />
          <span className="nav-brand-text">
            <span className="nav-brand-2">GLOBAL RACING INDEX</span>
          </span>
        </a>
        <div className="nav-cta">
          <a className="btn btn-mini btn-ghost" href="A54 Racing.html">← BACK TO HOME</a>
        </div>
      </header>

      <main className="section" style={{ minHeight: 'calc(100vh - 70px)', padding: '60px var(--gutter)', display: 'flex', alignItems: 'center' }}>
        <div className="auth-container reveal reveal-scale" style={{ width: '100%', margin: '40px auto' }}>
          <div className="auth-head">
            <h1 className="auth-h1">{isLogin ? "TELEMETRY ACCESS" : "DRIVER INDEX ENTRY"}</h1>
            <p className="auth-sub">{isLogin ? "AUTHENTICATE DRIVER PROFILE" : "REGISTER NEW TELEMETRY PROFILE"}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group" style={{ flexDirection: 'row', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label">Driver Tag</label>
                  <input type="text" className="form-input" style={{ width: '100%', marginTop: '8px' }} placeholder="VRT-001" value={tag} onChange={e => setTag(e.target.value)} />
                </div>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label">Full Name / Alias</label>
                  <input type="text" className="form-input" style={{ width: '100%', marginTop: '8px' }} placeholder="M. KOVALAINEN" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="driver@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Password</label>
                {isLogin && <a href="#" className="form-label" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Forgot?</a>}
              </div>
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              {error && <div className="auth-error"><span className="live-dot" style={{ background: 'var(--red)' }}></span> {error}</div>}
            </div>

            <div className="form-action">
              <button type="submit" className="btn btn-primary btn-lg">
                <span>{isLogin ? "INITIALIZE SESSION" : "CREATE PROFILE"}</span>
                <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h9M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
              </button>
            </div>
          </form>

          <div className="auth-foot">
            {isLogin ? "NO ACTIVE PROFILE?" : "ALREADY INDEXED?"} 
            <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(""); }} style={{ marginLeft: '6px' }}>
              {isLogin ? "REQUEST INDEX REGISTRATION →" : "AUTHENTICATE SESSION →"}
            </a>
          </div>
        </div>
      </main>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Auth />);
