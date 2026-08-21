const $=id=>document.getElementById(id);
const STORAGE_KEY='felicity_dhol_tasha_attendance_v1';
const ADMIN_EMAIL='admin@felicitydholtasha.com';
const ADMIN_PASSWORD_SHA256='65de85de70a196c52b26f4e7ffdce9d3406a049cbb757488ad88b9668624350a';
const BATCHES=['Batch 1','Batch 2','Batch 3'];
let admin=false;
let selectedDate=new Date().toISOString().slice(0,10);
let selectedBatch='Batch 1';
let store={version:1,updatedAt:null,dates:{}};

async function sha256(text){const data=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function dateLabel(d){return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function batchFromKey(k){const parts=k.split('__');return parts.length===2?parts[1].replace(/_/g,' '):'';}
function dateFromKey(k){return k.split('__')[0];}
function batchKey(batch){return batch.replace(/\s+/g,'_');}
function attendanceKey(date=selectedDate,batch=selectedBatch){return `${date}__${batchKey(batch)}`;}
function loadLocal(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);if(parsed&&parsed.dates)store=parsed;}}catch(e){console.warn(e)}}
async function loadSource(){try{const res=await fetch('attendance.json',{cache:'no-store'});if(!res.ok)throw new Error('attendance.json not found');const source=await res.json();const local=localStorage.getItem(STORAGE_KEY);store=local?JSON.parse(local):source;}catch(e){loadLocal();}}
function saveLocal(){
 // Normalize all attendance records so only explicitly present members remain.
 Object.keys(store.dates||{}).forEach(k=>{
   const raw=store.dates[k]||{}; const clean={};
   Object.keys(raw).forEach(sr=>{const v=raw[sr]; if(v===true || v==='present' || v==='Present' || v===1) clean[sr]=true;});
   store.dates[k]=clean;
 });
 store.updatedAt=new Date().toISOString();
 localStorage.setItem(STORAGE_KEY,JSON.stringify(store));$('syncNotice').textContent='Source: browser local storage • Export JSON to publish changes';}
