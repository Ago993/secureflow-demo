"use strict";

const sample = {
  name: "Sample baseline", scope: "PMI demo", updatedAt: "2026-09-22",
  findings: [
    {id:"ID-01",control:"Copertura MFA",category:"Identity",status:"Fail",severity:"High",priority:1,evidence:"22 account su 28 hanno MFA attivo; 2 account amministrativi risultano senza secondo fattore.",remediation:"Abilitare MFA sugli account mancanti e richiederlo per tutti i ruoli privilegiati."},
    {id:"ID-02",control:"Account amministrativi",category:"Identity",status:"Review",severity:"Medium",priority:2,evidence:"4 account dispongono di privilegi amministrativi; 1 non mostra un owner operativo definito.",remediation:"Confermare owner e necessità dei privilegi; ridurre i ruoli permanenti dove possibile."},
    {id:"BA-01",control:"Esito backup",category:"Backup",status:"Fail",severity:"High",priority:1,evidence:"L'ultimo backup verificato per 1 workload critico risale a 9 giorni fa.",remediation:"Ripristinare la schedulazione e testare il recovery del workload interessato."},
    {id:"PA-01",control:"Aggiornamenti critici",category:"Patching",status:"Fail",severity:"High",priority:1,evidence:"7 aggiornamenti classificati critici risultano oltre la finestra operativa prevista.",remediation:"Definire una finestra di patch e applicare prima gli aggiornamenti su sistemi esposti o privilegiati."},
    {id:"WEB-01",control:"HTTPS/TLS",category:"Web",status:"Pass",severity:"Info",priority:4,evidence:"Dataset di verifica: HTTPS forzato e protocollo legacy non riportato.",remediation:"Mantenere monitoraggio delle scadenze certificato e configurazione TLS."},
    {id:"WEB-02",control:"Content-Security-Policy",category:"Web",status:"Fail",severity:"Medium",priority:2,evidence:"Header CSP non presente nel dataset del sito pubblico.",remediation:"Definire una policy CSP progressiva partendo da report-only, poi applicare le direttive necessarie."},
    {id:"NET-01",control:"Servizi esposti",category:"Network",status:"Review",severity:"Critical",priority:1,evidence:"Il dataset segnala un servizio amministrativo pubblicamente raggiungibile; la demo non effettua alcuna verifica di rete.",remediation:"Confermare l'esposizione in scope autorizzato e limitarla tramite VPN, allowlist o accesso privato."},
    {id:"LOG-01",control:"Conservazione log",category:"Logging",status:"Pass",severity:"Low",priority:4,evidence:"I sistemi principali risultano configurati per conservare log operativi per 90 giorni.",remediation:"Verificare periodicamente integrità, accessi e copertura dei log."},
    {id:"IR-01",control:"Contatti di escalation",category:"Response",status:"Review",severity:"Medium",priority:3,evidence:"Manca un contatto secondario documentato per gli incidenti fuori orario.",remediation:"Definire almeno un backup contact e una procedura minima di escalation."},
    {id:"END-01",control:"Cifratura endpoint",category:"Endpoint",status:"Pass",severity:"Low",priority:4,evidence:"Il dataset indica cifratura disco attiva sugli endpoint gestiti.",remediation:"Mantenere inventario e verifica periodica della cifratura."}
  ]
};

let dataset = structuredClone(sample);
let selectedId = null;

const $ = id => document.getElementById(id);
const els = {
  datasetName:$("datasetName"), scopeName:$("scopeName"), updatedAt:$("updatedAt"),
  score:$("scoreKpi"), high:$("highKpi"), pass:$("passKpi"), review:$("reviewKpi"),
  body:$("findingsBody"), count:$("resultCount"), search:$("searchInput"),
  severity:$("severityFilter"), category:$("categoryFilter"),
  detailTitle:$("detailTitle"), detailEvidence:$("detailEvidence"), detailRemediation:$("detailRemediation")
};

function safeText(value){ return String(value ?? "").slice(0, 5000); }

function validateDataset(raw){
  if(!raw || !Array.isArray(raw.findings)) throw new Error("Formato non valido: findings deve essere un array.");
  if(raw.findings.length > 500) throw new Error("Massimo 500 controlli per questa demo.");
  const allowedStatus = new Set(["Pass","Fail","Review"]);
  const allowedSeverity = new Set(["Critical","High","Medium","Low","Info"]);
  const findings = raw.findings.map((f,i)=>({
    id:safeText(f.id || "F-"+(i+1)),
    control:safeText(f.control || "Controllo senza nome"),
    category:safeText(f.category || "Other"),
    status:allowedStatus.has(f.status)?f.status:"Review",
    severity:allowedSeverity.has(f.severity)?f.severity:"Info",
    priority:Number.isFinite(Number(f.priority))?Math.min(4,Math.max(1,Number(f.priority))):3,
    evidence:safeText(f.evidence || "Nessuna evidenza fornita."),
    remediation:safeText(f.remediation || "Definire una remediation dopo verifica.")
  }));
  return {name:safeText(raw.name || "Dataset locale"),scope:safeText(raw.scope || "Scope locale"),updatedAt:safeText(raw.updatedAt || new Date().toISOString().slice(0,10)),findings};
}

