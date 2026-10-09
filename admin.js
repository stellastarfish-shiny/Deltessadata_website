const C=APP_CONFIG,sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY),$=s=>document.querySelector(s);
const S={clients:[],jobs:[],logs:[],messages:[],view:'clients',cid:null};
const STATUS=['In Progress','Pending Review','Completed'],SERVICES=['Data Analysis','Automation','Capacity Building','Other'];
const SECTORS=['Bank','SACCO','Insurance','Financial Institution','Retail','Private Sector','Public Sector','Other'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kes=n=>'KES '+Number(n||0).toLocaleString('en-KE');
const today=()=>new Date().toISOString().slice(0,10);
const bal=j=>Number(j.charge)-Number(j.amount_paid);
const arrears=j=>bal(j)>0&&(j.status==='Completed'||(j.due_date&&j.due_date<today()));
const cname=id=>S.clients.find(c=>c.id===id)?.name||'-';
const badge=s=>`<span class="badge b-${s.replace(/\s/g,'').toLowerCase()}">${esc(s)}</span>`;
const toast=m=>{const t=$('#toast');t.textContent=m;t.hidden=false;setTimeout(()=>t.hidden=true,4500)};
const sum=(a,f)=>a.reduce((x,j)=>x+f(j),0);

async function init(){
  const {data}=await sb.auth.getSession();
  if(!data.session)return location.replace('login.html');
  $('#who').textContent=data.session.user.email;
  await load();render();
}
sb.auth.onAuthStateChange((_,s)=>{if(!s)location.replace('login.html')});
$('#out').onclick=()=>sb.auth.signOut();

async function load(){
  const r=await Promise.all([sb.from('clients').select('*').order('name'),sb.from('jobs').select('*').order('signon_date',{ascending:false}),
    sb.from('client_logs').select('*').order('log_date',{ascending:false}),sb.from('messages').select('*').order('created_at',{ascending:false})]);
  const bad=r.find(x=>x.error);if(bad)return toast(bad.error.message);
  [S.clients,S.jobs,S.logs,S.messages]=r.map(x=>x.data);
}
async function save(table,row,id){
  const {error}=await(id?sb.from(table).update(row).eq('id',id):sb.from(table).insert(row));
  if(error){toast(error.message);return false}
  await load();render();return true;
}
async function del(table,id,msg){
  if(!confirm(msg||'Delete this record?'))return;
  const {error}=await sb.from(table).delete().eq('id',id);
  if(error)return toast(error.message);
  await load();render();
}

/* ---------- generic modal form ---------- */
function form(title,fields,vals,onSave){
  const d=$('#dlg');
  d.innerHTML=`<form class="fm"><h2>${esc(title)}</h2>${fields.map(f=>{
    const v=vals[f.n]??f.d??'',r=f.req?'required':'';let i;
    if(f.t==='select')i=`<select name="${f.n}" ${r}>${f.o.map(o=>{const[a,b]=Array.isArray(o)?o:[o,o];return `<option value="${esc(a)}" ${a==v?'selected':''}>${esc(b)}</option>`}).join('')}</select>`;
    else if(f.t==='textarea')i=`<textarea name="${f.n}" rows="3" ${r}>${esc(v)}</textarea>`;
    else i=`<input name="${f.n}" type="${f.t||'text'}" value="${esc(v)}" ${r} ${f.t==='number'?'min="0" step="any"':''}>`;
    return `<label>${esc(f.l)}${i}</label>`}).join('')}
    <div class="row"><button type="button" class="btn btn-ghost" id="cx">Cancel</button><button class="btn btn-green">Save</button></div></form>`;
  $('#cx').onclick=()=>d.close();
  d.querySelector('form').onsubmit=async e=>{
    e.preventDefault();const o=Object.fromEntries(new FormData(e.target));
    for(const k in o)if(o[k]==='')o[k]=null;
    for(const f of fields)if(f.t==='number')o[f.n]=Number(o[f.n]||0);
    if(await onSave(o))d.close();
  };
  d.showModal();
}
const clientForm=c=>form(c?'Edit client':'Add client',[
  {n:'name',l:'Client name',req:1},{n:'sector',l:'Sector',t:'select',o:SECTORS},{n:'contact_person',l:'Primary contact'},
  {n:'email',l:'Email',t:'email'},{n:'phone',l:'Phone',t:'tel'},{n:'address',l:'Address / company profile',t:'textarea'}],c||{},o=>save('clients',o,c?.id));
const clientOpts=()=>S.clients.map(c=>[c.id,c.name]);
const jobForm=(j={})=>{
  if(!S.clients.length)return toast('Add a client first.');
  form(j.id?'Edit job':'Add job',[
    {n:'client_id',l:'Client',t:'select',o:clientOpts(),req:1},{n:'title',l:'Job / task',req:1},{n:'description',l:'Job description',t:'textarea'},
    {n:'service_type',l:'Service',t:'select',o:SERVICES},{n:'status',l:'Status',t:'select',o:STATUS},
    {n:'signon_date',l:'Sign-on date',t:'date',d:today()},{n:'due_date',l:'Due date',t:'date'},{n:'completion_date',l:'Completion date',t:'date'},
    {n:'charge',l:'Amount charged (KES)',t:'number'},{n:'amount_paid',l:'Amount paid (KES)',t:'number'}],j,
    o=>{if(o.status==='Completed'&&!o.completion_date)o.completion_date=today();return save('jobs',o,j.id)});
};
const logForm=(l={})=>{
  if(!S.clients.length)return toast('Add a client first.');
  form(l.id?'Edit log':'Add log',[
    {n:'client_id',l:'Client',t:'select',o:clientOpts(),req:1},{n:'log_date',l:'Date',t:'date',d:today()},
    {n:'log_type',l:'Type',t:'select',o:['Call','Meeting','Email','Note','Other']},{n:'note',l:'Log entry',t:'textarea',req:1}],l,o=>save('client_logs',o,l.id));
};

/* ---------- views ---------- */
const acts=(t,id)=>`<button class="lnk" data-a="edit-${t}" data-id="${id}">Edit</button><button class="lnk del" data-a="del-${t}" data-id="${id}">Delete</button>`;
const tbl=(h,rows)=>`<div class="tw"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows||`<tr data-s="" data-st=""><td colspan="${h.length}" class="empty">Nothing here yet.</td></tr>`}</tbody></table></div>`;
const stats=js=>{const c=sum(js,j=>Number(j.charge)),p=sum(js,j=>Number(j.amount_paid)),ar=sum(js.filter(arrears),bal);
  return `<div class="cards">${[['Charged',c],['Paid',p],['Outstanding balance',c-p],['Arrears (completed or overdue)',ar]].map(([l,v])=>`<div class="box"><small>${l}</small><b>${kes(v)}</b></div>`).join('')}</div>`};
const jobRow=(j,withClient)=>{const b=bal(j);
  return `<tr data-s="${esc([j.title,j.description,cname(j.client_id)].join(' ').toLowerCase())}" data-st="${esc(j.status)}">
  ${withClient?`<td><a href="#" data-a="open" data-id="${j.client_id}">${esc(cname(j.client_id))}</a></td>`:''}
  <td><b>${esc(j.title)}</b><br><small>${esc(j.description)}</small></td><td>${esc(j.service_type)}</td><td>${badge(j.status)}</td>
  <td>${esc(j.signon_date)}</td><td>${esc(j.due_date)}</td><td>${esc(j.completion_date)}</td>
  <td>${kes(j.charge)}</td><td>${kes(j.amount_paid)}</td><td>${kes(b)} ${arrears(j)?'<span class="badge b-arrears">Arrears</span>':''}</td>
  <td class="ac">${b>0?`<button class="lnk" data-a="pay" data-id="${j.id}">+ Payment</button>`:''}${acts('job',j.id)}</td></tr>`};
const JH=['Job / task','Service','Status','Sign-on','Due','Completed','Charged','Paid','Balance',''];

const views={
  clients:()=>`<div class="bar"><h1>Clients</h1><input class="q" placeholder="Search clients"><button class="btn btn-green" data-a="add-client">Add client</button></div>`+
    tbl(['Client','Sector','Contact','Phone','Outstanding',''],S.clients.map(c=>`<tr data-s="${esc([c.name,c.contact_person,c.sector,c.email].join(' ').toLowerCase())}" data-st="">
      <td><a href="#" data-a="open" data-id="${c.id}"><b>${esc(c.name)}</b></a></td><td>${esc(c.sector)}</td><td>${esc(c.contact_person)}<br><small>${esc(c.email)}</small></td>
      <td>${esc(c.phone)}</td><td>${kes(sum(S.jobs.filter(j=>j.client_id===c.id),bal))}</td><td class="ac">${acts('client',c.id)}</td></tr>`).join('')),
  client:()=>{
    const c=S.clients.find(x=>x.id===S.cid);if(!c){S.view='clients';return views.clients()}
    const js=S.jobs.filter(j=>j.client_id===c.id),ls=S.logs.filter(l=>l.client_id===c.id);
    return `<div class="bar"><h1>${esc(c.name)}</h1><button class="btn btn-ghost" data-a="back">All clients</button><button class="btn btn-ghost" data-a="edit-client" data-id="${c.id}">Edit client</button></div>
    <div class="box" style="margin-bottom:1rem"><b>${esc(c.sector)}</b> &middot; ${esc(c.contact_person)} &middot; ${esc(c.email)} &middot; ${esc(c.phone)}<br><small>${esc(c.address)}</small></div>${stats(js)}
    <h2 class="sub">Service history and jobs <button class="btn btn-green" data-a="add-job">Add job</button></h2>${tbl(JH,js.map(j=>jobRow(j,false)).join(''))}
    <h2 class="sub">Client log <button class="btn btn-green" data-a="add-log">Add log</button></h2>${tbl(['Date','Type','Entry',''],ls.map(l=>`<tr data-s="" data-st=""><td>${esc(l.log_date)}</td><td>${esc(l.log_type)}</td><td class="pre">${esc(l.note)}</td><td class="ac">${acts('log',l.id)}</td></tr>`).join(''))}`},
  jobs:()=>`<div class="bar"><h1>Jobs and tasks</h1><input class="q" placeholder="Search jobs"><select class="sf"><option value="">All statuses</option>${STATUS.map(s=>`<option>${s}</option>`).join('')}</select><button class="btn btn-green" data-a="add-job">Add job</button></div>${stats(S.jobs)}`+
    tbl(['Client',...JH],S.jobs.map(j=>jobRow(j,true)).join('')),
  logs:()=>`<div class="bar"><h1>Client logs</h1><input class="q" placeholder="Search logs"><button class="btn btn-green" data-a="add-log">Add log</button></div>`+
    tbl(['Date','Client','Type','Entry',''],S.logs.map(l=>`<tr data-s="${esc([cname(l.client_id),l.note,l.log_type].join(' ').toLowerCase())}" data-st=""><td>${esc(l.log_date)}</td>
      <td><a href="#" data-a="open" data-id="${l.client_id}">${esc(cname(l.client_id))}</a></td><td>${esc(l.log_type)}</td><td class="pre">${esc(l.note)}</td><td class="ac">${acts('log',l.id)}</td></tr>`).join('')),
  messages:()=>`<div class="bar"><h1>Website messages</h1><input class="q" placeholder="Search messages"></div>`+
    tbl(['Received','From','Subject','Message',''],S.messages.map(m=>`<tr class="${m.is_read?'':'unread'}" data-s="${esc([m.name,m.email,m.subject,m.message].join(' ').toLowerCase())}" data-st="">
      <td>${esc(new Date(m.created_at).toLocaleString('en-KE'))}</td><td>${esc(m.name)}<br><small>${esc(m.email)}</small></td><td>${esc(m.subject)}</td><td class="pre">${esc(m.message)}</td>
      <td class="ac">${m.is_read?'':`<button class="lnk" data-a="read" data-id="${m.id}">Mark read</button>`}<a class="lnk" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: '+m.subject)}">Reply</a><button class="lnk del" data-a="del-msg" data-id="${m.id}">Delete</button></td></tr>`).join(''))
};
function render(){
  document.querySelectorAll('[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===(S.view==='client'?'clients':S.view)));
  const u=S.messages.filter(m=>!m.is_read).length;$('#tm').textContent=u?`Messages (${u})`:'Messages';
  $('#app').innerHTML=views[S.view]();
}

/* ---------- events ---------- */
const find=(a,id)=>S[a].find(x=>x.id===id);
const A={
  'add-client':()=>clientForm(),'edit-client':id=>clientForm(find('clients',id)),'del-client':id=>del('clients',id,'Delete this client AND all their jobs and logs?'),
  open:id=>{S.cid=id;S.view='client';render();scrollTo(0,0)},back:()=>{S.view='clients';render()},
  'add-job':()=>jobForm(S.view==='client'?{client_id:S.cid}:{}),'edit-job':id=>jobForm(find('jobs',id)),'del-job':id=>del('jobs',id),
  pay:id=>{const j=find('jobs',id),a=Number(prompt(`Payment received (balance ${kes(bal(j))}):`));if(a>0)save('jobs',{amount_paid:Number(j.amount_paid)+a},id)},
  'add-log':()=>logForm(S.view==='client'?{client_id:S.cid}:{}),'edit-log':id=>logForm(find('logs',id)),'del-log':id=>del('client_logs',id),
  read:id=>save('messages',{is_read:true},id),'del-msg':id=>del('messages',id)
};
$('#app').onclick=e=>{const t=e.target.closest('[data-a]');if(!t)return;e.preventDefault();A[t.dataset.a](t.dataset.id)};
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{S.view=b.dataset.v;render()});
function filt(){const q=($('.q')?.value||'').toLowerCase(),s=$('.sf')?.value||'';
  document.querySelectorAll('#app tbody tr').forEach(r=>r.hidden=!(r.dataset.s.includes(q)&&(!s||r.dataset.st===s)))}
$('#app').oninput=$('#app').onchange=e=>{if(e.target.matches('.q,.sf'))filt()};
init();
