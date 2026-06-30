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
    pastor: "Bishop Dr Paul Nwachukwu",
    phone: "08033210572",
    logo: "GGM",
    branches: ["HQ - Trans Nkisi GRA","His Glory Parish - Niger Drive GRA","His Glory Parish - Stock Exchange GRA","GGM - Owerri Rd Enugu","GGM - New Market Rd Onitsha","GGM - Fegge","GGM - Awada","GGM - Nnewi","GGM - Nkpor"],
    theme: { primary: "#ea580c", dark: "#7c2d12", light: "#fff7ed", mid: "#ffedd5", border: "#fed7aa", login: "linear-gradient(135deg,#7c2d12,#ea580c,#fbbf24)", logo: "linear-gradient(135deg,#ea580c,#fbbf24)" },
  },
};

const PERM = { pastor:{fin:true,del:true,usr:true}, treasurer:{fin:true,del:false,usr:false}, secretary:{fin:false,del:false,usr:false}, worker:{fin:false,del:false,usr:false} };

async function dbCall(path,opts={}){
  const{headers:xh={},...rest}=opts;
  try{
    const r=await fetch(`${SB_URL}/rest/v1/${path}`,{...rest,headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`,"Content-Type":"application/json",Prefer:"return=representation",...xh}});
    if(r.status===204)return{data:[],error:null};
    const j=await r.json();
    return r.ok?{data:j,error:null}:{data:null,error:j};
  }catch(e){return{data:null,error:{message:e.message}};}
}
const db={
  get:(t,cid,q="")=>dbCall(`${t}?client_id=eq.${cid}${q?"&"+q:""}`),
  post:(t,b)=>dbCall(t,{method:"POST",body:JSON.stringify(b)}),
  patch:(t,id,b)=>dbCall(`${t}?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(b)}),
  remove:(t,id)=>dbCall(`${t}?id=eq.${id}`,{method:"DELETE"}),
};
const fmt=n=>"N"+Number(n||0).toLocaleString("en-NG");
const genId=()=>Date.now()+"_"+Math.random().toString(36).slice(2,6);
const tod=()=>new Date().toISOString().split("T")[0];

export default function App(){
  const p=new URLSearchParams(window.location.search);
  const fromUrl=p.get("church");
  if(fromUrl&&CHURCHES[fromUrl]){localStorage.setItem("tracka_church_client",fromUrl);window.history.replaceState({},"",window.location.pathname);}
  const key=fromUrl||localStorage.getItem("tracka_church_client");
  const church=CHURCHES[key];
  const[user,setUser]=useState(null);
  if(!church)return(
    <div style={{minHeight:"100vh",background:"#7c2d12",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:22,fontWeight:800,marginBottom:8}}>Tracka Church</div>
        <div style={{fontSize:14,color:"#fed7aa",marginBottom:4}}>Invalid Access Link</div>
        <div style={{fontSize:12,color:"#ffedd5"}}>Contact your church administrator for the correct link.</div>
      </div>
    </div>
  );
  if(!user)return<LoginScreen church={church} onLogin={setUser}/>;
  return<MainApp church={church} user={user} onLogout={()=>setUser(null)}/>;
}

function LoginScreen({church,onLogin}){
  const T=church.theme;
  const[users,setUsers]=useState([]);
  const[email,setEmail]=useState("");
  const[pin,setPin]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(true);
  const[dbOk,setDbOk]=useState(null);
  useEffect(()=>{
    (async()=>{
      try{
        const res=await db.get("users",church.id,"order=name.asc");
        if(res.error){setDbOk(false);setLoading(false);return;}
        setDbOk(true);
        const rows=Array.isArray(res.data)?res.data:[];
        if(rows.length===0){
          const owner={id:genId(),client_id:church.id,name:church.pastor,role:"pastor",branch:null,pin:"0000",email:church.id+"@tracka.ng",active:true};
          await db.post("users",owner);setUsers([owner]);
        }else setUsers(rows);
      }catch(e){setDbOk(false);}
      setLoading(false);
    })();
  },[church.id]);
  const go=()=>{
    const u=users.find(x=>x.email.toLowerCase()===email.toLowerCase().trim()&&x.pin===pin.trim());
    if(!u){setErr("Email or PIN incorrect.");return;}
    if(!u.active){setErr("Account disabled. Contact pastor.");return;}
    onLogin(u);
  };
  const inp={width:"100%",background:T.light,border:`1px solid ${T.border}`,borderRadius:7,padding:"10px 12px",color:T.dark,fontSize:14,outline:"none",boxSizing:"border-box"};
  const lbl={display:"block",fontSize:11,fontWeight:700,color:T.primary,marginBottom:5,textTransform:"uppercase",letterSpacing:.5};
  return(
    <div style={{minHeight:"100vh",background:T.login,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",padding:20}}>
      <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"40px 36px",width:"100%",maxWidth:420}}>
        <div style={{width:56,height:56,borderRadius:16,background:T.logo,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:16,margin:"0 auto 14px"}}>{church.logo}</div>
        <div style={{textAlign:"center",fontWeight:900,fontSize:13,color:T.primary,marginBottom:2}}>TRACKA CHURCH</div>
        <div style={{textAlign:"center",fontWeight:800,fontSize:18,color:T.dark,marginBottom:4}}>{church.name}</div>
        <div style={{textAlign:"center",fontSize:12,color:T.primary,fontStyle:"italic",marginBottom:4}}>{church.denomination}</div>
        <div style={{textAlign:"center",fontSize:12,color:"#64748b",marginBottom:4}}>{church.address}</div>
        <div style={{height:1,background:T.border,margin:"16px 0 20px"}}/>
        {dbOk===false&&<div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:14,marginBottom:16,color:"#dc2626",fontSize:13}}>Cannot connect to database</div>}
        <label style={lbl}>Email Address</label>
        <input style={{...inp,marginBottom:14}} placeholder="your@email.ng" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
        <label style={lbl}>PIN</label>
        <input style={inp} type="password" maxLength={8} placeholder="Enter your PIN" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
        {err&&<div style={{color:"#dc2626",fontSize:13,marginTop:8}}>{err}</div>}
        <button style={{width:"100%",background:T.logo,border:"none",borderRadius:10,color:"#fff",padding:"13px",fontWeight:800,fontSize:15,cursor:"pointer",marginTop:16}} onClick={go} disabled={loading}>{loading?"Connecting...":"Enter Tracka Church"}</button>
        <div style={{fontSize:11,color:T.primary,marginTop:14,textAlign:"center"}}>{church.pastor} - Change PIN after first login</div>
      </div>
    </div>
  );
}

