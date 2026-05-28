/* global React, ReactDOM, supabase */
const { useState, useEffect } = React;

const SUPABASE_URL = "https://vckhnigfycrgmzsfrzyf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZja2huaWdmeWNyZ216c2ZyenlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDczMDYsImV4cCI6MjA5MzkyMzMwNn0.0BhnorXTpmthkets0XxoIHUI67UAf1HYRT2_rrrZyMg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function DashboardHome({ driver }) {
  const [recentRaces, setRecentRaces] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    if (!driver || !driver.id) return;

    // Fetch Recent Races
    supabaseClient
      .from('v_dashboard_recent_races')
      .select('*')
      .eq('driver_id', driver.id)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) {
          setRecentRaces(data.map(r => ({
            id: r.id,
            pos: r.pos,
            name: r.name,
            track: r.track,
            class: r.class,
            change: (r.rating_change >= 0 ? "+" : "") + r.rating_change,
            trend: r.rating_change >= 0 ? "up" : "down"
          })));
        }
      });

    // Fetch Upcoming Events
    supabaseClient
      .from('v_dashboard_upcoming_events')
      .select('*')
      .eq('status', 'UPCOMING')
      .order('event_date', { ascending: true })
      .limit(3)
      .then(({ data }) => {
        if (data) {
          setUpcomingEvents(data.map(e => ({
            id: e.id,
            date: new Date(e.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
            name: e.title,
            class: e.car_class || 'TBA',
            track: e.track
          })));
        }
      });
  }, [driver]);

  return (
    <>
      <div className="dash-head reveal">
        <h1 className="dash-h1">DRIVER DASHBOARD</h1>
        <p className="dash-sub">TELEMETRY SYNCED · {new Date().toLocaleDateString()}</p>
      </div>
      <div className="dash-grid stagger">
        <div className="widget w-rating reveal">
          <div className="widget-head"><span className="widget-title">CURRENT GRI RATING</span></div>
          <div className="widget-body">
            <div className="rating-big">{driver.rating.toLocaleString()}</div>
            <div className="rating-delta rating-up"><span className="live-dot" style={{ background: 'var(--green)' }}></span> {driver.change} LAST EVENT</div>
            <div className="rating-ranks">
              <div><div className="r-rank-k">GLOBAL RANK</div><div className="r-rank-v">#{driver.globalRank}</div></div>
              <div><div className="r-rank-k">{driver.flag} COUNTRY RANK</div><div className="r-rank-v">#{driver.countryRank}</div></div>
            </div>
          </div>
        </div>
        <div className="widget w-races reveal">
          <div className="widget-head"><span className="widget-title">RECENT RACES</span></div>
          <div className="widget-body" style={{ padding: '8px 20px' }}>
            <div className="race-list">
              {recentRaces.map(r => (
                <div key={r.id} className="race-item">
                  <div className="ri-pos">{r.pos}</div>
                  <div className="ri-event"><span className="ri-e-name">{r.name}</span><span className="ri-e-track">{r.track}</span></div>
                  <div className="ri-class">{r.class}</div>
                  <div className={`ri-change ${r.trend === 'up' ? 'rating-up' : 'rating-down'}`}>{r.trend === 'up' ? '▲' : '▼'} {r.change}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="widget w-graph reveal">
          <div className="widget-head"><span className="widget-title">RATING PROGRESSION</span></div>
          <div className="widget-body">
            <div className="graph-placeholder">[ DRIVER PROGRESS GRAPH VISUALIZATION ]</div>
          </div>
        </div>
        <div className="widget w-events reveal">
          <div className="widget-head"><span className="widget-title">UPCOMING EVENTS</span></div>
          <div className="widget-body">
            <div className="event-list">
              {upcomingEvents.map(e => (
                <div key={e.id} className="event-item">
                  <span className="ei-date">{e.date}</span><div className="ei-name">{e.name}</div>
                  <div className="ei-meta"><span>{e.track}</span><span>{e.class}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileView({ driver }) {
  const [disciplines, setDisciplines] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!driver || !driver.id) return;
    supabaseClient
      .from('driver_ratings')
      .select('*, disciplines(discipline_name), vehicle_classes(class_name)')
      .eq('driver_id', driver.id)
      .then(({ data }) => {
        if (data) {
          const disc = [];
          const cls = [];
          data.forEach(d => {
            if (d.class_id) {
              cls.push({ name: d.vehicle_classes?.class_name, rating: d.rating_value });
            } else if (d.discipline_id) {
              disc.push({ name: d.disciplines?.discipline_name, rating: d.rating_value });
            }
          });
          setDisciplines(disc);
          setClasses(cls);
        }
      });
  }, [driver]);

  return (
    <>
      <div className="profile-card reveal">
        <div className="pc-info">
          <div className="pc-tag">{driver.tag}</div>
          <h1 className="pc-name">{driver.name}</h1>
          <div className="pc-meta"><span>{driver.flag} FINLAND</span><span>GLOBAL RANK #{driver.globalRank}</span><span>COUNTRY RANK #{driver.countryRank}</span></div>
        </div>
        <div className="pc-rating-box">
          <div className="pc-rating-val">{driver.rating.toLocaleString()}</div>
          <div className="pc-rating-label">CURRENT GRI RATING</div>
        </div>
      </div>
      <div className="dash-grid stagger">
        <div className="widget w-events reveal">
          <div className="widget-head"><span className="widget-title">DISCIPLINE RATINGS</span></div>
          <div className="widget-body"><div className="breakdown-grid" style={{ gridTemplateColumns: '1fr' }}>{disciplines.map(d => <div key={d.name} className="bd-item"><span className="bd-name">{d.name}</span><span className="bd-val" style={{ color: d.rating === 'UNRANKED' ? 'var(--fg-mute)' : 'var(--green)' }}>{d.rating}</span></div>)}</div></div>
        </div>
        <div className="widget w-events reveal">
          <div className="widget-head"><span className="widget-title">CLASS RATINGS</span></div>
          <div className="widget-body"><div className="breakdown-grid" style={{ gridTemplateColumns: '1fr' }}>{classes.map(c => <div key={c.name} className="bd-item"><span className="bd-name">{c.name}</span><span className="bd-val" style={{ color: 'var(--green)' }}>{c.rating}</span></div>)}</div></div>
        </div>
      </div>
    </>
  );
}

function LeaderboardsView() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    supabaseClient
      .from('v_driver_leaderboard')
      .select('*')
      .order('rating', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setDrivers(data.map((d, i) => ({
            rank: i + 1,
            tag: d.driver_tag,
            name: d.full_name,
            country: d.country || 'UNK',
            flag: d.flag || '🏁',
            rating: d.rating,
            delta: "+0",
            trend: "flat",
            plat: d.platforms || "PC"
          })));
        }
      });
  }, []);
  return (
    <>
      <div className="dash-head"><h1 className="dash-h1">INDEX LEADERBOARDS</h1><p className="dash-sub">COMPARE DRIVER RATINGS</p></div>
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center' }}><span className="filter-label">REGION:</span><select className="filter-select"><option>GLOBAL</option><option>COUNTRY</option></select></div>
        <div style={{ display: 'flex', alignItems: 'center' }}><span className="filter-label">DISCIPLINE:</span><select className="filter-select"><option>ROAD</option><option>KARTING</option></select></div>
        <div style={{ display: 'flex', alignItems: 'center' }}><span className="filter-label">CLASS:</span><select className="filter-select"><option>ALL CLASSES</option><option>GT3</option><option>FORMULA</option></select></div>
      </div>
      <div className="lb-card">
        <div className="lb-head"><span>RANK</span><span>DRIVER</span><span className="hide-s">PLATFORM</span><span className="hide-s">FORM</span><span>Δ 7d</span><span className="ralign">RATING</span></div>
        {drivers.map((d, i) => (
          <div key={d.tag} className={"lb-row " + (i === 0 ? "lead" : "")}>
            <span className="lb-rank"><span className="lb-rank-n">{String(d.rank).padStart(2, "0")}</span>{i === 0 && <span className="lb-crown">P1</span>}</span>
            <span className="lb-driver"><span className="lb-flag">{d.flag}</span><span className="lb-name"><span className="lb-name-1">{d.name}</span><span className="lb-name-2">{d.tag} · {d.country}</span></span></span>
            <span className="lb-plat hide-s">{d.plat}</span><span className="lb-form hide-s">
              {Array.from({ length: 8 }).map((_, j) => {
                const v = (i + j) % 4;
                const cl = v === 0 ? "fb fb-purple" : v === 1 ? "fb fb-green" : v === 2 ? "fb fb-yellow" : "fb fb-red";
                return <span key={j} className={cl} />;
              })}
            </span>
            <span className={"lb-delta lb-" + d.trend}>{d.trend === "up" ? "▲" : "▼"} {d.delta}</span><span className="lb-rating ralign">{d.rating.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function EventsView({ setView }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    supabaseClient
      .from('v_dashboard_upcoming_events')
      .select('*')
      .order('event_date', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setEvents(data.map(e => ({
            id: e.id,
            title: e.title,
            track: e.track,
            class: e.car_class || 'TBA',
            status: e.status,
            date: new Date(e.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
            participants: e.participants_count,
            registered: false
          })));
        }
      });
  }, []);
  return (
    <>
      <div className="dash-head"><h1 className="dash-h1">RACING EVENTS</h1><p className="dash-sub">SANCTIONED BY THE A54 INDEX</p></div>
      <div className="page-tabs"><div className="page-tab active">UPCOMING</div><div className="page-tab">PAST RESULTS</div></div>
      <div className="events-grid">
        {events.map(e => (
          <div key={e.id} className="event-card" onClick={() => setView('Results')}>
            <div className="ec-img"><div className="ec-status" style={{ color: e.registered ? 'var(--green)' : '#fff' }}>{e.registered ? '● REGISTERED' : e.status}</div></div>
            <div className="ec-body"><span className="ec-date">{e.date}</span><h3 className="ec-title">{e.title}</h3><div className="ec-meta"><span>TRACK: {e.track}</span><span>CLASS: {e.class}</span><span>DRIVERS: {e.participants}</span></div></div>
          </div>
        ))}
      </div>
    </>
  );
}

function ResultsView({ setView }) {
  const [resultData, setResultData] = useState([]);
  const [eventDetails, setEventDetails] = useState({ title: "LOADING...", track: "...", class: "..." });

  useEffect(() => {
    supabaseClient
      .from('v_dashboard_upcoming_events')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('event_date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data: eventData }) => {
        if (eventData) {
          setEventDetails({
            title: eventData.title,
            track: eventData.track,
            class: eventData.car_class || 'TBA'
          });

          supabaseClient
            .from('race_results')
            .select('*, drivers(driver_tag, real_name), races!inner(event_id)')
            .eq('races.event_id', eventData.id)
            .order('finishing_position', { ascending: true })
            .then(({ data: results }) => {
              if (results) {
                setResultData(results.map(r => ({
                  pos: r.finishing_position,
                  tag: r.drivers?.driver_tag || 'UNK',
                  name: r.drivers?.real_name || 'Unknown',
                  inc: r.safety_change || 0,
                  rating: (r.rating_change >= 0 ? "+" : "") + r.rating_change,
                  trend: r.rating_change >= 0 ? "up" : "down"
                })));
              }
            });
        }
      });
  }, []);

  return (
    <>
      <div className="dash-head">
        <a href="#" onClick={(e) => { e.preventDefault(); setView("Dashboard"); }} className="res-back">← BACK</a>
        <h1 className="dash-h1">EVENT RESULTS</h1>
        <p className="dash-sub">{eventDetails.title} · {eventDetails.track} · {eventDetails.class}</p>
      </div>
      <div className="lb-card">
        <div className="lb-head" style={{ gridTemplateColumns: '70px 2fr 1fr 1fr' }}><span>POS</span><span>DRIVER</span><span className="ralign">INCIDENTS</span><span className="ralign">RATING Δ</span></div>
        {resultData.map((d, i) => (
          <div key={d.tag} className={"lb-row " + (i === 0 ? "lead pulse" : "")} style={{ gridTemplateColumns: '70px 2fr 1fr 1fr' }}>
            <span className="lb-rank"><span className="lb-rank-n">{String(d.pos).padStart(2, "0")}</span></span>
            <span className="lb-driver"><span className="lb-name"><span className="lb-name-1">{d.name}</span><span className="lb-name-2">{d.tag}</span></span></span>
            <span className="lb-rating ralign" style={{ fontSize: '18px', color: d.inc === 0 ? 'var(--green)' : 'inherit' }}>{d.inc}x</span>
            <span className={"lb-delta ralign lb-" + d.trend} style={{ fontSize: '16px' }}>{d.rating}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function SettingsView({ driver, setDriver }) {
  const [formData, setFormData] = useState({
    name: driver.name || '',
    tag: driver.tag || '',
    country: driver.country || 'FINLAND',
    flag: driver.flag || '🇫🇮'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || '',
        tag: driver.tag || '',
        country: driver.country || 'FINLAND',
        flag: driver.flag || '🇫🇮'
      });
    }
  }, [driver]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await supabaseClient
      .from('drivers')
      .update({
        real_name: formData.name,
        driver_tag: formData.tag,
        country: formData.country,
        flag: formData.flag
      })
      .eq('driver_id', driver.id);

    if (error) {
      setMessage('Error updating profile.');
      console.error(error);
    } else {
      setMessage('Profile updated successfully!');
      setDriver({
        ...driver,
        name: formData.name,
        tag: formData.tag,
        country: formData.country,
        flag: formData.flag
      });
    }
    setLoading(false);
  };

  return (
    <>
      <div className="dash-head reveal">
        <h1 className="dash-h1">PROFILE SETTINGS</h1>
        <p className="dash-sub">MANAGE YOUR INDEX IDENTITY</p>
      </div>
      <div className="widget reveal" style={{ maxWidth: '600px' }}>
        <div className="widget-head"><span className="widget-title">EDIT DETAILS</span></div>
        <div className="widget-body">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">FULL NAME</label>
              <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">DRIVER TAG</label>
              <input type="text" name="tag" className="form-input" value={formData.tag} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">COUNTRY</label>
              <input type="text" name="country" className="form-input" value={formData.country} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">FLAG (EMOJI)</label>
              <input type="text" name="flag" className="form-input" value={formData.flag} onChange={handleChange} required maxLength="4" />
            </div>
            
            {message && <div style={{ marginBottom: '16px', color: message.includes('Error') ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--mono)', fontSize: '12px' }}>{message}</div>}

            <div className="form-action" style={{ marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function SPA() {
  const [view, setView] = useState("Dashboard");
  const [driver, setDriver] = useState({ name: "LOADING...", tag: "...", rating: 2847 });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        window.location.href = "auth.html";
        return;
      }
      const user = session.user;
      
      const { data: profile } = await supabaseClient
        .from('v_driver_leaderboard')
        .select('*')
        .eq('driver_id', user.id)
        .single();

      if (profile) {
        setDriver({
          id: profile.driver_id,
          name: profile.full_name || user.email,
          tag: profile.driver_tag || "VRT-???",
          country: profile.country || "FINLAND",
          rating: profile.rating || 2847,
          globalRank: 1,
          countryRank: 1,
          flag: profile.flag || "🇫🇮",
          change: "+12"
        });
      } else {
        setDriver({
          id: user.id,
          name: user.user_metadata?.full_name || user.email,
          tag: user.user_metadata?.driver_tag || "VRT-???",
          country: "FINLAND",
          rating: 2847,
          globalRank: 1,
          countryRank: 1,
          flag: "🇫🇮",
          change: "+12"
        });
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!session) {
        window.location.href = "auth.html";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = "auth.html";
  };

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    els.forEach(el => el.classList.remove("in"));
    setTimeout(() => {
      els.forEach(el => el.classList.add("in"));
    }, 50);
  }, [view]);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="app-brand" onClick={() => window.location.href="A54 Racing.html"}>
          <img src="assets/a54-logo.png" alt="GRI" />
          <span className="app-brand-name">GRI</span>
        </div>
        <nav className="app-nav">
          {["Dashboard", "Profile", "Leaderboards", "Events", "Results", "Settings"].map(v => (
            <div key={v} className={"app-nav-link " + (view === v ? "active" : "")} onClick={() => setView(v)}>
              {v}
            </div>
          ))}
        </nav>
        <div className="app-user">
          <div className="app-user-name">{driver.name}</div>
          <div className="app-user-meta" style={{ alignItems: 'center' }}>
            <span>{driver.tag}</span>
            <span className="rating-display" style={{ color: 'var(--green)' }}>● {driver.rating}</span>
            <div className="mobile-actions">
              <button className="btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                <i className={theme === 'dark' ? 'ph ph-sun' : 'ph ph-moon'} style={{ fontSize: '16px' }}></i>
              </button>
              <a href="#" onClick={handleLogout} className="app-logout" style={{ padding: '6px 10px', margin: 0, border: '1px solid var(--line)', borderRadius: '4px', background: 'var(--bg-2)' }}>LOGOUT</a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        <div className="top-actions">
          <button className="btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ padding: '8px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? <><i className="ph ph-sun" style={{ fontSize: '18px' }}></i> <span className="btn-text">LIGHT</span></> : <><i className="ph ph-moon" style={{ fontSize: '18px' }}></i> <span className="btn-text">DARK</span></>}
          </button>
          <a href="#" onClick={handleLogout} className="app-logout">LOGOUT</a>
        </div>
        <div className="app-content">
          {view === "Dashboard" && <DashboardHome driver={driver} />}
          {view === "Profile" && <ProfileView driver={driver} />}
          {view === "Leaderboards" && <LeaderboardsView />}
          {view === "Events" && <EventsView setView={setView} />}
          {view === "Results" && <ResultsView setView={setView} />}
          {view === "Settings" && <SettingsView driver={driver} setDriver={setDriver} />}
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SPA />);
