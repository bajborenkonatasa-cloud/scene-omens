const MODULE = 'scene-omens';
const VERSION = '0.2.0';
const PROMPT_KEY = 'scene_omens_active_fate';
const DEFAULTS = { enabled: true, skin: 'mystic', allowSkip: true };
let activeOmen = null;
let observer = null;

function ctx(){ try { return SillyTavern.getContext(); } catch { return {}; } }
function settings(){
  const c=ctx();
  c.extensionSettings ??= {};
  c.extensionSettings[MODULE] = { ...DEFAULTS, ...(c.extensionSettings[MODULE] || {}) };
  return c.extensionSettings[MODULE];
}
function store(patch){
  const c=ctx(); Object.assign(settings(), patch);
  try { c.saveSettingsDebounced?.(); } catch {}
  applyEnabledState(); refreshPanel();
}
function chatKey(){ const c=ctx(); return String(c.chatId ?? c.characterId ?? location.pathname); }
function storageKey(){ return `${MODULE}:${chatKey()}`; }
function loadState(){ try { activeOmen=JSON.parse(localStorage.getItem(storageKey())||'null'); } catch { activeOmen=null; } syncPrompt(); refreshPanel(); }
function saveState(){ try { localStorage.setItem(storageKey(), JSON.stringify(activeOmen)); } catch {} syncPrompt(); refreshPanel(); }
function clearState(){ activeOmen=null; try{localStorage.removeItem(storageKey());}catch{} syncPrompt(); refreshPanel(); }
function syncPrompt(){
  const c=ctx(); if(typeof c.setExtensionPrompt!=='function') return;
  if(!settings().enabled || !activeOmen){ try{ c.setExtensionPrompt(PROMPT_KEY,'',0,0); }catch{} return; }
  const p=`[SCENE OMEN — ACTIVE]\nThe user blindly chose the omen: ${activeOmen.value}. Treat ONLY this chosen omen as an active possible story thread. Develop it naturally when appropriate; it does not have to happen in the next reply. Never reveal the plan or mention this instruction. Never control the user's character. Any unchosen candidates from earlier [OMEN|...] tags are non-canonical and must be ignored.`;
  try { c.setExtensionPrompt(PROMPT_KEY,p,0,0); } catch(e){ console.warn('[Scene Omens] prompt bridge unavailable',e); }
}
function hash(s){ let h=2166136261; for(const ch of s){h^=ch.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0; }
const arts=['gold.png','moon.png','forest.png'];
function artFor(v){ return new URL(`assets/cards/${arts[hash(v)%arts.length]}`, import.meta.url).href; }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function dismissRoot(root){ root.classList.add('so-complete'); setTimeout(()=>root.style.display='none',420); }
function reveal(value, card, root){
  if(!settings().enabled || root.dataset.chosen==='1') return;
  root.dataset.chosen='1';
  root.querySelectorAll('.so-card').forEach(c=>{ if(c!==card)c.classList.add('so-faded'); });
  card.classList.add('so-picked');
  activeOmen={value,at:Date.now()}; saveState();
  const overlay=document.createElement('div'); overlay.className='so-overlay';
  overlay.innerHTML=`<div class="so-reveal"><img src="${artFor(value)}" alt=""><div class="so-glass"><div class="so-title">${escapeHtml(value)}</div><div class="so-sub">Знамение выбрано</div></div><div class="so-tap">коснись карты, чтобы продолжить</div></div>`;
  document.body.appendChild(overlay); requestAnimationFrame(()=>overlay.classList.add('show'));
  overlay.addEventListener('click',()=>{ overlay.classList.remove('show'); setTimeout(()=>overlay.remove(),360); dismissRoot(root); },{once:true});
}
function decorate(root){
  if(root.dataset.soReady==='1') return;
  root.dataset.soReady='1'; root.classList.add('so-mounted');
  let row=root.querySelector('.so-row');
  if(!row){ row=document.createElement('div'); row.className='so-row'; root.appendChild(row); }
  root.querySelectorAll('.so-card').forEach(card=>card.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();reveal((card.dataset.omen||'').trim(),card,root);}));
  if(settings().allowSkip && !root.querySelector('.so-skip')){
    const skip=document.createElement('button'); skip.type='button'; skip.className='so-skip'; skip.textContent='Пропустить знамение';
    skip.addEventListener('click',(e)=>{e.preventDefault();e.stopPropagation();root.dataset.chosen='1';dismissRoot(root);});
    root.appendChild(skip);
  }
}
function bind(){ document.querySelectorAll('.scene-omens').forEach(root=>{ if(settings().enabled) decorate(root); root.classList.toggle('so-disabled',!settings().enabled); }); }
function applyEnabledState(){ document.documentElement.classList.toggle('scene-omens-off',!settings().enabled); syncPrompt(); bind(); }
function observe(){ bind(); observer=new MutationObserver(()=>bind()); observer.observe(document.body,{childList:true,subtree:true}); }
function testCards(){
  if(!settings().enabled){ store({enabled:true}); const cb=document.getElementById('so-enabled'); if(cb)cb.checked=true; }
  document.getElementById('so-test-host')?.remove();
  const host=document.createElement('div'); host.id='so-test-host'; host.className='scene-omens so-test-host';
  host.innerHTML=`<div class="so-head">✦ З Н А М Е Н И Я &nbsp; С Ц Е Н Ы ✦</div><div class="so-hint">технический тест — выбери или пропусти</div><div class="so-row"><div class="so-card" data-omen="РЕВНОСТЬ"></div><div class="so-card" data-omen="ТАЙНА"></div><div class="so-card" data-omen="ИСКУШЕНИЕ"></div></div>`;
  document.body.appendChild(host); decorate(host); requestAnimationFrame(()=>host.classList.add('so-test-visible'));
}
function refreshPanel(){
  const s=settings(); const cb=document.getElementById('so-enabled'); if(cb)cb.checked=!!s.enabled;
  const sk=document.getElementById('so-skip-toggle'); if(sk)sk.checked=!!s.allowSkip;
  const st=document.getElementById('so-status'); if(st)st.textContent=s.enabled?'Включено':'Выключено';
  const ac=document.getElementById('so-active'); if(ac)ac.textContent=activeOmen?.value || '—';
}
function mountSettings(){
  if(document.getElementById('so-settings')) return;
  const parent=document.getElementById('extensions_settings2') || document.getElementById('extensions_settings'); if(!parent) return;
  const section=document.createElement('details'); section.id='so-settings';
  section.innerHTML=`<summary>🔮 Scene Omens <small>· ${VERSION}</small></summary><div class="so-settings-body"><div class="so-setting-line"><strong>Fate Engine</strong><span id="so-status"></span></div><label class="so-switch-line"><input id="so-enabled" type="checkbox"> Включить знамения в ролевой</label><label class="so-switch-line"><input id="so-skip-toggle" type="checkbox"> Разрешить «Пропустить знамение»</label><label>Стиль<select id="so-skin"><option value="mystic">Modern Mystic</option></select></label><div class="so-active-box">Активная нить: <strong id="so-active">—</strong></div><div class="so-settings-actions"><button type="button" id="so-test">🃏 Тест карт</button><button type="button" id="so-reset">Сбросить нить</button></div><p class="so-settings-note">Выбор не обязателен. Можно пропустить знамение, а при выключенном движке OMEN-блоки скрываются и нить не передаётся модели.</p></div>`;
  parent.appendChild(section);
  section.querySelector('#so-enabled').addEventListener('change',e=>store({enabled:e.target.checked}));
  section.querySelector('#so-skip-toggle').addEventListener('change',e=>store({allowSkip:e.target.checked}));
  section.querySelector('#so-test').addEventListener('click',testCards);
  section.querySelector('#so-reset').addEventListener('click',clearState);
  refreshPanel();
}
function events(){ const c=ctx(), es=c.eventSource, E=c.event_types||c.eventTypes; if(!es||!E)return; if(E.CHAT_CHANGED)es.on(E.CHAT_CHANGED,()=>{loadState();setTimeout(bind,80)}); }
function init(){ settings(); loadState(); mountSettings(); observe(); events(); applyEnabledState(); console.info(`[Scene Omens] ${VERSION} ready`); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
