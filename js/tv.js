import { configRef, unitsRef, membersRef, sessionsRef, tasksRef, esc, sortByDate, countdown, ownersLabel, sessionName, toArray, mapById } from "./common.js";
import { onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

let state = {config:{eventTitle:'Cronograma de pista',logos:{}}, units:[], members:[], sessions:[], tasks:[]};

function setLogo(elId,url,placeholder){
  const el=document.getElementById(elId);
  if(url) el.innerHTML=`<img src="${url}" alt="logo">`;
  else el.textContent=placeholder;
}

function render(){
  const membersMap = mapById(state.members);
  const sessionsMap = mapById(state.sessions);

  setLogo('logoLeftBox', state.config.logos?.left, 'Logo esquerda');
  setLogo('logoRightBox', state.config.logos?.right, 'Logo direita');

  const ns = sortByDate(state.sessions,'start').find(s=>new Date(s.start)>new Date());
  const cs = state.sessions.find(s=>new Date()>=new Date(s.start)&&new Date()<=new Date(s.end));

  let html = `<div class="grid3">
    <div class="card">
      <div class="small">Horário atual</div>
      <div class="stat">${new Date().toLocaleTimeString('pt-BR')}</div>
    </div>
    <div class="card">
      <div class="small">Sessão atual</div>
      <div class="title">${cs?esc(cs.name):'Sem sessão em andamento'}</div>
    </div>
    <div class="card">
      <div class="small">Próxima sessão</div>
      <div class="title">${ns?esc(ns.name):'Sem próxima sessão'}</div>
      ${ns?`<div class="count ${countdown(ns.start,null,'session').cls}">${countdown(ns.start,null,'session').text}</div>`:''}
    </div>
  </div>`;

  html += `<div class="tvBoard" style="margin-top:14px">`;

  for(const unit of state.units){
    const visibleTasks = sortByDate(state.tasks.filter(t=>t.unitId===unit.id && t.status!=='concluida'),'due');
    const nxt = visibleTasks[0];
    const mainLabel = unit.type==='car' ? `Carro ${esc(unit.number)}` : esc(unit.name);
    const subLabel = unit.type==='car' ? `<div style="color:${esc(unit.pilotColor||'#ffffff')}">${esc(unit.driver||'')}</div>` : '';

    html += `<div class="card">
      <div class="headerBlock" style="background:${unit.headerBg||'#18181b'}">
        <div class="title" style="color:${unit.carTextColor||'#ffffff'};margin:0">${mainLabel}</div>
        ${subLabel}
      </div>

      <div style="background:#f4f4f5;border-radius:14px;padding:12px">
        <div class="small">Próxima tarefa da coluna</div>
        <div style="font-weight:700">${nxt?esc(nxt.title):'Sem tarefa'}</div>
        ${nxt?`<div class="count ${countdown(nxt.due,nxt.status).cls}">${countdown(nxt.due,nxt.status).text}</div>`:'<div class="count gray">SEM TAREFA</div>'}
      </div>

      ${visibleTasks.length
        ? visibleTasks.map(t=>`<div class="task">
            <div style="font-weight:700">${esc(t.title)}</div>
            <div class="small">Responsáveis: ${esc(ownersLabel(membersMap,t.ownerIds||[]))}</div>
            <div class="small">Sessão: ${esc(sessionName(sessionsMap,t.sessionId))}</div>
            <div class="count ${countdown(t.due,t.status).cls}" style="margin-top:8px">${countdown(t.due,t.status).text}</div>
          </div>`).join('')
        : '<div class="task muted">Nenhuma tarefa pendente para esta coluna.</div>'}
    </div>`;
  }

  html += `<div class="card rightCol">
    <div class="title">Regressivo das sessões</div>
    ${sortByDate(state.sessions,'start').map(s=>`<div class="task">
      <div style="font-weight:700">${esc(s.name)}</div>
      <div class="small">${new Date(s.start).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} - ${new Date(s.end).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
      <div class="count ${countdown(s.start,null,'session').cls}" style="margin-top:8px">${countdown(s.start,null,'session').text}</div>
    </div>`).join('')}
  </div>`;

  html += `</div>`;
  document.getElementById('tvRoot').innerHTML = html;
}

onValue(configRef, s => { state.config = s.val() || state.config; render(); });
onValue(unitsRef, s => { state.units = toArray(s.val()); render(); });
onValue(membersRef, s => { state.members = toArray(s.val()); render(); });
onValue(sessionsRef, s => { state.sessions = toArray(s.val()); render(); });
onValue(tasksRef, s => { state.tasks = toArray(s.val()); render(); });

setInterval(render, 1000);