function loadDates(){$('dateSelect').value=selectedDate;}
function presentFor(date,batch){
 const raw=store.dates[attendanceKey(date,batch)]||{};
 const clean={};
 Object.keys(raw).forEach(sr=>{
   const v=raw[sr];
   if(v===true || v==='present' || v==='Present' || v===1) clean[sr]=true;
 });
 return clean;
}
function allPresentRows(date){
 const rows=[];
 BATCHES.forEach(batch=>{
   const attendance=presentFor(date,batch);
   MEMBERS.forEach(m=>{if(attendance[m.srNo])rows.push({srNo:m.srNo,flatNo:m.flatNo,name:m.name,batch});});
 });
 return rows.sort((a,b)=>a.srNo-b.srNo || a.batch.localeCompare(b.batch));
}
function renderPublicTable(){
 const rows=allPresentRows(selectedDate);
 $('publicTableWrap').innerHTML=rows.length?`<table class="attendanceTable"><thead><tr><th>Batch</th><th>Sr. No.</th><th>Name</th><th>Flat No</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.batch)}</td><td>${r.srNo}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.flatNo)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">No present members for this date.</div>';
}
function renderAdminTable(){
 const attendance=presentFor(selectedDate,selectedBatch);
 const q=$('search').value.trim().toLowerCase();
 const list=MEMBERS.filter(m=>!q||String(m.srNo).includes(q)||m.name.toLowerCase().includes(q)||m.flatNo.toLowerCase().includes(q));
 $('adminTableWrap').innerHTML=`<table class="attendanceTable adminTable"><thead><tr><th>Batch</th><th>Sr. No.</th><th>Name</th><th>Flat No</th><th>Status</th><th>Action</th></tr></thead><tbody>${list.map(m=>{const p=!!attendance[m.srNo];return `<tr class="${p?'isPresent':''}"><td>${escapeHtml(selectedBatch)}</td><td>${m.srNo}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.flatNo)}</td><td><span class="status ${p?'present':'absent'}">${p?'Present':'Absent'}</span></td><td><button class="${p?'danger':'primary'} smallBtn" onclick="togglePresent(${m.srNo})">${p?'Mark Absent':'Mark Present'}</button></td></tr>`}).join('')}</tbody></table>`;
}
function updateAdminUI(){
 $('loginToggle').classList.toggle('hidden',admin);
 $('adminPanel').classList.toggle('hidden',!admin);
 $('adminTableWrap').classList.toggle('hidden',!admin);
 $('publicTableWrap').classList.toggle('hidden',admin);
}
function render(){
 if(admin){
   const attendance=presentFor(selectedDate,selectedBatch);
   $('presentCount').textContent=Object.keys(attendance).length;
   $('totalCount').textContent=MEMBERS.length;
   $('shownDate').textContent=`${dateLabel(selectedDate)} • ${selectedBatch}`;
   $('syncNotice').textContent='Admin view • Attendance for the selected date and batch';
   renderAdminTable();
 }else{
   $('syncNotice').textContent=`Present members for ${dateLabel(selectedDate)} • all batches`;
   renderPublicTable();
 }
}
window.togglePresent=function(sr){
 if(!admin)return;
 const d={...(store.dates[attendanceKey()]||{})};
 if(d[sr]) delete d[sr]; else d[sr]=true;
 store.dates[attendanceKey()]=d;
 saveLocal();
 render();
};
$('dateSelect').onchange=()=>{if($('dateSelect').value){selectedDate=$('dateSelect').value;render();}};
$('batchSelect').onchange=()=>{selectedBatch=$('batchSelect').value;render();};
$('search').oninput=render;
$('loginToggle').onclick=()=>{$('loginCard').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});};
$('logoutBtn').onclick=()=>{admin=false;updateAdminUI();render();$('loginCard').classList.add('hidden');};
$('loginBtn').onclick=async()=>{const email=$('email').value.trim().toLowerCase(),password=$('password').value;if(email!==ADMIN_EMAIL){showLoginMsg('Invalid Admin email.');return}const hash=await sha256(password);if(hash!==ADMIN_PASSWORD_SHA256){showLoginMsg('Invalid password.');return}admin=true;updateAdminUI();$('loginCard').classList.add('hidden');$('password').value='';render();};
function showLoginMsg(t){$('loginMsg').textContent=t;$('loginMsg').classList.remove('hidden');}
function rowsForDate(date,batch){return MEMBERS.filter(m=>presentFor(date,batch)[m.srNo]).map(m=>[batch,String(m.srNo),m.name,m.flatNo]);}
function pdf(title,rows,headers=['Batch','Sr.No.','Name','Flat No']){const {jsPDF}=window.jspdf;const doc=new jsPDF();doc.setFontSize(16);doc.text(title,14,16);doc.setFontSize(9);let y=25;const widths=headers.length===4?[18,35,85,35]:headers.length===5?[27,22,30,70,35]:[24,20,18,60,35,30];function row(vals){let x=14;vals.forEach((v,i)=>{doc.rect(x,y-5,widths[i],7);doc.text(String(v).slice(0,40),x+2,y);x+=widths[i]});y+=7;if(y>280){doc.addPage();y=18}}row(headers);rows.forEach(row);doc.save(title.replace(/[^a-z0-9]+/gi,'_')+'.pdf');}
$('pdfDate').onclick=()=>pdf(`Felicity Attendance - ${dateLabel(selectedDate)} - ${selectedBatch}`,rowsForDate(selectedDate,selectedBatch));
$('pdfAll').onclick=()=>{const rows=[];Object.keys(store.dates).sort().forEach(k=>{const d=dateFromKey(k),batch=batchFromKey(k),attendance=presentFor(d,batch);MEMBERS.forEach(m=>{if(attendance[m.srNo]===true)rows.push([dateLabel(d),batch,String(m.srNo),m.name,m.flatNo])})});pdf('Felicity Dhol Tasha - All Attendance',rows,['Date','Batch','Sr.No.','Name','Flat No']);};
$('exportJson').onclick=()=>{const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='attendance.json';a.click();URL.revokeObjectURL(a.href);};
$('importJson').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!imported||typeof imported.dates!=='object')throw new Error('Invalid attendance JSON');store=imported;saveLocal();render();alert('Attendance JSON imported successfully.');}catch(err){alert('Import failed: '+err.message)}e.target.value='';};
loadSource().then(()=>{loadDates();$('batchSelect').value=selectedBatch;updateAdminUI();render();});
