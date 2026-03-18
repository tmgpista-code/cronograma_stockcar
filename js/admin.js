
import { db, configRef, unitsRef, membersRef, sessionsRef, tasksRef, docsRef, esc, sortByDate, ownersLabel, sessionName, unitLabel, toArray, mapById, uploadFile } from "./js/common.js";
import { onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

let state = {config:{eventTitle:"Cronograma de pista",logos:{}}, units:[], members:[], sessions:[], tasks:[], docs:[]};

function qs(id){ return document.getElementById(id); }
function renderOwnersChecklist(){
  qs('taskOwners').innerHTML = state.members.map(m => `<label class="checkitem"><input type="checkbox" value="${m.id}"> <span>${esc(m.name)} • ${esc(m.role)}</span></label>`).join('');
}
function getSelectedOwners(){
  return [...document.querySelectorAll('#taskOwners input[type=checkbox]:checked')].map(x => x.value);
}
function memberLink(memberId){
  const base = window.location.href.replace(/index_admin\.html.*$/, '');
  return `${base}membro.html?member=${encodeURIComponent(memberId)}`;
}
function renderQr(){
  const sel = qs('memberQrSelect');
  if(!sel || !sel.value) return;
  const link = memberLink(sel.value);
  qs('memberQrLink').textContent = link;
  qs('memberQr').innerHTML = '';
  new QRCode(qs('memberQr'), {text: link, width:180, height:180});
}
function renderDocsChecklist(){
  const docs = state.docs;
  const members = state.members;
  qs('docPermissions').innerHTML = members.map(m => `<label class="checkitem"><input type="checkbox" value="${m.id}"> <span>${esc(m.name)} • ${esc(m.role)}</span></label>`).join('');
}
function getSelectedDocPermissions(){
  return [...document.querySelectorAll('#docPermissions input[type=checkbox]:checked')].map(x => x.value);
}
function render(){
  const unitsMap = mapById(state.units);
  const membersMap = mapById(state.members);
  const sessionsMap = mapById(state.sessions);
  qs('eventTitleView').textContent = state.config.eventTitle || 'Cronograma de pista';
  qs('eventTitleInput').value = state.config.eventTitle || 'Cronograma de pista';
  qs('logoLeftPreview').innerHTML = state.config.logos?.left ? `<img src="${state.config.logos.left}" style="max-width:100%;max-height:100%">` : 'Sem logo';
  qs('logoRightPreview').innerHTML = state.config.logos?.right ? `<img src="${state.config.logos.right}" style="max-width:100%;max-height:100%">` : 'Sem logo';
  qs('statUnits').textContent = state.units.length;
  qs('statTasks').textContent = state.tasks.length;
  qs('statPending').textContent = state.tasks.filter(t => t.status !== 'concluida').length;
  qs('statDone').textContent = state.tasks.filter(t => t.status === 'concluida').length;
  qs('unitsList').innerHTML = state.units.map(u => `<div class="listItem"><div><div style="font-weight:700">${esc(u.type==='car' ? `Carro ${u.number}` : u.name)}</div><div class="small">${u.type==='car' ? esc(u.driver || '') : ''}</div></div><button class="btn sm" data-del-unit="${u.id}">Excluir</button></div>`).join('');
  qs('membersList').innerHTML = state.members.map(m => `<div class="listItem"><div><div style="font-weight:700">${esc(m.name)}</div><div class="small">${esc(m.role)}</div></div><button class="btn sm" data-del-member="${m.id}">Excluir</button></div>`).join('');
  qs('sessionsList').innerHTML = sortByDate(state.sessions, 'start').map(s => `<div class="listItem"><div><div style="font-weight:700">${esc(s.name)}</div><div class="small">${new Date(s.start).toLocaleString('pt-BR')} até ${new Date(s.end).toLocaleString('pt-BR')}</div></div><button class="btn sm" data-del-session="${s.id}">Excluir</button></div>`).join('');
  qs('taskUnit').innerHTML = state.units.map(u => `<option value="${u.id}">${esc(u.type==='car' ? `Carro ${u.number}` : u.name)}</option>`).join('');
  qs('taskSession').innerHTML = '<option value="">Sem sessão</option>' + state.sessions.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  qs('memberQrSelect').innerHTML = state.members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  renderOwnersChecklist();
  renderQr();
  renderDocsChecklist();
  qs('tasksList').innerHTML = sortByDate(state.tasks,'due').map(t => `<div class="listItem"><div><div style="font-weight:700">${esc(t.title)}</div><div class="small">${esc(unitLabel(unitsMap,t.unitId))} • ${esc(ownersLabel(membersMap,t.ownerIds||[]))} • ${esc(sessionName(sessionsMap,t.sessionId))}</div><div class="small">${new Date(t.due).toLocaleString('pt-BR')}</div>${t.lastUpdatedBy?`<div class="small">Última conclusão por: ${esc(t.lastUpdatedBy)}</div>`:''}</div><div class="row"><span class="badge">${esc(t.status||'pendente')}</span><button class="btn sm" data-del-task="${t.id}">Excluir</button></div></div>`).join('');
  qs('docsList').innerHTML = state.docs.map(d => `<div class="listItem"><div><div style="font-weight:700">${esc(d.name)}</div><div class="small">Liberado para: ${esc(ownersLabel(membersMap,d.allowedMemberIds||[]))}</div><div class="small">${d.url ? '<a href="'+d.url+'" target="_blank">Abrir PDF</a>' : ''}</div></div><button class="btn sm" data-del-doc="${d.id}">Excluir</button></div>`).join('');

  document.querySelectorAll('[data-del-unit]').forEach(b => b.onclick = () => remove(statePath('units', b.dataset.delUnit)));
  document.querySelectorAll('[data-del-member]').forEach(b => b.onclick = () => remove(statePath('members', b.dataset.delMember)));
  document.querySelectorAll('[data-del-session]').forEach(b => b.onclick = () => remove(statePath('sessions', b.dataset.delSession)));
  document.querySelectorAll('[data-del-task]').forEach(b => b.onclick = () => remove(statePath('tasks', b.dataset.delTask)));
  document.querySelectorAll('[data-del-doc]').forEach(b => b.onclick = () => remove(statePath('documents', b.dataset.delDoc)));
}
function statePath(section,id){
  return { units: unitsRef, members: membersRef, sessions: sessionsRef, tasks: tasksRef, documents: docsRef }[section] && { ...{_dummy:0} };
}
function dbPath(section,id){
  const { ref } = window.firebaseDbFns;
  const mapping = {units:'stockcar/units/', members:'stockcar/members/', sessions:'stockcar/sessions/', tasks:'stockcar/tasks/', documents:'stockcar/documents/'};
  return ref(db, mapping[section]+id);
}

window.addEventListener('load', () => {
  window.firebaseDbFns = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js");
  const { ref } = window.firebaseDbFns;
  onValue(configRef, snap => { state.config = snap.val() || {eventTitle:'Cronograma de pista',logos:{}}; render(); });
  onValue(unitsRef, snap => { state.units = toArray(snap.val()); render(); });
  onValue(membersRef, snap => { state.members = toArray(snap.val()); render(); });
  onValue(sessionsRef, snap => { state.sessions = toArray(snap.val()); render(); });
  onValue(tasksRef, snap => { state.tasks = toArray(snap.val()); render(); });
  onValue(docsRef, snap => { state.docs = toArray(snap.val()); render(); });

  qs('memberQrSelect').onchange = renderQr;
  qs('eventTitleInput').oninput = async e => update(configRef, {eventTitle:e.target.value});
  qs('unitType').onchange = e => {
    qs('carFields').style.display = e.target.value === 'car' ? 'block' : 'none';
    qs('otherFields').style.display = e.target.value === 'other' ? 'block' : 'none';
  };

  qs('saveUnit').onclick = async () => {
    const type = qs('unitType').value;
    const payload = {type, headerBg:qs('unitBg').value, carTextColor:qs('unitTextColor').value, pilotColor:qs('unitPilotColor').value};
    if(type === 'car'){
      if(!qs('unitNumber').value.trim() || !qs('unitDriver').value.trim()) return alert('Preencha carro e piloto');
      payload.number = qs('unitNumber').value.trim();
      payload.driver = qs('unitDriver').value.trim();
    } else {
      if(!qs('unitName').value.trim()) return alert('Preencha o nome da coluna');
      payload.name = qs('unitName').value.trim();
    }
    await set(push(unitsRef), payload);
  };
  qs('saveMember').onclick = async () => {
    if(!qs('memberName').value.trim() || !qs('memberRole').value.trim()) return alert('Preencha nome e função');
    await set(push(membersRef), {name:qs('memberName').value.trim(), role:qs('memberRole').value.trim()});
  };
  qs('saveSession').onclick = async () => {
    if(!qs('sessionName').value.trim() || !qs('sessionStart').value || !qs('sessionEnd').value) return alert('Preencha sessão');
    await set(push(sessionsRef), {name:qs('sessionName').value.trim(), start:qs('sessionStart').value, end:qs('sessionEnd').value});
  };
  qs('saveTask').onclick = async () => {
    const ownerIds = getSelectedOwners();
    if(!qs('taskTitle').value.trim() || ownerIds.length===0 || !qs('taskUnit').value || !qs('taskDue').value) return alert('Preencha título, responsáveis, coluna e horário');
    await set(push(tasksRef), {
      title:qs('taskTitle').value.trim(),
      description:qs('taskDesc').value.trim(),
      ownerIds,
      unitId:qs('taskUnit').value,
      sessionId:qs('taskSession').value,
      due:qs('taskDue').value,
      status:'pendente',
      type:'individual',
      lastUpdatedBy:''
    });
  };
  qs('uploadLeftLogo').onclick = async () => {
    const file = qs('leftLogoFile').files[0]; if(!file) return alert('Escolha o arquivo');
    const url = await uploadFile(file, 'logos');
    await update(configRef, {logos:{...(state.config.logos||{}), left:url}});
  };
  qs('uploadRightLogo').onclick = async () => {
    const file = qs('rightLogoFile').files[0]; if(!file) return alert('Escolha o arquivo');
    const url = await uploadFile(file, 'logos');
    await update(configRef, {logos:{...(state.config.logos||{}), right:url}});
  };
  qs('saveDoc').onclick = async () => {
    const file = qs('docFile').files[0]; if(!file) return alert('Escolha o PDF');
    const allowedMemberIds = getSelectedDocPermissions();
    const url = await uploadFile(file, 'docs');
    await set(push(docsRef), {name:qs('docName').value.trim() || file.name, url, allowedMemberIds});
  };
});
