const MODULE = 'scene-omens';
const PROMPT_KEY = 'scene_omens_active_fate';
let activeOmen = null;

function ctx(){ try { return SillyTavern.getContext(); } catch { return {}; } }
function chatKey(){ const c=ctx(); return String(c.chatId ?? c.characterId ?? location.pathname); }
function storageKey(){ return `${MODULE}:${chatKey()}`; }
function loadState(){ try { activeOmen=JSON.parse(localStorage.getItem(storageKey())||'null'); } catch { activeOmen=null; } syncPrompt(); }
function saveState(){ try { localStorage.setItem(storageKey(), JSON.stringify(activeOmen)); } catch {} syncPrompt(); }
function syncPrompt(){
  const c=ctx(); if(typeof c.setExtensionPrompt!=='function') return;
  if(!activeOmen){ try{ c.setExtensionPrompt(PROMPT_KEY,'',0,0); }catch{} return; }
  const p=`[SCENE OMEN — ACTIVE]\nThe user blindly chose the omen: ${activeOmen.value}. Treat only this chosen omen as an active possible story thread. Develop it naturally when appropriate; do not force it into the next reply, do not reveal a plan or meta commentary, and never control the user's character. The two unchosen omens are not canon.`;
  try { c.setExtensionPrompt(PROMPT_KEY,p,0,0); } catch(e){ console.warn('[Scene Omens] prompt bridge unavailable',e); }
}
function hash(s){ let h=2166136261; for(const ch of s){h^=ch.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0; }
const arts=['gold.png','moon.png','forest.png'];
function artFor(v){ return new URL(`assets/cards/${arts[hash(v)%arts.length]}`, import.meta.url).href; }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function reveal(value, card, root){
  if(root.dataset.chosen==='1') return;
  root.dataset.chosen='1';
  root.querySelectorAll('.so-card').forEach(c=>{ if(c!==card)c.classList.add('so-faded'); });
  card.classList.add('so-picked');
  activeOmen={value,at:Date.now()}; saveState();
  const overlay=document.createElement('div'); overlay.className='so-overlay';
  overlay.innerHTML=`<div class="so-reveal"><img src="${artFor(value)}" alt=""><div class="so-glass"><div class="so-title">${escapeHtml(value)}</div><div class="so-sub">Знамение выбрано</div></div><div class="so-tap">коснись карты, чтобы продолжить</div></div>`;
  document.body.appendChild(overlay); requestAnimationFrame(()=>overlay.classList.add('show'));
  overlay.addEventListener('click',()=>{ overlay.classList.remove('show'); setTimeout(()=>overlay.remove(),360); root.classList.add('so-complete'); },{once:true});
}
function bind(){
  document.querySelectorAll('.scene-omens[data-so-ready!="1"]').forEach(root=>{
    root.dataset.soReady='1';
    root.querySelectorAll('.so-card').forEach(card=>card.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();reveal((card.dataset.omen||'').trim(),card,root);}));
  });
}
function observe(){ bind(); const mo=new MutationObserver(()=>bind()); mo.observe(document.body,{childList:true,subtree:true}); }
function events(){ const c=ctx(), es=c.eventSource, E=c.event_types||c.eventTypes; if(!es||!E)return; if(E.CHAT_CHANGED)es.on(E.CHAT_CHANGED,()=>{loadState();setTimeout(bind,50)}); }
function init(){ loadState(); observe(); events(); console.info('[Scene Omens] ready'); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
