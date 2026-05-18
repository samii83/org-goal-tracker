import { useState, useMemo } from "react";

const C = {
  primary:"#1a56db", success:"#059669", warning:"#d97706",
  danger:"#dc2626",  purple:"#7c3aed", teal:"#0d9488",
  bg:"#f8fafc", border:"#e2e8f0", text:"#0f172a", muted:"#64748b",
};

const THRUST_AREAS = ["Revenue Growth","Customer Success","Operational Excellence","Innovation","People & Culture","Cost Optimization"];
const UOM_TYPES    = ["Numeric (Higher is Better)","Numeric (Lower is Better)","Timeline","Zero-based"];
const QUARTERS     = ["Q1 (July)","Q2 (October)","Q3 (January)","Q4/Annual (March)"];
const STATUSES     = ["Not Started","On Track","Completed"];

const INIT_USERS = [
  { id:1, name:"Priya Sharma",  email:"priya@atomberg.com",  role:"employee", managerId:2, dept:"Sales" },
  { id:2, name:"Rajesh Kumar",  email:"rajesh@atomberg.com", role:"manager",  managerId:3, dept:"Sales" },
  { id:3, name:"Admin HR",      email:"admin@atomberg.com",  role:"admin",    managerId:null, dept:"HR" },
  { id:4, name:"Anita Singh",   email:"anita@atomberg.com",  role:"employee", managerId:2, dept:"Sales" },
  { id:5, name:"Vikram Nair",   email:"vikram@atomberg.com", role:"employee", managerId:2, dept:"Operations" },
];

