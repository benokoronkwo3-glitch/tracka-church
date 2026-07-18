import { useState, useEffect, useCallback } from "react";

const SB_URL = "https://saxtkbtmszkqstdoamvv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheHRrYnRtc3prcXN0ZG9hbXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDU0MzAsImV4cCI6MjA5NjYyMTQzMH0.uXpzhMg_QJR1Ewj5OfFlAwStDrP0gvolCqBrDE1mIqE";

const CHURCHES = {
  grace_of_god: {
    id: "grace_of_god",
    name: "Grace of God Mission International",
    denomination: "His Glory Cathedral",
    address: "33 Trans Nkisi, GRA Onitsha, Anambra State",
    state: "Anambra State",
    pastor: "Bishop Dr Paul Nwachukwu JP",
    pastoralTitle: "Papa",
    phone: "08033210572",
    logo: "GGM",
    welcomeMsg: "Grace of God Mission International warmly welcomes you! We are so glad you joined us today. Bishop Dr Paul Nwachukwu JP (Papa) personally sends his warm greetings and blessings to you. We invite you to make GGM your spiritual home and join us for our enriching programs: Mid-Week Service (Wednesdays), Jesus Clinic, Monday Prayer, and many more. May God bless you richly as you continue to worship with us. You are family!",
    defaultBranches: [
      "HQ - Trans Nkisi GRA",
      "His Glory Parish - Niger Drive GRA",
      "His Glory Parish - Stock Exchange GRA",
      "GGM - Owerri Rd Enugu",
      "GGM - New Market Rd Onitsha",
      "GGM - Fegge",
      "GGM - Awada",
      "GGM - Nnewi",
      "GGM - Nkpor",
    ],
    hqBranch: "HQ - Trans Nkisi GRA",
    theme: {
      primary: "#ea580c",
      dark: "#7c2d12",
      light: "#fff7ed",
      mid: "#ffedd5",
      border: "#fed7aa",
      login: "linear-gradient(135deg,#7c2d12,#ea580c,#fbbf24)",
      logo: "linear-gradient(135deg,#ea580c,#fbbf24)",
    },
  },
};

const HQ_ROLES = ["pastor","hoa","auditor","accounts","treasurer","secretary","worker"];
const BRANCH_ROLES = ["pastor","hoa","accounts","treasurer","secretary","worker"];
const isBishop = user => user?.role === "pastor" && !user?.branch;
const canSeeAllBranches = user => isBishop(user) || user?.role === "auditor" || user?.role === "hoa";

const PERM = {
  pastor:    { fin: true,  del: true,  usr: true  },
  hoa:       { fin: true,  del: false, usr: false },
  auditor:   { fin: true,  del: false, usr: false },
  accounts:  { fin: true,  del: false, usr: false },
  treasurer: { fin: true,  del: false, usr: false },
  secretary: { fin: false, del: false, usr: false },
  worker:    { fin: false, del: false, usr: false },
};

const DEPTS = ["Choir","Ushering","Children Ministry","Youth","Prayer","Media","Welfare","Executive","Men's Fellowship","Women's Fellowship","Teen Fellowship","None"];
const SVC_TYPES = ["Sunday Service","Wednesday Service","Friday Service","Jesus Clinic","Monday Prayer","Special Service","Harvest","Anniversary","Dedication","Other"];
const OFFERING_TYPES = ["General Offering","Special Offering","Seed of Faith","Building Fund","Mission","Welfare","Thanksgiving","Other"];
const EXP_CATS = ["Staff Salary","Utilities","Rent","Maintenance","Generator/Fuel","Welfare","Stationery","Ministry","Outreach","Miscellaneous"];

async function dbCall(path, opts = {}) {
  const { headers: xh = {}, ...rest } = opts;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, { ...rest, headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...xh } });
    if (r.status === 204) return { data: [], error: null };
    const j = await r.json();
    return r.ok ? { data: j, error: null } : { data: null, error: j };
  } catch (e) { return { data: null, error: { message: e.message } }; }
}

