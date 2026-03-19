import { db, configRef, unitsRef, membersRef, sessionsRef, tasksRef, docsRef, esc, sortByDate, ownersLabel, sessionName, unitLabel, toArray, mapById } from "./common.js";
import { onValue, push, set, remove, update, ref } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
let state = {config:{eventTitle:"Cronograma de pista",logos:{}}, units:[], members:[], sessions:[], tasks:[], docs:[]};
const qs = id => document.getElementById(id);
function renderOwnersChecklist(){ qs('taskOwners').innerHTML = state.members.map(m => `<label class="checkitem"><input type="checkbox" value="${m.id}"> <span>${esc(m.name)} • ${esc(m.role)}</span></label>`).join(''); }
function getSelectedOwners(){ return [...document.querySelectorAll('#taskOwners input[type=checkbox]:checked')].map(x => x.value); }
function renderDocsChecklist(){ qs('docPermissions').innerHTML = state.members.map(m => `<label class="checkitem"><input type="checkbox" value="${m.id}"> <span>${esc(m.name)} • ${esc(m.role)}</span></label>`).join(''); }
function getSelectedDocPermissions(){ return [...document.querySelectorAll('#docPermissions input[type=checkbox]:checked')].map(x => x.value); }
function memberLink(memberId){ const url = new URL(window.location.href); return url.href.replace(/index_admin\.html.*$/, `membro.html?member=${encodeURIComponent(memberId)}`); }
function renderQr(){ const sel = qs('memberQrSelect'); if(!sel || !sel.value) return; const link = memberLink(sel.value); qs('memberQrLink').textContent = link; qs('memberQr').innerHTML = ''; new QRCode(qs('memberQr'), {text: link, width:180, height:180}); }
function render(){ const unitsMap = mapById(state.units), membersMap = mapById(state.members), sessionsMap = mapById(state.sessions);
qs('eventTitleView').textContent = state.config.eventTitle || 'Cronograma de pista'; qs('eventTitleInput').value = state.config.eventTitle || 'Cronograma de pista';
qs('logoLeftPath').value = state.config.logos?.left || ''; qs('logoRightPath').value = state.config.logos?.right || '';
qs('logoLeftPreview').innerHTML = state.config.logos?.left ? `<img src="${state.config.logos.left}" style="max-width:100%;max-height:100%">` : 'Sem logo';
qs('logoRightPreview').innerHTML = state.config.logos?.right ? `<img src="${state.config.logos.right}" style="max-width:100%;max-height:100%">` : 'Sem logo';
qs('statUnits').textContent = state.units.length; qs('statTasks').textContent = state.tasks.length; qs('statPending').textContent = state.tasks.filter(t => t.status !== 'concluida').length; qs('statDone').textContent = state.tasks.filter(t => t.status === 'concluida').length;
qs('unitsList').innerHTML = state.units.map(u => `<div class="listItem"><div><div style="font-weight:700">${esc(u.type==='car' ? `Carro ${u.number}` : u.name)}</div><div class="small">${u.type==='car' ? esc(u.driver || '') : ''}</div></div><button class="btn sm" data-del-unit="${u.id}">Excluir</button></div>`).join('');
qs('membersList').innerHTML = state.members.map(m => `<div class="listItem"><div><div style="font-weight:700">${esc(m.name)}</div><div class="small">${esc(m.role)}</div></div><button class="btn sm" data-del-member="${m.id}">Excluir</button></div>`).join('');
qs('sessionsList').innerHTML = sortByDate(state.sessions, 'start').map(s => `<div class="listItem"><div><div style="font-weight:700">${esc(s.name)}</div><div class="small">${new Date(s.start).toLocaleString('pt-BR')} até ${new Date(s.end).toLocaleString('pt-BR')}</div></div><button class="btn sm" data-del-session="${s.id}">Excluir</button></div>`).join('');
qs('taskUnit').innerHTML = state.units.map(u => `<option value="${u.id}">${esc(u.type==='car' ? `Carro ${u.number}` : u.name)}</option>`).join('');
qs('taskSession').innerHTML = '<option value="">Sem sessão</option>' + state.sessions.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
qs('memberQrSelect').innerHTML = state.members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
renderOwnersChecklist(); renderQr(); renderDocsChecklist();
qs('tasksList').innerHTML = sortByDate(state.tasks,'due').map(t => `<div class="listItem"><div><div style="font-weight:700">${esc(t.title)}</div><div class="small">${esc(unitLabel(unitsMap,t.unitId))} • ${esc(ownersLabel(membersMap,t.ownerIds||[]))} • ${esc(sessionName(sessionsMap,t.sessionId))}</div><div class="small">${new Date(t.due).toLocaleString('pt-BR')}</div>${t.lastUpdatedBy?`<div class="small">Última conclusão por: ${esc(t.lastUpdatedBy)}</div>`:''}</div><div class="row"><span class="badge">${esc(t.status||'pendente')}</span><button class="btn sm" data-del-task="${t.id}">Excluir</button></div></div>`).join('');
qs('docsList').innerHTML = state.docs.map(d => `<div class="listItem"><div><div style="font-weight:700">${esc(d.name)}</div><div class="small">Liberado para: ${esc(ownersLabel(membersMap,d.allowedMemberIds||[]))}</div><div class="small"><a href="${d.url}" target="_blank">Abrir PDF</a></div></div><button class="btn sm" data-del-doc="${d.id}">Excluir</button></div>`).join('');
document.querySelectorAll('[data-del-unit]').forEach(b => b.onclick = () => remove(ref(db, `stockcar/units/${b.dataset.delUnit}`)));
document.querySelectorAll('[data-del-member]').forEach(b => b.onclick = () => remove(ref(db, `stockcar/members/${b.dataset.delMember}`)));
document.querySelectorAll('[data-del-session]').forEach(b => b.onclick = () => remove(ref(db, `stockcar/sessions/${b.dataset.delSession}`)));
document.querySelectorAll('[data-del-task]').forEach(b => b.onclick = () => remove(ref(db, `stockcar/tasks/${b.dataset.delTask}`)));
document.querySelectorAll('[data-del-doc]').forEach(b => b.onclick = () => remove(ref(db, `stockcar/documents/${b.dataset.delDoc}`))); }
window.addEventListener('load', () => {
onValue(configRef, snap => { state.config = snap.val() || {eventTitle:'Cronograma de pista',logos:{}}; render(); });
onValue(unitsRef, snap => { state.units = toArray(snap.val()); render(); });
onValue(membersRef, snap => { state.members = toArray(snap.val()); render(); });
onValue(sessionsRef, snap => { state.sessions = toArray(snap.val()); render(); });
onValue(tasksRef, snap => { state.tasks = toArray(snap.val()); render(); });
onValue(docsRef, snap => { state.docs = toArray(snap.val()); render(); });
qs('memberQrSelect').onchange = renderQr;
qs('eventTitleInput').oninput = e => update(configRef, {eventTitle:e.target.value});
qs('unitType').onchange = e => { qs('carFields').style.display = e.target.value === 'car' ? 'block' : 'none'; qs('otherFields').style.display = e.target.value === 'other' ? 'block' : 'none'; };
qs('saveLogos').onclick = () => update(configRef, {logos:{left:qs('logoLeftPath').value.trim(), right:qs('logoRightPath').value.trim()}});
qs('saveUnit').onclick = () => { const type = qs('unitType').value; const payload = {type, headerBg:qs('unitBg').value, carTextColor:qs('unitTextColor').value, pilotColor:qs('unitPilotColor').value}; if(type === 'car'){ if(!qs('unitNumber').value.trim() || !qs('unitDriver').value.trim()) return alert('Preencha carro e piloto'); payload.number = qs('unitNumber').value.trim(); payload.driver = qs('unitDriver').value.trim(); } else { if(!qs('unitName').value.trim()) return alert('Preencha o nome da coluna'); payload.name = qs('unitName').value.trim(); } set(push(unitsRef), payload); };
qs('saveMember').onclick = () => { if(!qs('memberName').value.trim() || !qs('memberRole').value.trim()) return alert('Preencha nome e função'); set(push(membersRef), {name:qs('memberName').value.trim(), role:qs('memberRole').value.trim()}); };
qs('saveSession').onclick = () => { if(!qs('sessionName').value.trim() || !qs('sessionStart').value || !qs('sessionEnd').value) return alert('Preencha a sessão'); set(push(sessionsRef), {name:qs('sessionName').value.trim(), start:qs('sessionStart').value, end:qs('sessionEnd').value}); };
qs('saveTask').onclick = () => { const ownerIds = getSelectedOwners(); if(!qs('taskTitle').value.trim() || ownerIds.length===0 || !qs('taskUnit').value || !qs('taskDue').value) return alert('Preencha título, responsáveis, coluna e horário'); set(push(tasksRef), { title:qs('taskTitle').value.trim(), description:qs('taskDesc').value.trim(), ownerIds, unitId:qs('taskUnit').value, sessionId:qs('taskSession').value, due:qs('taskDue').value, status:'pendente', type:'individual', lastUpdatedBy:'' }); };
qs('saveDoc').onclick = () => { const name = qs('docName').value.trim(), url = qs('docPath').value.trim(), allowedMemberIds = getSelectedDocPermissions(); if(!name || !url) return alert('Preencha nome e caminho do PDF'); set(push(docsRef), {name, url, allowedMemberIds}); };
});