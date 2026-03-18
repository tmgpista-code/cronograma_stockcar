
import { configRef, membersRef, sessionsRef, tasksRef, docsRef, unitsRef, esc, sortByDate, countdown, ownersLabel, unitLabel, toArray, mapById, setTaskStatus } from "./common.js";
import { onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

let state = {config:{eventTitle:'Cronograma de pista'}, members:[], sessions:[], tasks:[], docs:[], units:[]};
let selectedMemberId = '';
function getMemberFromUrl(){ return new URLSearchParams(window.location.search).get('member') || ''; }
function buildLayout(){
  document.getElementById('eventTitleView').textContent = state.config.eventTitle || 'Cronograma de pista';
  const urlMember = getMemberFromUrl();
  if(urlMember) selectedMemberId = urlMember;
  if(!selectedMemberId) selectedMemberId = state.members[0]?.id || '';
  document.getElementById('memberRoot').innerHTML = `<div class="grid2"><div class="card"><div class="title">Visão por membro da equipe</div><label>Selecione o membro</label><select id="memberSelect" ${urlMember?'disabled':''}></select><div id="memberTasks" style="margin-top:14px"></div></div><div class="card"><div class="title">Próximas sessões</div><div id="sessionsPanel"></div><div class="title" style="margin-top:16px">Documentos liberados</div><div id="docsPanel"></div></div></div>`;
  const sel = document.getElementById('memberSelect');
  sel.innerHTML = state.members.map(m => `<option value="${m.id}">${esc(m.name)} • ${esc(m.role)}</option>`).join('');
  sel.value = selectedMemberId;
  if(!urlMember){
    sel.onchange = function(){ selectedMemberId = this.value; renderPanels(); };
  }
}
function concludeTask(taskId){
  const member = state.members.find(m => m.id === selectedMemberId);
  setTaskStatus(taskId,'concluida', member ? member.name : '');
}
function renderPanels(){
  const unitsMap = mapById(state.units);
  const member = state.members.find(m => m.id === selectedMemberId);
  const tasks = sortByDate(state.tasks.filter(t => (t.ownerIds||[]).includes(selectedMemberId) && t.status !== 'concluida'),'due');
  const nxt = tasks[0];
  document.getElementById('memberTasks').innerHTML = `<div style="background:#f4f4f5;border-radius:14px;padding:12px;margin-bottom:10px"><div class="small">Próxima tarefa</div><div style="font-weight:700;font-size:22px">${nxt?esc(nxt.title):'Nenhuma tarefa encontrada'}</div>${nxt?`<div class="count ${countdown(nxt.due,nxt.status).cls}">${countdown(nxt.due,nxt.status).text}</div>`:'<div class="count gray">SEM TAREFA</div>'}</div>` + (tasks.length ? tasks.map(t => `<div class="task"><div style="font-weight:700">${esc(t.title)}</div><div class="small">${esc(unitLabel(unitsMap,t.unitId))}</div><div class="small">Responsáveis: ${esc(ownersLabel(mapById(state.members),t.ownerIds||[]))}</div><div class="count ${countdown(t.due,t.status).cls}" style="margin-top:8px">${countdown(t.due,t.status).text}</div><div class="muted" style="margin-top:6px">${esc(t.description||'')}</div><div class="row" style="margin-top:10px"><button class="btn sm" data-conclude="${t.id}">Concluir tarefa</button></div></div>`).join('') : '<div class="task muted">Nenhuma tarefa pendente.</div>');
  document.querySelectorAll('[data-conclude]').forEach(b => b.onclick = () => concludeTask(b.dataset.conclude));
  document.getElementById('sessionsPanel').innerHTML = sortByDate(state.sessions,'start').map(s => `<div class="task"><div style="font-weight:700">${esc(s.name)}</div><div class="small">${new Date(s.start).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} - ${new Date(s.end).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div><div class="count ${countdown(s.start,null,'session').cls}" style="margin-top:8px">${countdown(s.start,null,'session').text}</div></div>`).join('');
  const docs = state.docs.filter(d => (d.allowedMemberIds||[]).includes(selectedMemberId));
  document.getElementById('docsPanel').innerHTML = docs.length ? docs.map(d => `<div class="docCard"><div style="font-weight:700">${esc(d.name)}</div><div class="row" style="margin-top:8px"><a class="btn sm" href="${d.url}" target="_blank">Abrir PDF</a></div></div>`).join('') : '<div class="task muted">Nenhum documento liberado para este membro.</div>';
}
onValue(configRef, s => { state.config = s.val() || state.config; buildLayout(); renderPanels(); });
onValue(membersRef, s => { state.members = toArray(s.val()); buildLayout(); renderPanels(); });
onValue(sessionsRef, s => { state.sessions = toArray(s.val()); renderPanels(); });
onValue(tasksRef, s => { state.tasks = toArray(s.val()); renderPanels(); });
onValue(docsRef, s => { state.docs = toArray(s.val()); renderPanels(); });
onValue(unitsRef, s => { state.units = toArray(s.val()); renderPanels(); });