function MainApp({church,user,onLogout}){
  const T=church.theme,CID=church.id;
  const[tab,setTab]=useState("dashboard");
  const[ab,setAb]=useState(null);
  const[dbOk,setDbOk]=useState(null);
  const[loading,setLoading]=useState(true);
  const[toast,setToast]=useState(null);
  const[confirm,setConfirm]=useState(null);
  const[users,setUsers]=useState([]);
  const[members,setMembers]=useState([]);
  const[offerings,setOfferings]=useState([]);
  const[tithes,setTithes]=useState([]);
  const[expenses,setExpenses]=useState([]);
  const[projects,setProjects]=useState([]);
  const[branches,setBranches]=useState(church.branches||[]);
  const t2=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};
  const ask=(msg,fn)=>setConfirm({msg,fn});
  const loadAll=useCallback(async()=>{
    setLoading(true);
    try{
      const[u,mb,of,ti,ex,pr]=await Promise.all([
        db.get("users",CID,"order=name.asc"),
        db.get("church_members",CID,"order=name.asc"),
        db.get("church_offerings",CID,"order=date.desc"),
        db.get("church_tithes",CID,"order=date.desc"),
        db.get("expenses",CID,"order=date.desc"),
        db.get("church_projects",CID,"order=created_at.desc"),
      ]);
      setDbOk(!u.error);
      if(u.data?.length)setUsers(u.data);
      if(mb.data?.length)setMembers(mb.data);
      if(of.data?.length)setOfferings(of.data);
      if(ti.data?.length)setTithes(ti.data);
      if(ex.data?.length)setExpenses(ex.data);
      if(pr.data?.length)setProjects(pr.data);
    }catch{setDbOk(false);}
    setLoading(false);
  },[CID]);
  useEffect(()=>{loadAll();},[loadAll]);
  const isPastor=user?.role==="pastor";
  const P=PERM[user?.role]||{};
  const myBranch=isPastor?ab:user?.branch;
  const myBranches=isPastor?branches:(user?.branch?[user.branch]:[]);
  const fB=arr=>isPastor&&!ab?arr:arr.filter(r=>r.branch===myBranch);
  const fOf=fB(offerings),fTi=fB(tithes),fEx=fB(expenses),fMb=fB(members);
  const totOf=fOf.reduce((s,r)=>s+ +r.amount,0);
  const totTi=fTi.reduce((s,r)=>s+ +r.amount,0);
  const totIncome=totOf+totTi;
  const totEx=fEx.reduce((s,r)=>s+ +r.amount,0);
  const doAddMember=async d=>{const row={client_id:CID,...d,id:genId(),joined:tod(),active:true};const{error}=await db.post("church_members",row);if(error){t2("Error","error");return;}setMembers(p=>[...p,row]);t2(d.name+" added");};
  const doAddOffering=async d=>{const row={client_id:CID,...d,id:genId(),recorded_by:user.id};const{error}=await db.post("church_offerings",row);if(error){t2("Error","error");return;}setOfferings(p=>[row,...p]);t2("Offering recorded");};
  const doAddTithe=async d=>{const row={client_id:CID,...d,id:genId(),recorded_by:user.id};const{error}=await db.post("church_tithes",row);if(error){t2("Error","error");return;}setTithes(p=>[row,...p]);t2("Tithe recorded");};
  const doAddExp=async d=>{const row={client_id:CID,...d,id:genId(),addedBy:user.id};const{error}=await db.post("expenses",row);if(error){t2("Error","error");return;}setExpenses(p=>[row,...p]);t2("Expense saved");};
  const doAddProject=async d=>{const row={client_id:CID,...d,id:genId(),created_at:tod(),status:"Active",raised:0};const{error}=await db.post("church_projects",row);if(error){t2("Error","error");return;}setProjects(p=>[row,...p]);t2("Project added");};
  const doUpdateProject=async(id,updates)=>{await db.patch("church_projects",id,updates);setProjects(p=>p.map(r=>r.id===id?{...r,...updates}:r));t2("Updated");};
  const doDel=async(type,id)=>{
    const tbl={member:"church_members",offering:"church_offerings",tithe:"church_tithes",expense:"expenses",project:"church_projects"};
    await db.remove(tbl[type],id);
    if(type==="member")setMembers(p=>p.filter(x=>x.id!==id));
    if(type==="offering")setOfferings(p=>p.filter(x=>x.id!==id));
    if(type==="tithe")setTithes(p=>p.filter(x=>x.id!==id));
    if(type==="expense")setExpenses(p=>p.filter(x=>x.id!==id));
    if(type==="project")setProjects(p=>p.filter(x=>x.id!==id));
    setConfirm(null);t2("Deleted","info");
  };
  const doAddUser=async d=>{const row={client_id:CID,...d,id:genId(),active:true};const{error}=await db.post("users",row);if(error){t2("Error","error");return;}setUsers(p=>[...p,row]);t2(d.name+" added");};
  const doToggle=async uid=>{const u=users.find(x=>x.id===uid);if(!u)return;await db.patch("users",uid,{active:!u.active});setUsers(p=>p.map(x=>x.id===uid?{...x,active:!x.active}:x));t2(u.name+" "+(u.active?"disabled":"enabled"));};
  const doPin=async(uid,pin)=>{await db.patch("users",uid,{pin});setUsers(p=>p.map(u=>u.id===uid?{...u,pin}:u));t2("PIN updated");};
  const nav=[{id:"dashboard",label:"Dashboard"},{id:"members",label:"Members"},{id:"offerings",label:"Offerings"},{id:"tithes",label:"Tithes"},{id:"expenses",label:"Expenses"},{id:"projects",label:"Projects"},{id:"branches",label:"Branches"},{id:"reports",label:"Reports"},...(isPastor?[{id:"users",label:"Users & Access"}]:[])];
  const S={
    inp:{width:"100%",background:T.light,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 10px",color:T.dark,fontSize:13,outline:"none",boxSizing:"border-box"},
    lbl:{display:"block",fontSize:10,fontWeight:700,color:T.primary,marginBottom:5,textTransform:"uppercase",letterSpacing:.5},
    btn:{display:"flex",alignItems:"center",gap:7,background:T.logo,color:"#fff",border:"none",borderRadius:8,padding:"9px 15px",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0},
    gBtn:{display:"flex",alignItems:"center",gap:7,background:T.light,border:`1px solid ${T.border}`,color:T.primary,borderRadius:8,padding:"9px 15px",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0},
    save:{flex:2,background:T.logo,border:"none",borderRadius:7,color:"#fff",padding:"10px",fontWeight:700,cursor:"pointer",fontSize:14},
    canc:{flex:1,background:T.mid,border:"none",borderRadius:7,color:T.primary,padding:"10px",fontWeight:700,cursor:"pointer"},
    pay:{display:"flex",alignItems:"center",gap:4,background:T.mid,color:T.primary,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 9px",fontSize:12,cursor:"pointer",fontWeight:700},
    del:{display:"flex",alignItems:"center",gap:3,background:"#fef2f2",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11},
    th:{textAlign:"left",fontSize:10,fontWeight:700,color:T.primary,padding:"8px 10px",borderBottom:`1px solid ${T.border}`,textTransform:"uppercase"},
    td:{padding:"10px",fontSize:13,borderBottom:`1px solid ${T.mid}`,color:"#374151"},
    fc:{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:17,marginBottom:16},
    fg:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:12},
    mbox:{background:"#fff",border:`1px solid ${T.border}`,borderRadius:13,width:"100%",maxWidth:460},
    chip:(bg,tc)=>({background:bg||T.mid,color:tc||T.primary,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99}),
    pill:a=>({background:a?T.primary:T.light,color:a?"#fff":T.primary,border:`1px solid ${T.border}`,borderRadius:99,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:700}),
  };
  const Btn=({children,onClick,ghost})=><button onClick={onClick} style={ghost?S.gBtn:S.btn}>{children}</button>;
  const Del=({onClick})=><button onClick={onClick} style={S.del}>Del</button>;
  const Tag=({children,bg,tc})=><span style={S.chip(bg,tc)}>{children}</span>;
  const FL=({l,children})=><div><label style={S.lbl}>{l}</label>{children}</div>;
  const FG=({children})=><div style={S.fg}>{children}</div>;
  const FC=({title,children})=><div style={S.fc}><div style={{fontWeight:700,fontSize:11,color:T.primary,marginBottom:14,textTransform:"uppercase"}}>{title}</div>{children}</div>;
  const TH=({title,sub,sc,children})=><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}><div><div style={{fontWeight:800,fontSize:18,color:T.dark}}>{title}</div>{sub&&<div style={{fontSize:13,color:sc||"#374151",fontWeight:700}}>{sub}</div>}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div></div>;
  const KV=({l,v,c})=><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.mid}`,fontSize:13,color:"#374151"}}><span>{l}</span><strong style={{color:c||"#374151"}}>{v}</strong></div>;
  function Grid({cols,rows}){return<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cols.map(c=><th key={c} style={S.th}>{c}</th>)}</tr></thead><tbody>{rows.length===0?<tr><td colSpan={cols.length} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:32}}>No records yet</td></tr>:rows.map((row,i)=><tr key={i} style={{background:i%2===0?"transparent":T.light}}>{row.map((cell,j)=><td key={j} style={S.td}>{cell}</td>)}</tr>)}</tbody></table></div>;}
  function Modal({onClose,title,children}){return<div style={{position:"fixed",inset:0,background:"#00000060",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={onClose}><div style={S.mbox} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}><span style={{fontWeight:800,color:T.dark}}>{title}</span><button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18}}>x</button></div><div style={{padding:20,maxHeight:"70vh",overflowY:"auto"}}>{children}</div></div></div>;}

  return(
    <div style={{display:"flex",height:"100vh",background:T.light,color:T.dark,fontFamily:"sans-serif",overflow:"hidden"}}>
      <aside style={{width:220,background:"#fff",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"14px 13px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.logo,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:12,marginBottom:8}}>{church.logo}</div>
          <div style={{fontWeight:800,fontSize:11,color:T.dark}}>{church.name}</div>
          <div style={{fontSize:10,color:T.primary}}>Tracka Church</div>
        </div>
        {isPastor&&<div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
          <select style={{...S.inp,fontSize:12}} value={ab||""} onChange={e=>{setAb(e.target.value||null);setTab("dashboard");}}>
            <option value="">All Branches</option>
            {branches.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </div>}
        <nav style={{flex:1,padding:"8px 6px",overflowY:"auto"}}>
          {nav.map(n=><button key={n.id} onClick={()=>setTab(n.id)} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 10px",borderRadius:8,border:"none",background:tab===n.id?T.mid:"transparent",color:tab===n.id?T.primary:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:2}}>{n.label}</button>)}
        </nav>
        <div style={{padding:"10px",borderTop:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:6,color:dbOk?"#16a34a":"#ef4444"}}>{dbOk?"Live":"Offline"}</div>
          <div style={{fontSize:12,color:"#374151",marginBottom:6}}>{user?.role} - {user?.name?.split(" ")[0]}</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={loadAll} style={{...S.gBtn,padding:"6px 10px",fontSize:12}}>Refresh</button>
            <button onClick={onLogout} style={{...S.gBtn,padding:"6px 10px",fontSize:12,flex:1}}>Sign Out</button>
          </div>
        </div>
      </aside>
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:`1px solid ${T.border}`,background:"#fff"}}>
          <div><div style={{fontSize:17,fontWeight:800,color:T.dark}}>{tab==="dashboard"?"God bless you, "+user?.name?.split(" ")[0]:nav.find(n=>n.id===tab)?.label}</div><div style={{fontSize:11,color:T.primary}}>{church.name} - {isPastor?(ab||"All Branches"):user?.branch}</div></div>
          {loading&&<div style={{fontSize:11,color:T.primary}}>Loading...</div>}
        </div>
        <div style={{flex:1,overflow:"auto",padding:"16px 20px"}}>

          {tab==="dashboard"&&<div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:12,marginBottom:16}}>
              {[{label:"Total Offerings",value:fmt(totOf),color:"#16a34a"},{label:"Total Tithes",value:fmt(totTi),color:T.primary},{label:"Total Income",value:fmt(totIncome),color:"#0369a1"},{label:"Total Expenses",value:fmt(totEx),color:"#ef4444"},{label:"Net Balance",value:fmt(totIncome-totEx),color:totIncome-totEx>=0?"#16a34a":"#ef4444"},{label:"Members",value:fMb.length,color:T.primary}].map(k=><div key={k.label} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:16,borderLeft:`4px solid ${k.color}`}}><div style={{fontSize:12,color:"#374151",marginBottom:4}}>{k.label}</div><div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.value}</div></div>)}
            </div>
            {isPastor&&!ab&&<div style={{marginBottom:18}}>
              <div style={{fontWeight:800,fontSize:12,color:T.primary,marginBottom:12,textTransform:"uppercase"}}>Branch Snapshot</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                {branches.map(b=>{
                  const bO=offerings.filter(o=>o.branch===b).reduce((s,r)=>s+ +r.amount,0);
                  const bT=tithes.filter(t=>t.branch===b).reduce((s,r)=>s+ +r.amount,0);
                  const bE=expenses.filter(e=>e.branch===b).reduce((s,r)=>s+ +r.amount,0);
                  return<div key={b} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
                    <div style={{fontWeight:700,color:T.primary,marginBottom:10,fontSize:13}}>{b}</div>
                    <KV l="Offerings" v={fmt(bO)} c="#16a34a"/><KV l="Tithes" v={fmt(bT)} c={T.primary}/><KV l="Expenses" v={fmt(bE)} c="#ef4444"/><KV l="Balance" v={fmt(bO+bT-bE)} c={bO+bT-bE>=0?"#16a34a":"#ef4444"}/>
                  </div>;
                })}
              </div>
            </div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:14}}><div style={{fontWeight:700,color:"#16a34a",marginBottom:10,fontSize:11,textTransform:"uppercase"}}>Recent Offerings</div>{fOf.slice(0,5).map(o=><div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.mid}`,fontSize:13}}><span>{o.service_type}</span><strong style={{color:"#16a34a"}}>{fmt(o.amount)}</strong></div>)}{fOf.length===0&&<div style={{color:"#94a3b8",fontSize:13}}>None yet</div>}</div>
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:14}}><div style={{fontWeight:700,color:T.primary,marginBottom:10,fontSize:11,textTransform:"uppercase"}}>Recent Tithes</div>{fTi.slice(0,5).map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.mid}`,fontSize:13}}><span>{t.member_name||"Anonymous"}</span><strong style={{color:T.primary}}>{fmt(t.amount)}</strong></div>)}{fTi.length===0&&<div style={{color:"#94a3b8",fontSize:13}}>None yet</div>}</div>
            </div>
          </div>}

          {tab==="members"&&<MembersPage members={fMb} branches={myBranches} myBranch={myBranch} T={T} S={S} Btn={Btn} Del={Del} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} onAdd={doAddMember} onDelete={id=>ask("Remove member?",()=>doDel("member",id))} P={P}/>}
          {tab==="offerings"&&<OfferingsPage offerings={fOf} branches={myBranches} myBranch={myBranch} T={T} S={S} Btn={Btn} Del={Del} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} onAdd={doAddOffering} onDelete={id=>ask("Delete offering?",()=>doDel("offering",id))} P={P}/>}
          {tab==="tithes"&&<TithesPage tithes={fTi} members={members} branches={myBranches} myBranch={myBranch} T={T} S={S} Btn={Btn} Del={Del} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} onAdd={doAddTithe} onDelete={id=>ask("Delete tithe?",()=>doDel("tithe",id))} P={P}/>}
          {tab==="expenses"&&<ChurchExpensesPage expenses={fEx} branches={myBranches} myBranch={myBranch} T={T} S={S} Btn={Btn} Del={Del} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} onAdd={doAddExp} onDelete={id=>ask("Delete expense?",()=>doDel("expense",id))} P={P} showToast={t2}/>}
          {tab==="projects"&&<ProjectsPage projects={projects} T={T} S={S} Btn={Btn} Del={Del} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} Modal={Modal} onAdd={doAddProject} onUpdate={doUpdateProject} onDelete={id=>ask("Delete project?",()=>doDel("project",id))} P={P} showToast={t2}/>}
          {tab==="branches"&&<BranchesPage offerings={offerings} tithes={tithes} expenses={expenses} members={members} branches={branches} T={T} S={S} Btn={Btn} TH={TH} KV={KV} onAdd={n=>{if(!branches.includes(n)){setBranches(p=>[...p,n]);t2("Branch added");}}} onSwitch={b=>{setAb(b);setTab("dashboard");}} showToast={t2}/>}
          {tab==="reports"&&<ReportsPage offerings={fOf} tithes={fTi} expenses={fEx} members={fMb} projects={projects} branches={branches} church={church} ab={ab} isPastor={isPastor} myBranch={myBranch} T={T} S={S} Btn={Btn} Tag={Tag} TH={TH} Grid={Grid} KV={KV}/>}
          {tab==="users"&&isPastor&&<UsersPage users={users} branches={branches} T={T} S={S} Btn={Btn} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} Modal={Modal} onAdd={doAddUser} onToggle={id=>ask("Toggle?",()=>doToggle(id))} onPin={doPin} showToast={t2}/>}
        </div>
      </main>
      {toast&&<div style={{position:"fixed",bottom:18,right:18,color:"#fff",padding:"10px 16px",borderRadius:9,fontWeight:700,fontSize:13,zIndex:300,background:toast.type==="error"?"#dc2626":toast.type==="info"?"#2563eb":"#16a34a"}}>{toast.msg}</div>}
      {confirm&&<div style={{position:"fixed",inset:0,background:"#00000060",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>setConfirm(null)}><div style={{background:"#fff",borderRadius:13,padding:24,maxWidth:350,width:"90%"}} onClick={e=>e.stopPropagation()}><div style={{fontWeight:700,fontSize:15,marginBottom:18,color:T.dark}}>{confirm.msg}</div><div style={{display:"flex",gap:10}}><button style={S.canc} onClick={()=>setConfirm(null)}>Cancel</button><button style={{...S.save,background:"#dc2626"}} onClick={confirm.fn}>Yes Delete</button></div></div></div>}
    </div>
  );
}

function MembersPage({members,branches,myBranch,T,S,Btn,Del,Tag,FL,FG,FC,TH,Grid,onAdd,onDelete,P}){
  const[open,setOpen]=useState(false);
  const[form,setForm]=useState({name:"",phone:"",email:"",gender:"Male",dob:"",address:"",department:"",branch:myBranch||branches[0]||""});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const depts=["Choir","Ushering","Children Ministry","Youth","Prayer","Media","Welfare","Executive"];
  return<div>
    <TH title="Church Members" sub={members.length+" members"}><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Add Member"}</Btn></TH>
    {open&&<FC title="New Member"><FG>
      <FL l="Full Name *"><input style={S.inp} placeholder="Member full name" value={form.name} onChange={e=>F("name",e.target.value)}/></FL>
      <FL l="Phone"><input style={S.inp} placeholder="08012345678" value={form.phone} onChange={e=>F("phone",e.target.value)}/></FL>
      <FL l="Email"><input style={S.inp} placeholder="member@email.com" value={form.email} onChange={e=>F("email",e.target.value)}/></FL>
      <FL l="Gender"><select style={S.inp} value={form.gender} onChange={e=>F("gender",e.target.value)}>{["Male","Female"].map(g=><option key={g}>{g}</option>)}</select></FL>
      <FL l="Date of Birth"><input style={S.inp} type="date" value={form.dob} onChange={e=>F("dob",e.target.value)}/></FL>
      <FL l="Department"><select style={S.inp} value={form.department} onChange={e=>F("department",e.target.value)}><option value="">Select...</option>{depts.map(d=><option key={d}>{d}</option>)}</select></FL>
      <FL l="Branch"><select style={S.inp} value={form.branch} onChange={e=>F("branch",e.target.value)}>{branches.map(b=><option key={b}>{b}</option>)}</select></FL>
      <FL l="Address"><input style={S.inp} placeholder="Home address" value={form.address} onChange={e=>F("address",e.target.value)}/></FL>
    </FG><button style={{...S.save,marginTop:16}} onClick={()=>{if(!form.name){alert("Enter member name");return;}onAdd(form);setForm({name:"",phone:"",email:"",gender:"Male",dob:"",address:"",department:"",branch:myBranch||branches[0]||""});setOpen(false);}}>Add Member</button></FC>}
    <Grid cols={["Name","Phone","Gender","Department","Branch","Joined",...(P.del?["Del"]:[])]}
      rows={members.map(m=>[<strong style={{color:T.dark}}>{m.name}</strong>,m.phone||"-",<Tag>{m.gender}</Tag>,m.department||"-",<Tag bg={T.mid} tc={T.primary}>{m.branch}</Tag>,m.joined,...(P.del?[<Del onClick={()=>onDelete(m.id)}/>]:[])])}/>
  </div>;
}

function OfferingsPage({offerings,branches,myBranch,T,S,Btn,Del,Tag,FL,FG,FC,TH,Grid,onAdd,onDelete,P}){
  const[open,setOpen]=useState(false);
  const serviceTypes=["Sunday Service","Wednesday Service","Friday Service","Special Service","Harvest","Anniversary","Dedication","Other"];
  const offeringTypes=["General Offering","Special Offering","Building Fund","Mission","Welfare","Thanksgiving","Other"];
  const[form,setForm]=useState({date:tod(),service_type:"Sunday Service",offering_type:"General Offering",amount:"",branch:myBranch||branches[0]||"",notes:""});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const total=offerings.reduce((s,r)=>s+ +r.amount,0);
  return<div>
    <TH title="Offerings" sub={"Total: "+fmt(total)} sc="#16a34a"><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Record Offering"}</Btn></TH>
    {open&&<FC title="Record Offering"><FG>
      <FL l="Date *"><input style={S.inp} type="date" value={form.date} onChange={e=>F("date",e.target.value)}/></FL>
      <FL l="Service Type"><select style={S.inp} value={form.service_type} onChange={e=>F("service_type",e.target.value)}>{serviceTypes.map(s=><option key={s}>{s}</option>)}</select></FL>
      <FL l="Offering Type"><select style={S.inp} value={form.offering_type} onChange={e=>F("offering_type",e.target.value)}>{offeringTypes.map(o=><option key={o}>{o}</option>)}</select></FL>
      <FL l="Amount (N) *"><input style={S.inp} type="number" value={form.amount} onChange={e=>F("amount",e.target.value)}/></FL>
      <FL l="Branch"><select style={S.inp} value={form.branch} onChange={e=>F("branch",e.target.value)}>{branches.map(b=><option key={b}>{b}</option>)}</select></FL>
      <FL l="Notes"><input style={S.inp} placeholder="Optional notes" value={form.notes} onChange={e=>F("notes",e.target.value)}/></FL>
    </FG><button style={{...S.save,marginTop:16}} onClick={()=>{if(!form.amount){alert("Enter amount");return;}onAdd(form);setForm({date:tod(),service_type:"Sunday Service",offering_type:"General Offering",amount:"",branch:myBranch||branches[0]||"",notes:""});setOpen(false);}}>Save Offering</button></FC>}
    <Grid cols={["Date","Service","Type","Amount","Branch","Notes",...(P.del?["Del"]:[])]}
      rows={offerings.map(o=>[o.date,<Tag bg={T.mid} tc={T.primary}>{o.service_type}</Tag>,o.offering_type,<strong style={{color:"#16a34a"}}>{fmt(o.amount)}</strong>,<Tag>{o.branch}</Tag>,o.notes||"-",...(P.del?[<Del onClick={()=>onDelete(o.id)}/>]:[])])}/>
  </div>;
}

function TithesPage({tithes,members,branches,myBranch,T,S,Btn,Del,Tag,FL,FG,FC,TH,Grid,onAdd,onDelete,P}){
  const[open,setOpen]=useState(false);
  const[form,setForm]=useState({date:tod(),member_name:"",member_id:"",amount:"",branch:myBranch||branches[0]||"",period:""});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const total=tithes.reduce((s,r)=>s+ +r.amount,0);
  return<div>
    <TH title="Tithes" sub={"Total: "+fmt(total)} sc={T.primary}><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Record Tithe"}</Btn></TH>
    {open&&<FC title="Record Tithe"><FG>
      <FL l="Date *"><input style={S.inp} type="date" value={form.date} onChange={e=>F("date",e.target.value)}/></FL>
      <FL l="Member"><select style={S.inp} value={form.member_id} onChange={e=>{const m=members.find(x=>x.id===e.target.value);F("member_id",e.target.value);F("member_name",m?.name||"Anonymous");}}><option value="">Anonymous / Walk-in</option>{members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></FL>
      <FL l="Amount (N) *"><input style={S.inp} type="number" value={form.amount} onChange={e=>F("amount",e.target.value)}/></FL>
      <FL l="Period"><input style={S.inp} placeholder="e.g. January 2025" value={form.period} onChange={e=>F("period",e.target.value)}/></FL>
      <FL l="Branch"><select style={S.inp} value={form.branch} onChange={e=>F("branch",e.target.value)}>{branches.map(b=><option key={b}>{b}</option>)}</select></FL>
    </FG><button style={{...S.save,marginTop:16}} onClick={()=>{if(!form.amount){alert("Enter amount");return;}onAdd({...form,amount:+form.amount});setForm({date:tod(),member_name:"",member_id:"",amount:"",branch:myBranch||branches[0]||"",period:""});setOpen(false);}}>Save Tithe</button></FC>}
    <Grid cols={["Date","Member","Amount","Period","Branch",...(P.del?["Del"]:[])]}
      rows={tithes.map(t=>[t.date,<strong style={{color:T.dark}}>{t.member_name||"Anonymous"}</strong>,<strong style={{color:T.primary}}>{fmt(t.amount)}</strong>,t.period||"-",<Tag>{t.branch}</Tag>,...(P.del?[<Del onClick={()=>onDelete(t.id)}/>]:[])])}/>
  </div>;
}

function ChurchExpensesPage({expenses,branches,myBranch,T,S,Btn,Del,Tag,FL,FG,FC,TH,Grid,onAdd,onDelete,P,showToast}){
  const cats=["Staff Salary","Utilities","Rent","Maintenance","Generator/Fuel","Welfare","Stationery","Ministry","Outreach","Miscellaneous"];
  const[open,setOpen]=useState(false);
  const[form,setForm]=useState({date:tod(),desc:"",category:cats[0],amount:"",branch:myBranch||branches[0]||""});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const total=expenses.reduce((s,r)=>s+ +r.amount,0);
  return<div>
    <TH title="Expenses" sub={"Total: "+fmt(total)} sc="#ef4444"><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Add Expense"}</Btn></TH>
    {open&&<FC title="Record Expense"><FG>
      <FL l="Date"><input style={S.inp} type="date" value={form.date} onChange={e=>F("date",e.target.value)}/></FL>
      <FL l="Description *"><input style={S.inp} placeholder="e.g. Generator Diesel" value={form.desc} onChange={e=>F("desc",e.target.value)}/></FL>
      <FL l="Category *"><select style={S.inp} value={form.category} onChange={e=>F("category",e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></FL>
      <FL l="Amount (N) *"><input style={S.inp} type="number" value={form.amount} onChange={e=>F("amount",e.target.value)}/></FL>
      <FL l="Branch"><select style={S.inp} value={form.branch} onChange={e=>F("branch",e.target.value)}>{branches.map(b=><option key={b}>{b}</option>)}</select></FL>
    </FG><button style={{...S.save,marginTop:16}} onClick={()=>{if(!form.desc||!form.amount){showToast("Fill description and amount","error");return;}onAdd({...form,amount:+form.amount});setForm({date:tod(),desc:"",category:cats[0],amount:"",branch:myBranch||branches[0]||""});setOpen(false);}}>Save Expense</button></FC>}
    <Grid cols={["Date","Description","Category","Amount","Branch",...(P.del?["Del"]:[])]}
      rows={expenses.map(e=>[e.date,e.desc,<Tag bg="#fef2f2" tc="#ef4444">{e.category}</Tag>,<strong style={{color:"#ef4444"}}>{fmt(e.amount)}</strong>,<Tag>{e.branch}</Tag>,...(P.del?[<Del onClick={()=>onDelete(e.id)}/>]:[])])}/>
  </div>;
}

function ProjectsPage({projects,T,S,Btn,Del,Tag,FL,FG,FC,TH,Grid,Modal,onAdd,onUpdate,onDelete,P,showToast}){
  const[open,setOpen]=useState(false);const[modal,setModal]=useState(null);const[contribution,setContribution]=useState("");
  const[form,setForm]=useState({name:"",description:"",target:"",deadline:""});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  return<div>
    <TH title="Projects & Fundraising" sub={projects.length+" projects"}><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"New Project"}</Btn></TH>
    {open&&<FC title="New Project"><FG>
      <FL l="Project Name *"><input style={S.inp} placeholder="e.g. Building Renovation" value={form.name} onChange={e=>F("name",e.target.value)}/></FL>
      <FL l="Description"><input style={S.inp} placeholder="Brief description" value={form.description} onChange={e=>F("description",e.target.value)}/></FL>
      <FL l="Target Amount (N)"><input style={S.inp} type="number" value={form.target} onChange={e=>F("target",e.target.value)}/></FL>
      <FL l="Target Date"><input style={S.inp} type="date" value={form.deadline} onChange={e=>F("deadline",e.target.value)}/></FL>
    </FG><button style={{...S.save,marginTop:16}} onClick={()=>{if(!form.name){showToast("Enter project name","error");return;}onAdd({...form,target:+form.target||0});setForm({name:"",description:"",target:"",deadline:""});setOpen(false);}}>Create Project</button></FC>}
    {modal&&<Modal onClose={()=>setModal(null)} title={"Add Contribution - "+modal.name}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>{[["Target",fmt(modal.target),"#374151"],["Raised",fmt(modal.raised||0),"#16a34a"],["Remaining",fmt(+modal.target-+(modal.raised||0)),"#f59e0b"]].map(([l,v,c])=><div key={l} style={{background:T.light,borderRadius:8,padding:10,textAlign:"center"}}><div style={{fontSize:11,color:T.primary}}>{l}</div><div style={{fontWeight:800,color:c,fontSize:14}}>{v}</div></div>)}</div>
      <div style={{background:T.mid,borderRadius:8,height:8,marginBottom:16}}><div style={{background:T.primary,borderRadius:8,height:8,width:Math.min(100,Math.round((+(modal.raised||0)/+(modal.target||1))*100))+"%"}}/></div>
      <label style={S.lbl}>Add Contribution (N)</label>
      <input style={S.inp} type="number" value={contribution} onChange={e=>setContribution(e.target.value)} autoFocus/>
      <div style={{display:"flex",gap:10,marginTop:16}}><button style={S.canc} onClick={()=>setModal(null)}>Cancel</button><button style={S.save} onClick={()=>{const a=+contribution;if(!a||a<=0){showToast("Enter valid amount","error");return;}const nr=+(modal.raised||0)+a;const ns=nr>=+modal.target?"Completed":"Active";onUpdate(modal.id,{raised:nr,status:ns});setModal(null);setContribution("");}}>Add</button></div>
    </Modal>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
      {projects.map(pr=>{const pct=Math.min(100,Math.round((+(pr.raised||0)/+(pr.target||1))*100));return<div key={pr.id} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><div style={{fontWeight:800,color:T.dark,fontSize:14}}>{pr.name}</div><div style={{fontSize:12,color:"#374151"}}>{pr.description}</div></div><Tag bg={pr.status==="Completed"?T.mid:"#fef9c3"} tc={pr.status==="Completed"?T.primary:"#f59e0b"}>{pr.status}</Tag></div>
        <div style={{background:T.mid,borderRadius:8,height:8,marginBottom:8}}><div style={{background:T.primary,borderRadius:8,height:8,width:pct+"%"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:12}}><span>Raised: <strong style={{color:"#16a34a"}}>{fmt(pr.raised||0)}</strong></span><span>{pct}% of {fmt(pr.target)}</span></div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>{setModal(pr);setContribution("");}} style={{...S.btn,flex:1,justifyContent:"center"}}>+ Add Contribution</button>{P.del&&<Del onClick={()=>onDelete(pr.id)}/>}</div>
      </div>;})}
      {projects.length===0&&<div style={{color:"#94a3b8",padding:32}}>No projects yet</div>}
    </div>
  </div>;
}

function BranchesPage({offerings,tithes,expenses,members,branches,T,S,Btn,TH,KV,onAdd,onSwitch,showToast}){
  const[nb,setNb]=useState("");
  return<div>
    <TH title="Church Branches"><div style={{display:"flex",gap:8}}><input style={{...S.inp,width:200}} placeholder="New branch name..." value={nb} onChange={e=>setNb(e.target.value)}/><Btn onClick={()=>{if(!nb.trim()){showToast("Enter branch name","error");return;}onAdd(nb.trim());setNb("");}}>+ Add Branch</Btn></div></TH>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
      {branches.map(b=>{
        const bO=offerings.filter(o=>o.branch===b).reduce((s,r)=>s+ +r.amount,0);
        const bT=tithes.filter(t=>t.branch===b).reduce((s,r)=>s+ +r.amount,0);
        const bE=expenses.filter(e=>e.branch===b).reduce((s,r)=>s+ +r.amount,0);
        const bM=members.filter(m=>m.branch===b).length;
        return<div key={b} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontWeight:800,fontSize:14,color:T.primary}}>{b}</span><button onClick={()=>onSwitch(b)} style={{background:T.mid,color:T.primary,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 9px",fontSize:12,cursor:"pointer",fontWeight:700}}>View</button></div>
          <KV l="Members" v={bM} c={T.primary}/><KV l="Offerings" v={fmt(bO)} c="#16a34a"/><KV l="Tithes" v={fmt(bT)} c={T.primary}/><KV l="Total Income" v={fmt(bO+bT)} c="#0369a1"/><KV l="Expenses" v={fmt(bE)} c="#ef4444"/><KV l="Balance" v={fmt(bO+bT-bE)} c={bO+bT-bE>=0?"#16a34a":"#ef4444"}/>
        </div>;
      })}
    </div>
  </div>;
}

function ReportsPage({offerings,tithes,expenses,members,projects,branches,church,ab,isPastor,myBranch,T,S,Btn,Tag,TH,Grid,KV}){
  const[period,setPeriod]=useState("month");
  const[branch,setBranch]=useState(isPastor?(ab||"all"):(myBranch||"all"));
  const now=new Date();
  const inPeriod=d=>{
    const dt=new Date(d);
    if(period==="today")return dt.toDateString()===now.toDateString();
    if(period==="week"){const w=new Date(now);w.setDate(now.getDate()-7);return dt>=w;}
    if(period==="month")return dt.getMonth()===now.getMonth()&&dt.getFullYear()===now.getFullYear();
    if(period==="year")return dt.getFullYear()===now.getFullYear();
    return true;
  };
  const fBr=arr=>branch==="all"?arr:arr.filter(r=>r.branch===branch);
  const fO=fBr(offerings).filter(r=>inPeriod(r.date));
  const fT=fBr(tithes).filter(r=>inPeriod(r.date));
  const fE=fBr(expenses).filter(r=>inPeriod(r.date));
  const totO=fO.reduce((s,r)=>s+ +r.amount,0);
  const totT=fT.reduce((s,r)=>s+ +r.amount,0);
  const totE=fE.reduce((s,r)=>s+ +r.amount,0);
  const totIncome=totO+totT;
  const ps=a=>({background:a?T.primary:T.light,color:a?"#fff":T.primary,border:`1px solid ${T.border}`,borderRadius:99,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:700});
  const pLabel=period==="today"?"Today":period==="week"?"This Week":period==="month"?"This Month":period==="year"?"This Year":"All Time";
  return<div>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
      <div><div style={{fontWeight:800,fontSize:18,color:T.dark}}>Reports</div><div style={{fontSize:13,color:"#374151",fontWeight:700}}>{pLabel} - {branch==="all"?"All Branches":branch}</div></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:12,color:"#374151",fontWeight:700}}>Period:</span>
      {[["today","Today"],["week","This Week"],["month","This Month"],["year","This Year"],["all","All Time"]].map(([v,l])=><button key={v} onClick={()=>setPeriod(v)} style={ps(period===v)}>{l}</button>)}
    </div>
    {isPastor&&<div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:12,color:"#374151",fontWeight:700}}>Branch:</span>
      <select style={{...S.inp,width:"auto",padding:"6px 10px"}} value={branch} onChange={e=>setBranch(e.target.value)}>
        <option value="all">All Branches</option>{branches.map(b=><option key={b} value={b}>{b}</option>)}
      </select>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:18}}>
      {[{label:"Offerings",value:fmt(totO),color:"#16a34a"},{label:"Tithes",value:fmt(totT),color:T.primary},{label:"Total Income",value:fmt(totIncome),color:"#0369a1"},{label:"Expenses",value:fmt(totE),color:"#ef4444"},{label:"Balance",value:fmt(totIncome-totE),color:totIncome-totE>=0?"#16a34a":"#ef4444"},{label:"Members",value:members.length,color:T.primary}].map(k=><div key={k.label} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:16,borderLeft:`4px solid ${k.color}`}}><div style={{fontSize:11,color:"#374151",marginBottom:4}}>{k.label}</div><div style={{fontSize:18,fontWeight:800,color:k.color}}>{k.value}</div></div>)}
    </div>
    {isPastor&&branch==="all"&&branches.length>1&&<div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:16}}><div style={{fontWeight:800,color:T.primary,fontSize:13,marginBottom:12,textTransform:"uppercase"}}>Branch Performance</div><Grid cols={["Branch","Offerings","Tithes","Income","Expenses","Balance"]} rows={branches.map(b=>{const bO=offerings.filter(o=>o.branch===b&&inPeriod(o.date)).reduce((s,r)=>s+ +r.amount,0);const bT=tithes.filter(t=>t.branch===b&&inPeriod(t.date)).reduce((s,r)=>s+ +r.amount,0);const bE=expenses.filter(e=>e.branch===b&&inPeriod(e.date)).reduce((s,r)=>s+ +r.amount,0);return[<strong>{b}</strong>,<span style={{color:"#16a34a"}}>{fmt(bO)}</span>,<span style={{color:T.primary}}>{fmt(bT)}</span>,<strong style={{color:"#0369a1"}}>{fmt(bO+bT)}</strong>,<span style={{color:"#ef4444"}}>{fmt(bE)}</span>,<strong style={{color:bO+bT-bE>=0?"#16a34a":"#ef4444"}}>{fmt(bO+bT-bE)}</strong>];})}/></div>}
  </div>;
}

function UsersPage({users,branches,T,S,Btn,Tag,FL,FG,FC,TH,Grid,Modal,onAdd,onToggle,onPin,showToast}){
  const[open,setOpen]=useState(false);const[pm,setPm]=useState(null);const[np,setNp]=useState("");
  const[form,setForm]=useState({name:"",email:"",pin:"",role:"worker",branch:branches[0]||""});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const RC={pastor:"#ea580c",treasurer:"#16a34a",secretary:"#0369a1",worker:"#7c3aed"};
  return<div>
    <TH title="Users & Access Control"><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Add User"}</Btn></TH>
    {open&&<FC title="Add New User"><FG>
      <FL l="Full Name *"><input style={S.inp} value={form.name} onChange={e=>F("name",e.target.value)} placeholder="e.g. Bro Emeka"/></FL>
      <FL l="Email *"><input style={S.inp} value={form.email} onChange={e=>F("email",e.target.value)} placeholder="emeka@church.ng"/></FL>
      <FL l="PIN (4-8 digits) *"><input style={S.inp} maxLength={8} value={form.pin} onChange={e=>F("pin",e.target.value)} placeholder="e.g. 1234"/></FL>
      <FL l="Role"><select style={S.inp} value={form.role} onChange={e=>F("role",e.target.value)}>{["worker","secretary","treasurer"].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}</select></FL>
      <FL l="Branch"><select style={S.inp} value={form.branch} onChange={e=>F("branch",e.target.value)}>{branches.map(b=><option key={b}>{b}</option>)}</select></FL>
    </FG><button style={{...S.save,marginTop:14}} onClick={()=>{if(!form.name||!form.email||!form.pin){showToast("Fill all fields","error");return;}onAdd(form);setForm({name:"",email:"",pin:"",role:"worker",branch:branches[0]||""});setOpen(false);}}>Create User</button></FC>}
    {pm&&<Modal onClose={()=>setPm(null)} title={"Change PIN - "+pm.name}>
      <label style={S.lbl}>New PIN (4-8 digits)</label>
      <input style={S.inp} maxLength={8} value={np} onChange={e=>setNp(e.target.value)} autoFocus/>
      <div style={{display:"flex",gap:10,marginTop:16}}><button style={S.canc} onClick={()=>setPm(null)}>Cancel</button><button style={S.save} onClick={()=>{if(!np||np.length<4){showToast("PIN must be 4+ digits","error");return;}onPin(pm.id,np);setPm(null);setNp("");}}>Update PIN</button></div>
    </Modal>}
    <Grid cols={["Name","Email","Role","Branch","PIN","Status","Actions"]}
      rows={users.map(u=>[<strong style={{color:u.active?T.dark:"#94a3b8"}}>{u.name}</strong>,<span style={{fontSize:12}}>{u.email}</span>,<Tag bg={RC[u.role]+"20"} tc={RC[u.role]}>{u.role}</Tag>,u.branch?<Tag>{u.branch}</Tag>:<span style={{color:T.primary,fontSize:12}}>All Branches</span>,<code style={{background:T.mid,padding:"2px 8px",borderRadius:4,color:T.primary,fontSize:12}}>{u.pin}</code>,<Tag bg={u.active?T.mid:"#fef2f2"} tc={u.active?T.primary:"#ef4444"}>{u.active?"Active":"Disabled"}</Tag>,<div style={{display:"flex",gap:6}}>{u.role!=="pastor"&&<button onClick={()=>onToggle(u.id)} style={{background:u.active?"#fef2f2":T.mid,color:u.active?"#ef4444":T.primary,border:`1px solid ${u.active?"#fca5a5":T.border}`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11}}>{u.active?"Disable":"Enable"}</button>}<button onClick={()=>{setPm(u);setNp("");}} style={{background:T.mid,color:T.primary,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 9px",fontSize:12,cursor:"pointer",fontWeight:700}}>PIN</button></div>])}/>
  </div>;
  }