function scoreBaseline(findings){
  const weights = {Critical:5,High:4,Medium:3,Low:2,Info:1};
  let total=0, earned=0;
  for(const f of findings){ const w=weights[f.severity]||1; total+=w; earned += f.status==="Pass"?w:f.status==="Review"?w*.45:0; }
  return total ? Math.round(earned/total*100) : 0;
}

function buildCategoryOptions(){
  const current = els.category.value;
  while(els.category.options.length>1) els.category.remove(1);
  [...new Set(dataset.findings.map(f=>f.category))].sort().forEach(cat=>{
    const o=document.createElement("option"); o.value=cat; o.textContent=cat; els.category.appendChild(o);
  });
  if([...els.category.options].some(o=>o.value===current)) els.category.value=current;
}

function filtered(){
  const q=els.search.value.trim().toLowerCase(), sev=els.severity.value, cat=els.category.value;
  return dataset.findings.filter(f=>{
    const text=(f.control+" "+f.category+" "+f.evidence+" "+f.remediation).toLowerCase();
    return (!q||text.includes(q)) && (sev==="all"||f.severity===sev) && (cat==="all"||f.category===cat);
  }).sort((a,b)=>a.priority-b.priority || a.control.localeCompare(b.control));
}

function badge(text, cls){
  const s=document.createElement("span"); s.className="badge "+cls; s.textContent=text; return s;
}

function render(){
  els.datasetName.textContent=dataset.name; els.scopeName.textContent=dataset.scope; els.updatedAt.textContent=dataset.updatedAt;
  els.score.textContent=scoreBaseline(dataset.findings)+"%";
  els.high.textContent=dataset.findings.filter(f=>["Critical","High"].includes(f.severity) && f.status!=="Pass").length;
  els.pass.textContent=dataset.findings.filter(f=>f.status==="Pass").length;
  els.review.textContent=dataset.findings.filter(f=>f.status==="Review").length;
  buildCategoryOptions();

  const rows=filtered(); els.count.textContent=rows.length+" risultati";
  els.body.replaceChildren();
  rows.forEach(f=>{
    const tr=document.createElement("tr"); if(f.id===selectedId) tr.classList.add("active");
    const td1=document.createElement("td"); const strong=document.createElement("strong"); strong.textContent=f.control; td1.appendChild(strong);
    const td2=document.createElement("td"); td2.textContent=f.category;
    const td3=document.createElement("td"); td3.appendChild(badge(f.status,"status-"+f.status.toLowerCase()));
    const td4=document.createElement("td"); td4.appendChild(badge(f.severity,"sev-"+f.severity));
    const td5=document.createElement("td"); td5.textContent="P"+f.priority;
    tr.append(td1,td2,td3,td4,td5); tr.tabIndex=0;
    const select=()=>selectFinding(f.id); tr.addEventListener("click",select); tr.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select();}});
    els.body.appendChild(tr);
  });
}

function selectFinding(id){
  const f=dataset.findings.find(x=>x.id===id); if(!f) return;
  selectedId=id; els.detailTitle.textContent=f.control+" · "+f.severity; els.detailEvidence.textContent=f.evidence; els.detailRemediation.textContent=f.remediation; render();
}

function loadSample(){
  dataset=structuredClone(sample); selectedId=null; els.search.value=""; els.severity.value="all"; els.category.value="all"; render(); selectFinding(dataset.findings[0].id);
}

function exportReport(){
  const report={generatedAt:new Date().toISOString(),mode:"local-demo",networkScanning:false,...dataset,score:scoreBaseline(dataset.findings)};
  const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob), a=document.createElement("a"); a.href=url; a.download="secureflow-report.json"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

$("sampleBtn").addEventListener("click",loadSample);
$("exportBtn").addEventListener("click",exportReport);
$("resetFilters").addEventListener("click",()=>{els.search.value="";els.severity.value="all";els.category.value="all";render();});
[els.search,els.severity,els.category].forEach(el=>el.addEventListener(el===els.search?"input":"change",render));
$("jsonInput").addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file) return;
  if(file.size>1024*1024){alert("File troppo grande: massimo 1 MB.");e.target.value="";return;}
  try{dataset=validateDataset(JSON.parse(await file.text()));selectedId=null;els.search.value="";els.severity.value="all";els.category.value="all";render();if(dataset.findings[0])selectFinding(dataset.findings[0].id);}
  catch(err){alert("Import non riuscito: "+safeText(err.message));}
  e.target.value="";
});

loadSample();