const db = {
  get: (t, cid, q = "") => dbCall(`${t}?client_id=eq.${cid}${q ? "&" + q : ""}`),
  post: (t, b) => dbCall(t, { method: "POST", body: JSON.stringify(b) }),
  patch: (t, id, b) => dbCall(`${t}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(b) }),
  remove: (t, id) => dbCall(`${t}?id=eq.${id}`, { method: "DELETE" }),
};

const fmt = n => "N" + Number(n || 0).toLocaleString("en-NG");
const genId = () => Date.now() + "_" + Math.random().toString(36).slice(2, 6);
const tod = () => new Date().toISOString().split("T")[0];

export default function App() {
  const p = new URLSearchParams(window.location.search);
  const fromUrl = p.get("church");
  if (fromUrl && CHURCHES[fromUrl]) { localStorage.setItem("tracka_church_client", fromUrl); window.history.replaceState({}, "", window.location.pathname); }
  const key = fromUrl || localStorage.getItem("tracka_church_client");
  const church = CHURCHES[key];
  const [user, setUser] = useState(null);
  if (!church) return (
    <div style={{ minHeight: "100vh", background: "#7c2d12", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Tracka Church</div>
        <div style={{ fontSize: 14, color: "#fed7aa" }}>Invalid Access Link</div>
        <div style={{ fontSize: 12, color: "#ffedd5", marginTop: 8 }}>Contact your church administrator for the correct link.</div>
      </div>
    </div>
  );
  if (!user) return <LoginScreen church={church} onLogin={setUser} />;
  return <MainApp church={church} user={user} onLogout={() => setUser(null)} />;
}

function LoginScreen({ church, onLogin }) {
  const T = church.theme;
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [dbOk, setDbOk] = useState(null);
  useEffect(() => {
    (async () => {
      const res = await db.get("users", church.id, "order=name.asc");
      if (res.error) { setDbOk(false); setLoading(false); return; }
      setDbOk(true);
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) {
        const owner = { id: genId(), client_id: church.id, name: church.pastor, role: "pastor", branch: null, pin: "0000", email: church.id + "@tracka.ng", active: true };
        await db.post("users", owner); setUsers([owner]);
      } else setUsers(rows);
      setLoading(false);
    })();
  }, [church.id]);
  const go = () => {
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase().trim() && x.pin === pin.trim());
    if (!u) { setErr("Email or PIN incorrect."); return; }
    if (!u.active) { setErr("Account disabled. Contact Bishop."); return; }
    onLogin(u);
  };
  const inp = { width: "100%", background: T.light, border: `1px solid ${T.border}`, borderRadius: 7, padding: "10px 12px", color: T.dark, fontSize: 14, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: T.primary, marginBottom: 5, textTransform: "uppercase" };
  return (
    <div style={{ minHeight: "100vh", background: T.login, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: T.logo, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", flexDirection: "column" }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 18, lineHeight: 1 }}>GGM</div>
          <div style={{ color: "#fbbf24", fontSize: 8, fontWeight: 700, letterSpacing: 1 }}>INTERNATIONAL</div>
        </div>
        <div style={{ textAlign: "center", fontWeight: 900, fontSize: 13, color: T.primary, marginBottom: 2 }}>TRACKA CHURCH</div>
        <div style={{ textAlign: "center", fontWeight: 800, fontSize: 16, color: T.dark, marginBottom: 2 }}>{church.name}</div>
        <div style={{ textAlign: "center", fontSize: 11, color: T.primary, fontStyle: "italic", marginBottom: 2 }}>{church.denomination}</div>
        <div style={{ textAlign: "center", fontSize: 11, color: "#64748b", marginBottom: 20 }}>{church.address}</div>
        <div style={{ height: 1, background: T.border, marginBottom: 20 }} />
        {dbOk === false && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 14, marginBottom: 16, color: "#dc2626", fontSize: 13 }}>Cannot connect. Check internet.</div>}
        <label style={lbl}>Email Address</label>
        <input style={{ ...inp, marginBottom: 14 }} placeholder="your@email.ng" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} />
        <label style={lbl}>PIN</label>
        <input style={inp} type="password" maxLength={8} placeholder="Enter your PIN" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} />
        {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{err}</div>}
        <button style={{ width: "100%", background: T.logo, border: "none", borderRadius: 10, color: "#fff", padding: "13px", fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 16 }} onClick={go} disabled={loading}>{loading ? "Connecting..." : "Enter Tracka Church"}</button>
        <div style={{ fontSize: 11, color: T.primary, marginTop: 14, textAlign: "center" }}>{church.pastor} (Papa) - Change PIN after first login</div>
      </div>
    </div>
  );
}

function MainApp({ church, user, onLogout }) {
  const T = church.theme, CID = church.id;
  const [tab, setTab] = useState("dashboard");
  const [ab, setAb] = useState(null);
  const [dbOk, setDbOk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [comers, setComers] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [tithes, setTithes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [branches, setBranches] = useState([]);

  const t2 = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const ask = (msg, fn) => setConfirm({ msg, fn });

  const loadBranches = useCallback(async () => {
    const r = await db.get("organisations", CID, "system_type=eq.church_branch&active=eq.true&order=name.asc");
    if (r.data?.length) {
      setBranches(r.data.map(o => o.name));
    } else {
      const defaultBranches = church.defaultBranches || [];
      setBranches(defaultBranches);
      for (const b of defaultBranches) {
        await db.post("organisations", { id: genId(), client_id: CID, name: b, system_type: "church_branch", active: true });
      }
    }
  }, [CID]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, mb, of, ti, ex, pr, at, co] = await Promise.all([
        db.get("users", CID, "order=name.asc"),
        db.get("church_members", CID, "order=name.asc"),
        db.get("church_offerings", CID, "order=date.desc"),
        db.get("church_tithes", CID, "order=date.desc"),
        db.get("expenses", CID, "order=date.desc"),
        db.get("church_projects", CID, "order=created_at.desc"),
        db.get("transactions", CID, "system_type=eq.church_attendance&order=date.desc"),
        db.get("people", CID, "system_type=eq.church_comer&order=created_at.desc"),
      ]);
      setDbOk(!u.error);
      if (u.data?.length) setUsers(u.data);
      if (mb.data?.length) setMembers(mb.data);
      if (of.data?.length) setOfferings(of.data);
      if (ti.data?.length) setTithes(ti.data);
      if (ex.data?.length) setExpenses(ex.data);
      if (pr.data?.length) setProjects(pr.data);
      if (at.data?.length) setAttendance(at.data);
      if (co.data?.length) setComers(co.data);
    } catch { setDbOk(false); }
    setLoading(false);
  }, [CID]);

  useEffect(() => { loadBranches(); loadAll(); }, [loadBranches, loadAll]);

  const isBishopUser = isBishop(user);
  const canSeeAll = canSeeAllBranches(user);
  const P = PERM[user?.role] || {};
  const myBranch = canSeeAll ? ab : user?.branch;
  const myBranches = canSeeAll ? branches : (user?.branch ? [user.branch] : []);
  const fB = arr => canSeeAll && !ab ? arr : arr.filter(r => r.branch === myBranch);
  const fOf = fB(offerings), fTi = fB(tithes), fEx = fB(expenses), fMb = fB(members);
  const fAt = fB(attendance), fCo = fB(comers);
  const totOf = fOf.reduce((s, r) => s + +r.amount, 0);
  const totTi = fTi.reduce((s, r) => s + +r.amount, 0);
  const totEx = fEx.reduce((s, r) => s + +r.amount, 0);
  const totIncome = totOf + totTi;

  const doAddMember = async d => { const row = { client_id: CID, ...d, id: genId(), joined: tod(), active: true }; const { error } = await db.post("church_members", row); if (error) { t2("Error", "error"); return; } setMembers(p => [...p, row]); t2(d.name + " added"); };
  const doAddOffering = async d => { const row = { client_id: CID, ...d, id: genId(), recorded_by: user.id }; const { error } = await db.post("church_offerings", row); if (error) { t2("Error", "error"); return; } setOfferings(p => [row, ...p]); t2("Offering recorded"); };
  const doAddTithe = async d => { const row = { client_id: CID, ...d, id: genId(), recorded_by: user.id }; const { error } = await db.post("church_tithes", row); if (error) { t2("Error", "error"); return; } setTithes(p => [row, ...p]); t2("Tithe recorded"); };
  const doAddExp = async d => { const row = { client_id: CID, ...d, id: genId(), addedBy: user.id }; const { error } = await db.post("expenses", row); if (error) { t2("Error", "error"); return; } setExpenses(p => [row, ...p]); t2("Expense saved"); };
  const doAddProject = async d => { const row = { client_id: CID, ...d, id: genId(), created_at: tod(), status: "Active", raised: 0 }; const { error } = await db.post("church_projects", row); if (error) { t2("Error", "error"); return; } setProjects(p => [row, ...p]); t2("Project added"); };
  const doUpdateProject = async (id, updates) => { await db.patch("church_projects", id, updates); setProjects(p => p.map(r => r.id === id ? { ...r, ...updates } : r)); t2("Updated"); };
  const doAddAttendance = async d => { const row = { client_id: CID, system_type: "church_attendance", ...d, id: genId() }; const { error } = await db.post("transactions", row); if (error) { t2("Error", "error"); return; } setAttendance(p => [row, ...p]); t2("Attendance recorded"); };
  const doAddComer = async d => { const row = { client_id: CID, system_type: "church_comer", ...d, id: genId(), created_at: tod(), active: true }; const { error } = await db.post("people", row); if (error) { t2("Error", "error"); return; } setComers(p => [row, ...p]); t2(d.name + " recorded!"); };

  const doAddBranch = async name => {
    if (!isBishopUser) { t2("Only Bishop can add branches", "error"); return; }
    if (branches.includes(name)) { t2("Branch already exists", "error"); return; }
    const row = { id: genId(), client_id: CID, name, system_type: "church_branch", active: true };
    const { error } = await db.post("organisations", row);
    if (error) { t2("Error: " + (error.message || JSON.stringify(error)), "error"); return; }
    setBranches(p => [...p, name]);
    t2("Branch added: " + name);
  };

  const doDeleteBranch = async name => {
    if (!isBishopUser) { t2("Only Bishop can delete branches", "error"); return; }
    const r = await db.get("organisations", CID, "system_type=eq.church_branch");
    if (r.data?.length) {
      const found = r.data.find(o => o.name === name);
      if (found) await db.remove("organisations", found.id);
    }
    setBranches(p => p.filter(b => b !== name));
    t2("Branch deleted: " + name, "info");
  };

  const doDel = async (type, id) => {
    const tbl = { member: "church_members", offering: "church_offerings", tithe: "church_tithes", expense: "expenses", project: "church_projects", attendance: "transactions", comer: "people" };
    await db.remove(tbl[type], id);
    if (type === "member") setMembers(p => p.filter(x => x.id !== id));
    if (type === "offering") setOfferings(p => p.filter(x => x.id !== id));
    if (type === "tithe") setTithes(p => p.filter(x => x.id !== id));
    if (type === "expense") setExpenses(p => p.filter(x => x.id !== id));
    if (type === "project") setProjects(p => p.filter(x => x.id !== id));
    if (type === "attendance") setAttendance(p => p.filter(x => x.id !== id));
    if (type === "comer") setComers(p => p.filter(x => x.id !== id));
    setConfirm(null); t2("Deleted", "info");
  };

  const doAddUser = async d => { const row = { client_id: CID, ...d, id: genId(), active: true }; const { error } = await db.post("users", row); if (error) { t2("Error: " + (error.message || ""), "error"); return; } setUsers(p => [...p, row]); t2(d.name + " ad