const INIT_GOALS = [
  { id:1,  employeeId:1, thrustArea:"Revenue Growth",        title:"Achieve Sales Target",   description:"Hit Rs 50L quarterly sales revenue",     uom:"Numeric (Higher is Better)", target:5000000,   weightage:40, status:"approved", locked:true,  isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-01", achievements:{"Q1 (July)":{actual:3200000,status:"On Track",updatedAt:"2026-07-10"}}, checkins:{"Q1 (July)":{comment:"Good momentum, keep pushing!",managerName:"Rajesh Kumar",date:"2026-07-12"}} },
  { id:2,  employeeId:1, thrustArea:"Customer Success",      title:"Improve CSAT Score",     description:"Customer satisfaction above 4.5/5",      uom:"Numeric (Higher is Better)", target:4.5,       weightage:30, status:"approved", locked:true,  isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-01", achievements:{}, checkins:{} },
  { id:3,  employeeId:1, thrustArea:"Operational Excellence",title:"Reduce TAT",             description:"Turnaround time below 2 days",           uom:"Numeric (Lower is Better)",  target:2,         weightage:20, status:"approved", locked:true,  isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-01", achievements:{}, checkins:{} },
  { id:4,  employeeId:1, thrustArea:"People & Culture",      title:"Training Completion",    description:"Finish all mandatory training by Sep",   uom:"Timeline",                   target:"2026-09-30", weightage:10, status:"approved", locked:true, isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-01", achievements:{}, checkins:{} },
  { id:5,  employeeId:4, thrustArea:"Revenue Growth",        title:"Lead Generation",        description:"100 qualified leads per quarter",        uom:"Numeric (Higher is Better)", target:100,       weightage:60, status:"pending", locked:false, isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-02", achievements:{}, checkins:{} },
  { id:6,  employeeId:4, thrustArea:"Cost Optimization",     title:"Reduce Travel Expenses", description:"Keep travel under Rs 50K budget",        uom:"Numeric (Lower is Better)",  target:50000,     weightage:40, status:"pending", locked:false, isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-02", achievements:{}, checkins:{} },
  { id:7,  employeeId:5, thrustArea:"Operational Excellence",title:"Process Efficiency",     description:"Reduce process time by 20%",             uom:"Numeric (Higher is Better)", target:20,        weightage:50, status:"approved", locked:true,  isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-01", achievements:{"Q1 (July)":{actual:14,status:"On Track",updatedAt:"2026-07-08"}}, checkins:{} },
  { id:8,  employeeId:5, thrustArea:"Cost Optimization",     title:"Safety Incidents Zero",  description:"Zero safety incidents in plant",         uom:"Zero-based",                 target:0,         weightage:30, status:"approved", locked:true,  isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-01", achievements:{"Q1 (July)":{actual:0,status:"Completed",updatedAt:"2026-07-08"}}, checkins:{} },
  { id:9,  employeeId:5, thrustArea:"People & Culture",      title:"Team Training Hours",    description:"Complete 40 hrs of team training",       uom:"Numeric (Higher is Better)", target:40,        weightage:20, status:"approved", locked:true,  isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:"2026-05-01", achievements:{}, checkins:{} },
  { id:10, employeeId:1, thrustArea:"Revenue Growth",        title:"Q2 Sales Blitz KPI",     description:"Dept-wide Q2 sales push target",         uom:"Numeric (Higher is Better)", target:8000000,   weightage:0,  status:"approved", locked:true,  isShared:true,  sharedGroupId:"sg1", primaryOwnerId:1, createdAt:"2026-05-05", achievements:{}, checkins:{} },
  { id:11, employeeId:4, thrustArea:"Revenue Growth",        title:"Q2 Sales Blitz KPI",     description:"Dept-wide Q2 sales push target",         uom:"Numeric (Higher is Better)", target:8000000,   weightage:0,  status:"approved", locked:true,  isShared:true,  sharedGroupId:"sg1", primaryOwnerId:1, createdAt:"2026-05-05", achievements:{}, checkins:{} },
];

const INIT_AUDIT = [
  { id:1, action:"Goal approved",      user:"Rajesh Kumar", goalTitle:"Achieve Sales Target", timestamp:"2026-05-03 10:23", details:"Approved and locked" },
  { id:2, action:"Achievement logged", user:"Priya Sharma", goalTitle:"Achieve Sales Target", timestamp:"2026-07-10 14:05", details:"Q1 actual: 3,200,000" },
  { id:3, action:"Goal approved",      user:"Rajesh Kumar", goalTitle:"Process Efficiency",   timestamp:"2026-05-04 09:10", details:"Approved and locked" },
  { id:4, action:"Shared goal pushed", user:"Admin HR",     goalTitle:"Q2 Sales Blitz KPI",   timestamp:"2026-05-05 11:00", details:"Pushed to 2 Sales employees" },
];

const INIT_ESC = [
  { id:1, type:"Goal not submitted",   employeeId:5, employeeName:"Vikram Nair", managerId:2, managerName:"Rajesh Kumar", triggeredAt:"2026-05-08", status:"resolved", resolvedAt:"2026-05-09", note:"Goals submitted after reminder" },
  { id:2, type:"Check-in overdue",     employeeId:5, employeeName:"Vikram Nair", managerId:2, managerName:"Rajesh Kumar", triggeredAt:"2026-07-18", status:"open",     resolvedAt:null,          note:"" },
];

function computeScore(goal, quarter) {
  const ach = goal.achievements[quarter];
  if (!ach || ach.actual === undefined || ach.actual === null || ach.actual === "") return null;
  if (goal.uom === "Zero-based") return parseFloat(ach.actual) === 0 ? 100 : 0;
  if (goal.uom === "Timeline") {
    if (!ach.actual) return null;
    const deadline = new Date(goal.target), done = new Date(ach.actual);
    return done <= deadline ? 100 : Math.max(0, Math.round(100 - ((done - deadline) / 86400000 / 7) * 10));
  }
  const actual = parseFloat(ach.actual), target = parseFloat(goal.target);
  if (isNaN(actual) || isNaN(target) || target === 0) return null;
  if (goal.uom === "Numeric (Higher is Better)") return Math.min(Math.round((actual / target) * 100), 100);
  if (goal.uom === "Numeric (Lower is Better)") return Math.min(Math.round((target / actual) * 100), 100);
  return null;
}

function fmt(n) {
  if (typeof n === "number" && n >= 1000) return n.toLocaleString("en-IN");
  return n;
}

function nowTs() {
  return new Date().toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

// --- UI Atoms ---
const BD = {
  green:{bg:"#dcfce7",tx:"#166534"}, yellow:{bg:"#fef9c3",tx:"#854d0e"},
  red:  {bg:"#fee2e2",tx:"#991b1b"}, blue:  {bg:"#dbeafe",tx:"#1e40af"},
  gray: {bg:"#f1f5f9",tx:"#475569"}, purple:{bg:"#ede9fe",tx:"#5b21b6"},
  teal: {bg:"#ccfbf1",tx:"#0f766e"},
};
function Badge({ color="gray", children }) {
  const c = BD[color]||BD.gray;
  return <span style={{ background:c.bg, color:c.tx, fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:999 }}>{children}</span>;
}
function SBadge(s) {
  const map={approved:["green","Approved"],pending:["yellow","Pending"],rejected:["red","Returned"],draft:["gray","Draft"]};
  const [col,lbl]=map[s]||["gray",s];
  return <Badge color={col}>{lbl}</Badge>;
}
function PBar({ value }) {
  const p=Math.min(100,Math.max(0,Math.round(value)));
  return (
    <div style={{ background:"#e2e8f0", borderRadius:999, height:7, overflow:"hidden" }}>
      <div style={{ width:`${p}%`, background:p>=80?C.success:p>=50?C.warning:C.danger, height:"100%", borderRadius:999 }} />
    </div>
  );
}
function Card({ children, style:xs }) {
  return <div style={{ background:"#fff", borderRadius:12, padding:"16px 20px", border:`1px solid ${C.border}`, ...xs }}>{children}</div>;
}
function Alert({ type="info", children }) {
  const m={warning:{bg:"#fef3c7",bd:"#f59e0b",tx:"#92400e"},danger:{bg:"#fee2e2",bd:"#f87171",tx:"#991b1b"},info:{bg:"#eff6ff",bd:"#93c5fd",tx:"#1e40af"},success:{bg:"#f0fdf4",bd:"#86efac",tx:"#166534"}};
  const x=m[type]||m.info;
  return <div style={{ background:x.bg, border:`1px solid ${x.bd}`, borderRadius:10, padding:"10px 16px", fontSize:13, color:x.tx, marginBottom:14 }}>{children}</div>;
}
function StatCard({ label, value, color }) {
  return (
    <Card>
      <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:0.4 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:900, color:color||C.text }}>{value}</div>
    </Card>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:580, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:C.text }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:C.muted }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function FL({ label, children }) {
  return (
    <div style={{ marginBottom:13 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.muted, marginBottom:5, textTransform:"uppercase", letterSpacing:0.4 }}>{label}</label>
      {children}
    </div>
  );
}
const IS = { width:"100%", padding:"9px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:14, color:C.text, outline:"none", boxSizing:"border-box", background:"#fff" };
function FI({ label, ...p }) { return <FL label={label}><input style={IS} {...p} /></FL>; }
function FS({ label, options, ...p }) {
  return <FL label={label}><select style={{...IS,appearance:"auto"}} {...p}><option value="">Select...</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></FL>;
}
function FT({ label, ...p }) { return <FL label={label}><textarea style={{...IS,minHeight:68,resize:"vertical"}} {...p} /></FL>; }
function Btn({ children, onClick, v="primary", sm, style:xs, disabled }) {
  const vs={primary:{background:C.primary,color:"#fff",border:"none"},success:{background:C.success,color:"#fff",border:"none"},danger:{background:C.danger,color:"#fff",border:"none"},outline:{background:"#fff",color:C.text,border:`1.5px solid ${C.border}`},ghost:{background:"transparent",color:C.muted,border:"none"},teal:{background:C.teal,color:"#fff",border:"none"}};
  return <button disabled={disabled} onClick={onClick} style={{...vs[v],padding:sm?"5px 12px":"9px 18px",borderRadius:8,fontWeight:700,fontSize:sm?12:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,...xs}}>{children}</button>;
}
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:"flex", gap:4, background:"#f1f5f9", borderRadius:10, padding:4, marginBottom:20, flexWrap:"wrap" }}>
      {tabs.map(([k,lb])=>(
        <button key={k} onClick={()=>onChange(k)} style={{ padding:"7px 16px", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", background:active===k?C.primary:"transparent", color:active===k?"#fff":C.muted, border:"none" }}>
          {lb}
        </button>
      ))}
    </div>
  );
}

// --- Goal Form Modal ---
function GoalFormModal({ title, initial={}, onClose, onSave, isShared }) {
  const [f, setF] = useState({ thrustArea:"", title:"", description:"", uom:"", target:"", weightage:"", ...initial });
  const u = (k,v) => setF(p=>({...p,[k]:v}));
  const save = () => {
    if (!f.thrustArea||!f.title||!f.uom||!f.target||!f.weightage) return alert("Please fill all required fields.");
    if (parseFloat(f.weightage)<10) return alert("Minimum weightage per goal is 10%.");
    onSave({ ...f, weightage:parseFloat(f.weightage), target:f.uom==="Timeline"?f.target:(parseFloat(f.target)||f.target) });
    onClose();
  };
  return (
    <Modal title={title} onClose={onClose}>
      {isShared && <Alert type="info">This is a shared KPI. Only weightage can be changed.</Alert>}
      <FS label="Thrust Area *"           options={THRUST_AREAS} value={f.thrustArea} onChange={e=>u("thrustArea",e.target.value)} disabled={isShared} />
      <FI label="Goal Title *"            value={f.title}        onChange={e=>u("title",e.target.value)} readOnly={isShared} placeholder="e.g. Achieve Sales Target" />
      <FT label="Description"             value={f.description}  onChange={e=>u("description",e.target.value)} readOnly={isShared} />
      <FS label="Unit of Measurement *"   options={UOM_TYPES}    value={f.uom} onChange={e=>u("uom",e.target.value)} disabled={isShared} />
      <FI label={f.uom==="Timeline"?"Target Date *":"Target Value *"} type={f.uom==="Timeline"?"date":"number"} value={f.target} onChange={e=>u("target",e.target.value)} readOnly={isShared} />
      <FI label="Weightage (%) *" type="number" min="10" max="100" value={f.weightage} onChange={e=>u("weightage",e.target.value)} />
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
        <Btn v="outline" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>Save</Btn>
      </div>
    </Modal>
  );
}

// --- Achievement Modal ---
function AchModal({ goal, onClose, onSave }) {
  const [q,setQ]       = useState("Q1 (July)");
  const [actual,setA]  = useState(goal.achievements["Q1 (July)"]?.actual ?? "");
  const [status,setSt] = useState(goal.achievements["Q1 (July)"]?.status ?? "On Track");
  const chgQ = (nq) => { setQ(nq); setA(goal.achievements[nq]?.actual??""); setSt(goal.achievements[nq]?.status??"On Track"); };
  const score = computeScore({...goal, achievements:{[q]:{actual}}}, q);
  const save = () => {
    if (actual==="") return alert("Enter achievement value.");
    onSave(goal.id, q, { actual:goal.uom==="Timeline"?actual:parseFloat(actual), status, updatedAt:new Date().toISOString().split("T")[0] });
    onClose();
  };
  return (
    <Modal title={"Log Achievement - "+goal.title} onClose={onClose}>
      <Alert type="info"><strong>Target:</strong> {fmt(goal.target)} &nbsp;|&nbsp; <strong>UoM:</strong> {goal.uom}</Alert>
      <FS label="Quarter" options={QUARTERS} value={q} onChange={e=>chgQ(e.target.value)} />
      <FI label={goal.uom==="Timeline"?"Completion Date":"Actual Achievement"} type={goal.uom==="Timeline"?"date":"number"} value={actual} onChange={e=>setA(e.target.value)} />
      <FL label="Status">
        <div style={{ display:"flex", gap:14 }}>
          {STATUSES.map(s=>(
            <label key={s} style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer", fontSize:14 }}>
              <input type="radio" value={s} checked={status===s} onChange={()=>setSt(s)} /> {s}
            </label>
          ))}
        </div>
      </FL>
      {score!==null && (
        <div style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:13 }}>
            <span style={{ color:C.muted }}>Computed progress score</span>
            <strong style={{ color:score>=80?C.success:score>=50?C.warning:C.danger }}>{score}%</strong>
          </div>
          <PBar value={score} />
        </div>
      )}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <Btn v="outline" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>Save Achievement</Btn>
      </div>
    </Modal>
  );
}

// ============ EMPLOYEE ============
function EmployeeDash({ cu, goals, setGoals, setAudit }) {
  const [showCreate, setCreate] = useState(false);
  const [editGoal,   setEdit]   = useState(null);
  const [achGoal,    setAch]    = useState(null);
  const [tab,        setTab]    = useState("goals");

  const myGoals = goals.filter(g=>g.employeeId===cu.id);
  const active  = myGoals.filter(g=>g.status!=="rejected");
  const totalW  = active.reduce((s,g)=>s+g.weightage,0);
  const approved= myGoals.filter(g=>g.status==="approved");
  const pending = myGoals.filter(g=>g.status==="pending");
  const drafts  = myGoals.filter(g=>g.status==="draft");

  const addGoal = (data) => {
    if (active.length>=8) return alert("Maximum 8 goals allowed.");
    const g = { id:Date.now(), employeeId:cu.id, ...data, status:"draft", locked:false, isShared:false, sharedGroupId:null, primaryOwnerId:null, createdAt:new Date().toISOString().split("T")[0], achievements:{}, checkins:{} };
    setGoals(p=>[...p,g]);
    setAudit(p=>[{id:Date.now(),action:"Goal created",user:cu.name,goalTitle:data.title,timestamp:nowTs(),details:"Draft created"},...p]);
  };
  const updateGoal = (data) => {
    setGoals(p=>p.map(g=>g.id===editGoal.id?{...g,...data}:g));
    setAudit(p=>[{id:Date.now(),action:"Goal edited",user:cu.name,goalTitle:data.title,timestamp:nowTs(),details:"Pre-submission edit"},...p]);
    setEdit(null);
  };
  const deleteGoal = (g) => {
    if (!window.confirm('Delete "'+g.title+'"?')) return;
    setGoals(p=>p.filter(x=>x.id!==g.id));
  };
  const submitAll = () => {
    if (totalW!==100) return alert("Total weightage must equal 100%. Currently: "+totalW+"%");
    if (drafts.length===0) return alert("No draft goals to submit.");
    setGoals(p=>p.map(g=>g.employeeId===cu.id&&g.status==="draft"?{...g,status:"pending"}:g));
    setAudit(p=>[{id:Date.now(),action:"Goals submitted for approval",user:cu.name,goalTitle:"(All drafts)",timestamp:nowTs(),details:drafts.length+" goals submitted"},...p]);
  };
  const saveAch = (goalId, quarter, achData) => {
    const g=goals.find(x=>x.id===goalId);
    setGoals(p=>p.map(x=>{
      if (x.id===goalId) return {...x,achievements:{...x.achievements,[quarter]:achData}};
      if (g&&g.isShared&&g.sharedGroupId&&x.sharedGroupId===g.sharedGroupId&&g.primaryOwnerId===cu.id)
        return {...x,achievements:{...x.achievements,[quarter]:achData}};
      return x;
    }));
    setAudit(p=>[{id:Date.now(),action:"Achievement logged",user:cu.name,goalTitle:g?.title,timestamp:nowTs(),details:quarter+": actual="+achData.actual},...p]);
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="Total Goals"      value={active.length}   color={C.primary} />
        <StatCard label="Approved"         value={approved.length} color={C.success} />
        <StatCard label="Pending Approval" value={pending.length}  color={C.warning} />
        <StatCard label="Total Weightage"  value={totalW+"%"}      color={totalW===100?C.success:C.danger} />
      </div>
      {totalW!==100 && active.length>0 && <Alert type="warning">Total weightage is {totalW}%. Must equal exactly 100% before you can submit.</Alert>}

      <Tabs tabs={[["goals","My Goals"],["achievements","Log Achievements"]]} active={tab} onChange={setTab} />

      {tab==="goals" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Goal Sheet <span style={{ color:C.muted, fontWeight:400, fontSize:13 }}>({active.length}/8)</span></span>
            <div style={{ display:"flex", gap:8 }}>
              {drafts.length>0 && <Btn v="success" sm onClick={submitAll}>Submit {drafts.length} Draft(s) for Approval</Btn>}
              {active.length<8 && <Btn sm onClick={()=>setCreate(true)}>+ Add Goal</Btn>}
            </div>
          </div>
          {myGoals.length===0
            ? <div style={{ textAlign:"center", padding:"48px 0", color:C.muted }}><div style={{ fontSize:40, marginBottom:12 }}>🎯</div>No goals yet. Click "+ Add Goal" to get started.</div>
            : myGoals.map(goal=>{
              const scores=QUARTERS.map(q=>({q,s:computeScore(goal,q)})).filter(x=>x.s!==null);
              return (
                <Card key={goal.id} style={{ marginBottom:12, borderLeft:`4px solid ${goal.status==="approved"?C.success:goal.status==="pending"?C.warning:goal.status==="rejected"?C.danger:"#94a3b8"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1, marginRight:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:800, fontSize:15 }}>{goal.title}</span>
                        {SBadge(goal.status)}
                        {goal.locked && <Badge color="gray">Locked</Badge>}
                        {goal.isShared && <Badge color="teal">Shared KPI</Badge>}
                      </div>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:3 }}>{goal.thrustArea} | {goal.uom} | Target: <strong>{fmt(goal.target)}</strong></div>
                      <div style={{ fontSize:13, color:C.muted }}>{goal.description}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                      {goal.isShared
                        ? <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
                            <span style={{ color:C.muted }}>Weight:</span>
                            <input type="number" min="0" max="100" value={goal.weightage}
                              onChange={e=>setGoals(p=>p.map(g=>g.id===goal.id?{...g,weightage:parseFloat(e.target.value)||0}:g))}
                              style={{ width:54, padding:"4px 8px", border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:13 }} />%
                          </div>
                        : <span style={{ fontWeight:800, fontSize:14, color:C.primary }}>{goal.weightage}%</span>
                      }
                      {!goal.locked && goal.status==="draft" && <>
                        <Btn v="outline" sm onClick={()=>setEdit(goal)}>Edit</Btn>
                        <Btn v="danger"  sm onClick={()=>deleteGoal(goal)}>Delete</Btn>
                      </>}
                    </div>
                  </div>
                  {scores.length>0 && (
                    <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                      {scores.map(({q,s})=>(
                        <div key={q} style={{ flex:1, minWidth:140, background:"#f8fafc", borderRadius:8, padding:"8px 12px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                            <span style={{ color:C.muted }}>{q}</span>
                            <strong style={{ color:s>=80?C.success:s>=50?C.warning:C.danger }}>{s}%</strong>
                          </div>
                          <PBar value={s} />
                          {goal.checkins[q] && <div style={{ marginTop:5, fontSize:11, color:"#1e40af", borderLeft:"2px solid #93c5fd", paddingLeft:6 }}>Manager: {goal.checkins[q].comment}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          }
        </>
      )}

      {tab==="achievements" && (
        <>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Log Quarterly Achievements</div>
          {approved.length===0
            ? <Alert type="info">No approved goals yet. Goals must be approved by your manager first.</Alert>
            : approved.map(goal=>(
              <Card key={goal.id} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{goal.title}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{goal.thrustArea} | {goal.uom} | Target: {fmt(goal.target)}</div>
                  </div>
                  <Btn sm onClick={()=>setAch(goal)}>Log / Update</Btn>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                  {QUARTERS.map(q=>{
                    const a=goal.achievements[q]; const s=computeScore(goal,q);
                    return (
                      <div key={q} style={{ background:a?"#f0fdf4":"#f8fafc", borderRadius:7, padding:"8px 10px", fontSize:11, border:`1px solid ${a?"#86efac":C.border}` }}>
                        <div style={{ fontWeight:700, color:C.muted, marginBottom:2 }}>{q.split(" ")[0]}</div>
                        {a ? <>
                          <div style={{ color:C.text, fontWeight:600 }}>{fmt(a.actual)}</div>
                          <div style={{ color:C.muted }}>{a.status}</div>
                          {s!==null && <div style={{ fontWeight:800, color:s>=80?C.success:s>=50?C.warning:C.danger }}>{s}%</div>}
                        </> : <div style={{ color:C.muted }}>Not logged</div>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
          }
        </>
      )}

      {showCreate && <GoalFormModal title="Add New Goal" onClose={()=>setCreate(false)} onSave={addGoal} />}
      {editGoal   && <GoalFormModal title="Edit Goal" initial={editGoal} onClose={()=>setEdit(null)} onSave={updateGoal} />}
      {achGoal    && <AchModal goal={achGoal} onClose={()=>setAch(null)} onSave={saveAch} />}
    </div>
  );
}

// ============ MANAGER ============
function ManagerDash({ cu, users, goals, setGoals, setAudit }) {
  const [tab,setTab]       = useState("approvals");
  const [editG,setEditG]   = useState(null);
  const [editT,setEditT]   = useState("");
  const [editW,setEditW]   = useState("");
  const [ciG,setCiG]       = useState(null);
  const [ciQ,setCiQ]       = useState("Q1 (July)");
  const [ciC,setCiC]       = useState("");

  const team     = users.filter(u=>u.managerId===cu.id);
  const teamGoals= goals.filter(g=>team.some(u=>u.id===g.employeeId));
  const pending  = teamGoals.filter(g=>g.status==="pending");
  const approved = teamGoals.filter(g=>g.status==="approved");
  const ciDone   = approved.filter(g=>g.checkins["Q1 (July)"]).length;

  const approve = (g) => {
    setGoals(p=>p.map(x=>x.id===g.id?{...x,status:"approved",locked:true}:x));
    setAudit(p=>[{id:Date.now(),action:"Goal approved",user:cu.name,goalTitle:g.title,timestamp:nowTs(),details:"Approved and locked"},...p]);
  };
  const returnG = (g) => {
    setGoals(p=>p.map(x=>x.id===g.id?{...x,status:"rejected"}:x));
    setAudit(p=>[{id:Date.now(),action:"Goal returned for rework",user:cu.name,goalTitle:g.title,timestamp:nowTs(),details:"Returned to employee"},...p]);
  };
  const saveEdit = () => {
    setGoals(p=>p.map(g=>g.id===editG.id?{...g,target:editG.uom==="Timeline"?editT:(parseFloat(editT)||editT),weightage:parseFloat(editW)}:g));
    setAudit(p=>[{id:Date.now(),action:"Goal edited by manager",user:cu.name,goalTitle:editG.title,timestamp:nowTs(),details:"Target->"+editT+", Weight->"+editW+"%"},...p]);
    setEditG(null);
  };
  const saveCi = () => {
    if (!ciC.trim()) return alert("Please enter a check-in comment.");
    setGoals(p=>p.map(g=>g.id===ciG.id?{...g,checkins:{...g.checkins,[ciQ]:{comment:ciC,managerName:cu.name,date:new Date().toISOString().split("T")[0]}}}:g));
    setAudit(p=>[{id:Date.now(),action:"Check-in completed",user:cu.name,goalTitle:ciG.title,timestamp:nowTs(),details:ciQ+" check-in saved"},...p]);
    setCiG(null); setCiC("");
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="Team Size"           value={team.length}               color={C.primary} />
        <StatCard label="Pending Approvals"   value={pending.length}            color={C.warning} />
        <StatCard label="Approved Goals"      value={approved.length}           color={C.success} />
        <StatCard label="Q1 Check-ins Done"   value={ciDone+"/"+approved.length} color={C.purple} />
      </div>

      <Tabs tabs={[["approvals","Pending Approvals ("+pending.length+")"],["checkins","Q1 Check-ins"],["completion","Completion View"]]} active={tab} onChange={setTab} />

      {tab==="approvals" && (
        <>
          {pending.length===0
            ? <Alert type="success">No pending approvals. All submitted goals have been reviewed.</Alert>
            : pending.map(g=>{
              const emp=users.find(u=>u.id===g.employeeId);
              const empAll=goals.filter(x=>x.employeeId===g.employeeId&&x.status!=="rejected");
              const totW=empAll.reduce((s,x)=>s+x.weightage,0);
              return (
                <Card key={g.id} style={{ marginBottom:12, borderLeft:"4px solid "+C.warning }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                        <span style={{ fontWeight:800, fontSize:15 }}>{g.title}</span>
                        <Badge color="blue">{emp?.name}</Badge>
                        {g.isShared && <Badge color="teal">Shared KPI</Badge>}
                      </div>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:3 }}>{g.thrustArea} | {g.uom} | Target: <strong>{fmt(g.target)}</strong> | Weight: <strong>{g.weightage}%</strong></div>
                      <div style={{ fontSize:13, color:C.muted, marginBottom:4 }}>{g.description}</div>
                      <div style={{ fontSize:12, color:totW===100?C.success:C.danger }}>Employee total weightage: {totW}% {totW!==100&&" (must be 100% for final approval)"}</div>
                    </div>
                    <div style={{ display:"flex", gap:8, flexShrink:0, marginLeft:12 }}>
                      <Btn v="outline" sm onClick={()=>{setEditG(g);setEditT(String(g.target));setEditW(String(g.weightage));}}>Edit</Btn>
                      <Btn v="success" sm onClick={()=>approve(g)}>Approve</Btn>
                      <Btn v="danger"  sm onClick={()=>returnG(g)}>Return</Btn>
                    </div>
                  </div>
                </Card>
              );
            })
          }
        </>
      )}

      {tab==="checkins" && team.map(emp=>{
        const eg=approved.filter(g=>g.employeeId===emp.id);
        if (!eg.length) return null;
        return (
          <Card key={emp.id} style={{ marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:12 }}>{emp.name} <span style={{ fontWeight:400, color:C.muted, fontSize:13 }}>— {emp.dept}</span></div>
            {eg.map(g=>{
              const ach=g.achievements["Q1 (July)"]; const sc=computeScore(g,"Q1 (July)"); const ci=g.checkins["Q1 (July)"];
              return (
                <div key={g.id} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{g.title}</div>
                      <div style={{ fontSize:12, color:C.muted }}>Target: {fmt(g.target)} {ach?"| Actual: "+fmt(ach.actual):"| No achievement logged"}</div>
                      {sc!==null && <div style={{ marginTop:6, width:200 }}><div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>Score: {sc}%</div><PBar value={sc}/></div>}
                      {ci && <div style={{ marginTop:5, fontSize:12, color:"#1e40af", borderLeft:"2px solid #93c5fd", paddingLeft:6 }}>Comment: {ci.comment} ({ci.date})</div>}
                    </div>
                    <div style={{ flexShrink:0, marginLeft:12 }}>
                      {ci ? <Badge color="green">Done</Badge>
                          : ach ? <Btn sm onClick={()=>{setCiG(g);setCiQ("Q1 (July)");setCiC("");}}>Add Check-in</Btn>
                                : <Badge color="gray">Awaiting achievement</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        );
      })}

      {tab==="completion" && (
        <>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Team Completion Dashboard — Q1</div>
          {team.map(emp=>{
            const eg=approved.filter(g=>g.employeeId===emp.id);
            const ad=eg.filter(g=>g.achievements["Q1 (July)"]).length;
            const cd=eg.filter(g=>g.checkins["Q1 (July)"]).length;
            const pct=eg.length?Math.round(ad/eg.length*100):0;
            return (
              <Card key={emp.id} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{emp.dept} | {eg.length} approved goals</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Badge color={ad===eg.length&&eg.length>0?"green":"yellow"}>Q1 Actuals: {ad}/{eg.length}</Badge>
                    <Badge color={cd===eg.length&&eg.length>0?"green":"gray"}>Check-ins: {cd}/{eg.length}</Badge>
                  </div>
                </div>
                {eg.length>0 && <div style={{ marginTop:8 }}><PBar value={pct}/></div>}
              </Card>
            );
          })}
        </>
      )}

      {editG && (
        <Modal title={"Edit Goal - "+editG.title} onClose={()=>setEditG(null)}>
          <Alert type="info">You can adjust target and weightage before approving.</Alert>
          <FI label={editG.uom==="Timeline"?"Target Date":"Target Value"} type={editG.uom==="Timeline"?"date":"number"} value={editT} onChange={e=>setEditT(e.target.value)} />
          <FI label="Weightage (%)" type="number" min="10" max="100" value={editW} onChange={e=>setEditW(e.target.value)} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn v="outline" onClick={()=>setEditG(null)}>Cancel</Btn>
            <Btn onClick={saveEdit}>Save Changes</Btn>
          </div>
        </Modal>
      )}
      {ciG && (
        <Modal title={"Check-in - "+ciG.title} onClose={()=>setCiG(null)}>
          <FS label="Quarter" options={QUARTERS} value={ciQ} onChange={e=>setCiQ(e.target.value)} />
          <div style={{ background:"#f8fafc", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:13 }}>
            <strong>Target:</strong> {fmt(ciG.target)} | <strong>Actual:</strong> {ciG.achievements[ciQ]?.actual!==undefined?fmt(ciG.achievements[ciQ].actual):"Not logged"} | <strong>Score:</strong> {computeScore(ciG,ciQ)!==null?computeScore(ciG,ciQ)+"%":"—"}
          </div>
          <FT label="Check-in Comment *" placeholder="Document discussion, feedback, next steps..." value={ciC} onChange={e=>setCiC(e.target.value)} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Btn v="outline" onClick={()=>setCiG(null)}>Cancel</Btn>
            <Btn onClick={saveCi}>Save Check-in</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============ ADMIN ============
function AdminDash({ cu, users, goals, setGoals, auditLogs, setAudit, escalations, setEscalations }) {
  const [tab,setTab]     = useState("overview");
  const [sf,setSf]       = useState({ dept:"Sales", thrust:"", title:"", desc:"", uom:"", target:"" });
  const [unlockId,setUI] = useState("");

  const sfU=(k,v)=>setSf(p=>({...p,[k]:v}));
  const employees=users.filter(u=>u.role==="employee");
  const managers=users.filter(u=>u.role==="manager");
  const approved=goals.filter(g=>g.status==="approved");
  const pending=goals.filter(g=>g.status==="pending");
  const depts=[...new Set(employees.map(u=>u.dept))];

  const exportCSV = () => {
    const hdr=["Employee","Dept","Manager","Goal","Thrust Area","UoM","Target","Weightage","Status","Q1 Actual","Q1 Score","Q1 Ach Status","Q1 Check-in Comment","Q2 Actual","Q2 Score"];
    const rows=goals.map(g=>{
      const emp=users.find(u=>u.id===g.employeeId); const mgr=users.find(u=>u.id===emp?.managerId);
      const q1=g.achievements["Q1 (July)"], q2=g.achievements["Q2 (October)"];
      const s1=computeScore(g,"Q1 (July)"), s2=computeScore(g,"Q2 (October)");
      return [emp?.name,emp?.dept,mgr?.name,g.title,g.thrustArea,g.uom,g.target,g.weightage,g.status,q1?.actual??"",s1!=null?s1+"%":"",q1?.status??"",g.checkins["Q1 (July)"]?.comment??"",q2?.actual??"",s2!=null?s2+"%":""].join(",");
    });
    const blob=new Blob([[hdr.join(","),...rows].join("\n")],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="achievement_report.csv"; a.click();
  };

  const pushShared = () => {
    if (!sf.thrust||!sf.title||!sf.uom||!sf.target) return alert("Fill all fields.");
    const recips=users.filter(u=>u.role==="employee"&&u.dept===sf.dept);
    if (!recips.length) return alert("No employees in that department.");
    const grpId="sg_"+Date.now();
    const ng=recips.map(u=>({id:Date.now()+u.id,employeeId:u.id,thrustArea:sf.thrust,title:sf.title,description:sf.desc,uom:sf.uom,target:parseFloat(sf.target)||sf.target,weightage:0,status:"approved",locked:true,isShared:true,sharedGroupId:grpId,primaryOwnerId:recips[0].id,createdAt:new Date().toISOString().split("T")[0],achievements:{},checkins:{}}));
    setGoals(p=>[...p,...ng]);
    setAudit(p=>[{id:Date.now(),action:"Shared goal pushed",user:cu.name,goalTitle:sf.title,timestamp:nowTs(),details:"Pushed to "+recips.length+" employees in "+sf.dept},...p]);
    alert("Shared goal pushed to "+recips.length+" employees in "+sf.dept+"!");
    setSf(p=>({...p,thrust:"",title:"",desc:"",uom:"",target:""}));
  };

  const unlock = () => {
    const gid=parseInt(unlockId); const g=goals.find(x=>x.id===gid);
    if (!g) return alert("Goal not found. Check the ID.");
    setGoals(p=>p.map(x=>x.id===gid?{...x,locked:false}:x));
    setAudit(p=>[{id:Date.now(),action:"Goal unlocked (Admin override)",user:cu.name,goalTitle:g.title,timestamp:nowTs(),details:"Admin unlocked for editing"},...p]);
    setUnlockId(""); alert('Goal "'+g.title+'" unlocked!');
  };

  const resolveEsc=(id)=>setEscalations(p=>p.map(e=>e.id===id?{...e,status:"resolved",resolvedAt:new Date().toISOString().split("T")[0]}:e));

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="Employees"        value={employees.length}                                       color={C.primary} />
        <StatCard label="Total Goals"      value={goals.length}                                           color={C.text} />
        <StatCard label="Pending Approval" value={pending.length}                                         color={C.warning} />
        <StatCard label="Approval Rate"    value={(goals.length?Math.round(approved.length/goals.length*100):0)+"%"} color={C.success} />
      </div>

      <Tabs tabs={[["overview","Overview"],["shared","Push Shared Goals"],["unlock","Unlock Goals"],["escalation","Escalations"],["audit","Audit Trail"]]} active={tab} onChange={setTab} />

      {tab==="overview" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>All Employees</span>
            <Btn v="success" sm onClick={exportCSV}>Export CSV Achievement Report</Btn>
          </div>
          {employees.map(emp=>{
            const eg=goals.filter(g=>g.employeeId===emp.id); const mgr=users.find(u=>u.id===emp.managerId);
            const app=eg.filter(g=>g.status==="approved"), pend=eg.filter(g=>g.status==="pending");
            const totW=eg.filter(g=>g.status!=="rejected").reduce((s,g)=>s+g.weightage,0);
            const achQ1=app.filter(g=>g.achievements["Q1 (July)"]).length;
            const ciQ1=app.filter(g=>g.checkins["Q1 (July)"]).length;
            return (
              <Card key={emp.id} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14 }}>{emp.name}</div>
                    <div style={{ fontSize:12, color:C.muted }}>Dept: {emp.dept} | Manager: {mgr?.name||"—"}</div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Badge color={app.length>0?"green":"gray"}>{app.length} approved</Badge>
                    <Badge color={pend.length>0?"yellow":"gray"}>{pend.length} pending</Badge>
                    <Badge color={totW===100?"teal":"red"}>Weight: {totW}%</Badge>
                    <Badge color={achQ1===app.length&&app.length>0?"green":"gray"}>Q1 actuals: {achQ1}/{app.length}</Badge>
                    <Badge color={ciQ1===app.length&&app.length>0?"green":"gray"}>Q1 check-ins: {ciQ1}/{app.length}</Badge>
                  </div>
                </div>
                {eg.length>0 && <div style={{ marginTop:8, display:"flex", gap:5, flexWrap:"wrap" }}>
                  {eg.map(g=><span key={g.id} style={{ fontSize:11, background:"#f1f5f9", borderRadius:6, padding:"3px 8px" }}>{g.title} ({g.status})</span>)}
                </div>}
              </Card>
            );
          })}
          <div style={{ fontWeight:700, fontSize:15, marginTop:20, marginBottom:12 }}>Manager Effectiveness — Q1 Check-in Rate</div>
          {managers.map(m=>{
            const mt=users.filter(u=>u.managerId===m.id);
            const mg=approved.filter(g=>mt.some(u=>u.id===g.employeeId));
            const ci=mg.filter(g=>g.checkins["Q1 (July)"]).length;
            const rate=mg.length?Math.round(ci/mg.length*100):0;
            return (
              <Card key={m.id} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div><div style={{ fontWeight:700, fontSize:14 }}>{m.name}</div><div style={{ fontSize:12, color:C.muted }}>{mt.length} reports | {mg.length} approved team goals</div></div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:900, fontSize:22, color:rate>=80?C.success:rate>=50?C.warning:C.danger }}>{rate}%</div>
                    <div style={{ fontSize:11, color:C.muted }}>Q1 check-in rate</div>
                  </div>
                </div>
                <div style={{ marginTop:8 }}><PBar value={rate}/></div>
              </Card>
            );
          })}
        </>
      )}

      {tab==="shared" && (
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Push Departmental KPI</div>
          <Alert type="info">Shared goals are automatically approved. Recipients can only adjust weightage — title and target are read-only.</Alert>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FS label="Department *" options={depts} value={sf.dept} onChange={e=>sfU("dept",e.target.value)} />
            <FS label="Thrust Area *" options={THRUST_AREAS} value={sf.thrust} onChange={e=>sfU("thrust",e.target.value)} />
          </div>
          <FI label="Goal Title * (read-only for recipients)" value={sf.title} onChange={e=>sfU("title",e.target.value)} />
          <FT label="Description" value={sf.desc} onChange={e=>sfU("desc",e.target.value)} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <FS label="UoM *" options={UOM_TYPES} value={sf.uom} onChange={e=>sfU("uom",e.target.value)} />
            <FI label="Target * (read-only for recipients)" value={sf.target} onChange={e=>sfU("target",e.target.value)} />
          </div>
          <Btn onClick={pushShared}>Push to All {sf.dept} Employees</Btn>
        </Card>
      )}

      {tab==="unlock" && (
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Unlock Approved Goal</div>
          <Alert type="warning">Unlocking allows the employee to edit the goal. This is permanently logged in the audit trail.</Alert>
          <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:16 }}>
            <div style={{ flex:1 }}><FI label="Goal ID" type="number" value={unlockId} onChange={e=>setUI(e.target.value)} /></div>
            <Btn v="danger" onClick={unlock} style={{ marginBottom:13 }}>Unlock Goal</Btn>
          </div>
          <div style={{ fontWeight:700, fontSize:13, color:C.muted, marginBottom:8 }}>Approved goals:</div>
          {approved.map(g=>{
            const emp=users.find(u=>u.id===g.employeeId);
            return <div key={g.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
              <span><strong>#{g.id}</strong> — {g.title} <span style={{ color:C.muted }}>({emp?.name})</span></span>
              <span>{g.locked?"Locked":"Unlocked"}</span>
            </div>;
          })}
        </Card>
      )}

      {tab==="escalation" && (
        <div>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>Escalation Log</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:16 }}>Auto-triggered when employees or managers miss deadlines.</div>
          {escalations.map(e=>(
            <Card key={e.id} style={{ marginBottom:10, borderLeft:"4px solid "+(e.status==="open"?C.danger:C.success) }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{e.type}</div>
                  <div style={{ fontSize:13, color:C.muted }}>Employee: {e.employeeName} | Manager: {e.managerName}</div>
                  <div style={{ fontSize:12, color:C.muted }}>Triggered: {e.triggeredAt}</div>
                  {e.note&&<div style={{ fontSize:12, marginTop:4 }}>Note: {e.note}</div>}
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0, marginLeft:12 }}>
                  <Badge color={e.status==="open"?"red":"green"}>{e.status}</Badge>
                  {e.status==="open"&&<Btn v="outline" sm onClick={()=>resolveEsc(e.id)}>Resolve</Btn>}
                </div>
              </div>
            </Card>
          ))}
          <div style={{ marginTop:20, fontWeight:700, fontSize:14, marginBottom:10 }}>Configured Escalation Rules</div>
          {[["Goal not submitted","Employee has not submitted goals within 7 days of cycle open","Employee → Manager → HR"],
            ["Approval overdue",  "Manager has not approved within 5 days of submission",         "Manager → Skip-level → HR"],
            ["Check-in overdue",  "Quarterly check-in not completed within active window",         "Employee → Manager → HR"]
          ].map(([rule,desc,chain])=>(
            <Card key={rule} style={{ marginBottom:8, background:"#f8fafc" }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{rule}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{desc}</div>
              <div style={{ fontSize:11, color:C.teal, marginTop:4 }}>Chain: {chain}</div>
            </Card>
          ))}
        </div>
      )}

      {tab==="audit" && (
        <div>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Audit Trail</div>
          {auditLogs.map(log=>(
            <div key={log.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"#f8fafc", borderRadius:8, marginBottom:6, fontSize:13 }}>
              <div>
                <div style={{ fontWeight:700 }}>{log.action}</div>
                <div style={{ color:C.muted, marginTop:2 }}><strong>{log.goalTitle}</strong> — {log.details}</div>
              </div>
              <div style={{ textAlign:"right", color:C.muted, fontSize:12, flexShrink:0, marginLeft:12 }}>
                <div style={{ fontWeight:600 }}>{log.user}</div>
                <div>{log.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ ANALYTICS ============
function AnalyticsView({ users, goals }) {
  const employees=users.filter(u=>u.role==="employee");
  const managers=users.filter(u=>u.role==="manager");
  const approved=goals.filter(g=>g.status==="approved");

  const thrustCount={};  THRUST_AREAS.forEach(t=>{thrustCount[t]=goals.filter(g=>g.thrustArea===t).length;});
  const uomCount={};     UOM_TYPES.forEach(u=>{uomCount[u]=goals.filter(g=>g.uom===u).length;});
  const statusCount={approved:0,pending:0,rejected:0,draft:0}; goals.forEach(g=>{if(statusCount[g.status]!==undefined)statusCount[g.status]++;});
  const maxT=Math.max(...Object.values(thrustCount),1);

  const heatmap=employees.map(emp=>{
    const eg=approved.filter(g=>g.employeeId===emp.id);
    const done=eg.filter(g=>g.achievements["Q1 (July)"]).length;
    return { name:emp.name.split(" ")[0], total:eg.length, done, pct:eg.length?Math.round(done/eg.length*100):0 };
  });

  const qoq=QUARTERS.map(q=>{
    const scores=approved.map(g=>computeScore(g,q)).filter(s=>s!==null);
    return { q:q.split(" ")[0], avg:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0, n:scores.length };
  });

  const mgrEff=managers.map(m=>{
    const mt=users.filter(u=>u.managerId===m.id);
    const mg=approved.filter(g=>mt.some(u=>u.id===g.employeeId));
    const ci=mg.filter(g=>g.checkins["Q1 (July)"]).length;
    return { name:m.name.split(" ")[0], rate:mg.length?Math.round(ci/mg.length*100):0, total:mg.length };
  });

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {Object.entries(statusCount).map(([st,ct])=>(
          <StatCard key={st} label={st.charAt(0).toUpperCase()+st.slice(1)+" Goals"} value={ct} color={st==="approved"?C.success:st==="pending"?C.warning:st==="rejected"?C.danger:C.muted} />
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <Card>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Goal Distribution by Thrust Area</div>
          {Object.entries(thrustCount).map(([area,ct])=>(
            <div key={area} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                <span style={{ color:C.muted }}>{area}</span><strong>{ct}</strong>
              </div>
              <div style={{ background:"#e2e8f0", borderRadius:999, height:8 }}>
                <div style={{ width:(ct/maxT*100)+"%", background:C.primary, height:"100%", borderRadius:999 }} />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>QoQ Achievement Trend (Avg Score)</div>
          {qoq.map(({q,avg,n})=>(
            <div key={q} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                <span style={{ color:C.muted }}>{q} <span style={{ fontSize:10 }}>({n} goals)</span></span>
                <strong style={{ color:avg>=80?C.success:avg>=50?C.warning:n>0?C.danger:C.muted }}>{n>0?avg+"%":"No data"}</strong>
              </div>
              {n>0 && <div style={{ background:"#e2e8f0", borderRadius:999, height:9 }}><div style={{ width:avg+"%", background:avg>=80?C.success:avg>=50?C.warning:C.danger, height:"100%", borderRadius:999 }} /></div>}
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Q1 Achievement Heatmap — By Employee</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
          {heatmap.map(d=>{
            const bg=d.pct>=80?"#dcfce7":d.pct>=50?"#fef9c3":d.total===0?"#f1f5f9":"#fee2e2";
            const tx=d.pct>=80?"#166534":d.pct>=50?"#854d0e":d.total===0?C.muted:"#991b1b";
            return (
              <div key={d.name} style={{ background:bg, borderRadius:10, padding:"14px 12px", textAlign:"center" }}>
                <div style={{ fontWeight:900, fontSize:22, color:tx }}>{d.total>0?d.pct+"%":"—"}</div>
                <div style={{ fontSize:12, color:tx, marginTop:4, fontWeight:700 }}>{d.name}</div>
                <div style={{ fontSize:11, color:tx, opacity:0.8 }}>{d.done}/{d.total} goals</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>UoM Type Breakdown</div>
          {Object.entries(uomCount).map(([u,ct])=>(
            <div key={u} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
              <span style={{ color:C.muted }}>{u}</span><strong>{ct}</strong>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Manager Effectiveness</div>
          {mgrEff.map(m=>(
            <div key={m.name} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                <span style={{ fontWeight:600 }}>{m.name}</span>
                <strong style={{ color:m.rate>=80?C.success:m.rate>=50?C.warning:C.danger }}>{m.rate}% check-in rate</strong>
              </div>
              <PBar value={m.rate} />
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{m.total} team goals tracked</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ============ ROOT ============
export default function App() {
  const [cu,setCU]            = useState(null);
  const [users]               = useState(INIT_USERS);
  const [goals,setGoals]      = useState(INIT_GOALS);
  const [audit,setAudit]      = useState(INIT_AUDIT);
  const [escs,setEscs]        = useState(INIT_ESC);
  const [section,setSection]  = useState("dashboard");
  const [email,setEmail]      = useState("");
  const [err,setErr]          = useState("");

  const login = () => {
    const u=users.find(x=>x.email.toLowerCase()===email.toLowerCase());
    if (!u) { setErr("Email not found. Use a demo account below."); return; }
    setCU(u); setSection("dashboard"); setErr("");
  };

  if (!cu) {
    return (
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1e3a8a 0%,#7c3aed 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ background:"#fff", borderRadius:20, padding:40, width:"100%", maxWidth:440, boxShadow:"0 32px 100px rgba(0,0,0,0.25)" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ width:60, height:60, background:"linear-gradient(135deg,#1e3a8a,#7c3aed)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", fontSize:30 }}>🎯</div>
            <h1 style={{ margin:0, fontSize:26, fontWeight:900, color:C.text }}>GoalTrack</h1>
            <p style={{ color:C.muted, fontSize:13, margin:"6px 0 0" }}>Atomberg Technologies | AtomQuest Hackathon 2026</p>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:0.4 }}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
              style={{ width:"100%", padding:"11px 14px", border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box" }}
              placeholder="Enter your email" />
          </div>
          {err && <div style={{ color:C.danger, fontSize:13, marginBottom:8 }}>{err}</div>}
          <button onClick={login} style={{ width:"100%", padding:13, background:"linear-gradient(135deg,#1e3a8a,#7c3aed)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:20 }}>
            Sign In
          </button>
          <div style={{ background:"#f8fafc", borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>Demo Accounts</div>
            {[
              ["Employee",  "priya@atomberg.com",  C.success],
              ["Employee",  "anita@atomberg.com",  C.success],
              ["Employee",  "vikram@atomberg.com", C.teal   ],
              ["Manager",   "rajesh@atomberg.com", C.warning],
              ["Admin / HR","admin@atomberg.com",  C.primary],
            ].map(([role,em,col],i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{role}</span>
                <button onClick={()=>setEmail(em)} style={{ fontSize:11, color:col, background:"none", border:`1.5px solid ${col}`, borderRadius:6, padding:"3px 10px", cursor:"pointer", fontWeight:700 }}>{em}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const navItems={
    employee:[["dashboard","My Goals"],["analytics","Analytics"]],
    manager: [["dashboard","Team"],["analytics","Analytics"]],
    admin:   [["dashboard","Admin"],["analytics","Analytics"]],
  };
  const nav=navItems[cu.role]||navItems.employee;
  const rolePill={employee:C.success,manager:C.warning,admin:C.primary};

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, background:"linear-gradient(135deg,#1e3a8a,#7c3aed)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🎯</div>
            <span style={{ fontWeight:900, fontSize:16, color:C.text }}>GoalTrack</span>
          </div>
          <div style={{ display:"flex", gap:2 }}>
            {nav.map(([k,lb])=>(
              <button key={k} onClick={()=>setSection(k)} style={{ padding:"6px 14px", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", background:section===k?"#eff6ff":"transparent", color:section===k?C.primary:C.muted, border:"none" }}>
                {lb}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.text }}>{cu.name}</div>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:0.5 }}>{cu.role} | {cu.dept}</div>
          </div>
          <div style={{ width:36, height:36, background:`linear-gradient(135deg,${rolePill[cu.role]},${C.purple})`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13 }}>
            {cu.name.split(" ").map(n=>n[0]).join("")}
          </div>
          <button onClick={()=>setCU(null)} style={{ fontSize:12, color:C.muted, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 10px", cursor:"pointer" }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth:1120, margin:"0 auto", padding:"28px 24px" }}>
        <div style={{ marginBottom:22 }}>
          <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:C.text }}>
            {section==="dashboard"&&cu.role==="employee"&&"My Goal Sheet"}
            {section==="dashboard"&&cu.role==="manager"&&"Team Management"}
            {section==="dashboard"&&cu.role==="admin"&&"Admin Control Centre"}
            {section==="analytics"&&"Analytics & Insights"}
          </h2>
          <p style={{ margin:"4px 0 0", color:C.muted, fontSize:13 }}>Goal Cycle: May 2026 — April 2027 | Current Window: Q1 Check-in (July 2026)</p>
        </div>

        {section==="dashboard"&&cu.role==="employee"&&<EmployeeDash cu={cu} goals={goals} setGoals={setGoals} setAudit={setAudit} />}
        {section==="dashboard"&&cu.role==="manager"&&<ManagerDash  cu={cu} users={users} goals={goals} setGoals={setGoals} setAudit={setAudit} />}
        {section==="dashboard"&&cu.role==="admin"&&  <AdminDash    cu={cu} users={users} goals={goals} setGoals={setGoals} auditLogs={audit} setAudit={setAudit} escalations={escs} setEscalations={setEscs} />}
        {section==="analytics"&&<AnalyticsView users={users} goals={goals} />}
      </div>
    </div>
  );
}