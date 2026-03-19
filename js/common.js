
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { firebaseConfig } from "../firebase-config.js";
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const unitsRef = ref(db, "stockcar/units");
export const membersRef = ref(db, "stockcar/members");
export const sessionsRef = ref(db, "stockcar/sessions");
export const tasksRef = ref(db, "stockcar/tasks");
export const docsRef = ref(db, "stockcar/documents");
export const configRef = ref(db, "stockcar/config");
export function esc(s){return String(s ?? "").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
export function sortByDate(items, field){return [...items].sort((a,b)=>new Date(a[field])-new Date(b[field]))}
export function countdown(target,status,mode){ if(status==='concluida') return {text:'CONCLUÍDA',cls:'gray'}; const diff=new Date(target)-new Date(); const late=diff<0, abs=Math.abs(diff); const h=Math.floor(abs/3600000), m=Math.floor(abs%3600000/60000), s=Math.floor(abs%60000/1000); if(mode==='session' && late) return {text:'INICIADO',cls:'red'}; const text=(late?'ATRASADO ':'')+[h,m,s].map(v=>String(v).padStart(2,'0')).join(':'); const cls=late?'red':diff<=300000?'amber':'green'; return {text,cls}; }
export function ownersLabel(membersMap, ids){return (ids||[]).map(id=>membersMap[id]?.name || id).join(', ')}
export function sessionName(sessionsMap,id){if(!id) return 'Sem sessão'; return sessionsMap[id]?.name || 'Sem sessão'}
export function unitLabel(unitsMap,id){const u=unitsMap[id]; if(!u) return 'Sem coluna'; return u.type==='car' ? `Carro ${u.number}` : u.name}
export function toArray(obj){return obj ? Object.entries(obj).map(([id,v])=>({id,...v})) : []}
export function mapById(arr){const m={}; arr.forEach(x=>m[x.id]=x); return m}
export function setTaskStatus(taskId,status,actor){ const taskRef = ref(db, `stockcar/tasks/${taskId}`); return update(taskRef, {status, lastUpdatedBy: actor || ''}); }
