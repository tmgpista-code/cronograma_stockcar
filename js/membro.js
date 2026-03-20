import { configRef, membersRef, sessionsRef, tasksRef, docsRef, unitsRef, esc, sortByDate, countdown, ownersLabel, unitLabel, toArray, mapById, setTaskStatus } from "./common.js";
import { onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

let state = {config:{eventTitle:'Cronograma de pista'}, members:[], sessions:[], tasks:[], docs:[], units:[]};
let selectedMemberId = '';

function qs(id){ return document.getElementById(id); }

function getMemberFromUrl(){
  return new URLSearchParams(window.location.search).get('member') || '';
}

function setupTabs(){
  document.querySelectorAll('.tabBtn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tabBtn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tabPanel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });
}

function buildBase(){
  qs('eventTitleView').textContent = state.config.eventTitle || 'Cronograma de pista';
  const urlMember = getMemberFromUrl();
  if(urlMember) selectedMemberId = urlMember;
  if(!selectedMemberId) selectedMemberId = state.members[0]?.id || '';

  const sel = qs('memberSelect');
  sel.innerHTML = state.members.map(m => `<option value="${m.id}">${esc(m.name)} • ${esc(m.role)}</option>`).join('');
  if(selectedMemberId) sel.value = selectedMemberId;

  if(urlMember){
    sel.disabled = true;
  } else {
    sel.disabled = false;
    sel.onchange = function(){
      selectedMemberId = this.value;
      renderPanels();
    };
  }
}

function concludeTask(taskId){
  const member = state.members.find(m => m.id === selectedMemberId);
  setTaskStatus(taskId,'concluida', member ? member.name : '');
}

function renderPanels(){
  const unitsMap = mapById(state.units);
  const membersMap = mapById(state.members);

  const tasks = sortByDate(
    state.tasks.filter(t => (t.ownerIds||[]).includes(selectedMemberId) && t.status !== 'concluida'),
    'due'
  );

  const nxt = tasks[0];
  qs('nextTaskBox').textContent = nxt ? nxt.title : 'Nenhuma tarefa encontrada';

  if(nxt){
    const c = countdown(nxt.due,nxt.status);
    qs('heroTaskTitle').textContent = nxt.title;
    qs('heroTaskMeta').textContent = `${unitLabel(unitsMap,nxt.unitId)} • ${ownersLabel(membersMap,nxt.ownerIds||[])}`;
    qs('heroTaskCountdown').textContent = c.text;
    qs('heroTaskCountdown').className = `heroCountdown ${c.cls}`;
  } else {
    qs('heroTaskTitle').textContent = 'Nenhuma tarefa encontrada';
    qs('heroTaskMeta').textContent = '';
    qs('heroTaskCountdown').textContent = 'SEM TAREFA';
    qs('heroTaskCountdown').className = 'heroCountdown gray';
  }

  qs('memberTasks').innerHTML = tasks.length
    ? tasks.map(t => {
        const c = countdown(t.due,t.status);
        return `<div class="task">
          <div style="font-weight:700;font-size:18px">${esc(t.title)}</div>
          <div class="small" style="margin-top:4px">${esc(unitLabel(unitsMap,t.unitId))}</div>
          <div class="small">Responsáveis: ${esc(ownersLabel(membersMap,t.ownerIds||[]))}</div>
          <div class="count ${c.cls}">${c.text}</div>
          <div class="muted" style="margin-top:6px">${esc(t.description||'')}</div>
          <div style="margin-top:10px"><button class="btn sm dark" data-conclude="${t.id}">Concluir tarefa</button></div>
        </div>`;
      }).join('')
    : '<div class="task muted">Nenhuma tarefa pendente.</div>';

  document.querySelectorAll('[data-conclude]').forEach(b => {
    b.onclick = () => concludeTask(b.dataset.conclude);
  });

  qs('sessionsPanel').innerHTML = sortByDate(state.sessions,'start').map(s => {
    const c = countdown(s.start,null,'session');
    return `<div class="task">
      <div style="font-weight:700;font-size:18px">${esc(s.name)}</div>
      <div class="small">${new Date(s.start).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} - ${new Date(s.end).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
      <div class="count ${c.cls}">${c.text}</div>
    </div>`;
  }).join('');

  const docs = state.docs.filter(d => (d.allowedMemberIds||[]).includes(selectedMemberId));
  qs('docsPanel').innerHTML = docs.length
    ? docs.map(d => `<div class="docCard">
        <div style="font-weight:700">${esc(d.name)}</div>
        <div style="margin-top:8px"><a class="btn sm" href="${d.url}" target="_blank">Abrir PDF</a></div>
      </div>`).join('')
    : '<div class="task muted">Nenhum documento liberado para este membro.</div>';
}

window.addEventListener('load', ()=>{
  setupTabs();

  onValue(configRef, s => { state.config = s.val() || state.config; buildBase(); renderPanels(); });
  onValue(membersRef, s => { state.members = toArray(s.val()); buildBase(); renderPanels(); });
  onValue(sessionsRef, s => { state.sessions = toArray(s.val()); renderPanels(); });
  onValue(tasksRef, s => { state.tasks = toArray(s.val()); renderPanels(); });
  onValue(docsRef, s => { state.docs = toArray(s.val()); renderPanels(); });
  onValue(unitsRef, s => { state.units = toArray(s.val()); renderPanels(); });
});
