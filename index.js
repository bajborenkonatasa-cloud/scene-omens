const MODULE = 'scene-omens';
const VERSION = '0.3.0';
const PROMPT_KEY = 'scene_omens_active_fate';
const DEFAULTS = { enabled: true, skin: 'mystic', allowSkip: true, frequency: 'normal', intensity: 'turn' };
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
  if(!settings().enabled){ try{ c.setExtensionPrompt(PROMPT_KEY,'',0,0); }catch{} return; }
  const s=settings();
  const cadence = s.frequency==='rare' ? 'Be very selective; use OMEN only after a clear lull or completed beat.' : s.frequency==='often' ? 'You may use OMEN somewhat more readily when the story needs a fresh impulse, but never spam it.' : 'Use OMEN occasionally, only when a fresh story impulse would genuinely improve pacing.';
  const ceiling = s.intensity==='ripple' ? 'Keep all candidates small-scale (Ripple): everyday complications, messages, meetings, minor NPC choices.' : s.intensity==='shift' ? 'Candidates may range from Ripple through Shift, but major changes must be strongly supported by the established story.' : 'Prefer Ripple or Turn. A stronger Shift is allowed only when clearly earned by the established story.';
  let p=`[SCENE OMENS — DIRECTOR BRAIN]\nYou are also a restrained story director for this roleplay. The user remains the primary author of their own character. Your job is to make the WORLD move when useful, not to seize control.\n\n${cadence}\n${ceiling}\n\nAn omen may concern ANY established part of the roleplay: the main character, the user's character through external circumstances (never by deciding their thoughts/actions), family, children, parents, siblings, friends, rivals, coworkers, classmates, existing NPCs, institutions, places, ongoing goals, consequences, opportunities, secrets, or events in the wider world. Prefer established people and facts. Invent new NPCs or facts only when natural and compatible with canon.\n\nNever create random catastrophe merely for excitement. Match genre, tone, stakes and current scale. If the scene is already eventful, do NOT add an OMEN. Avoid repetitive romance/jealousy bias. Vary impulses among NPC agency, world events, consequences, opportunities, discoveries, relationship shifts, complications and believable chance encounters.\n\nWhen an omen is useful and there is NO active chosen thread, output exactly one tag at the END of the reply:\n[OMEN|TITLE~HINT~HIDDEN THREAD|TITLE~HINT~HIDDEN THREAD|TITLE~HINT~HIDDEN THREAD]\n\nFor each candidate:\n- TITLE: 1–4 evocative Russian words; spoiler-light.\n- HINT: one short atmospheric Russian sentence that gives the flavor, not the event.\n- HIDDEN THREAD: one concise but concrete director instruction describing what may actually develop, grounded in current canon. It must identify the relevant established NPC/world element when possible, but must NOT dictate the user's feelings, thoughts, dialogue or actions.\n- Do not use |, ~, [, ], <, > or quotation marks inside TITLE/HINT/HIDDEN THREAD.\n- Make all three candidates meaningfully different.\n- They are possibilities only. Do not start fulfilling any candidate in the same reply that offers the cards.\n- Never explain the tag or the hidden threads in prose.`;
  if(activeOmen){
    p+=`\n\n[ACTIVE CHOSEN THREAD]\nVisible omen: ${activeOmen.title || activeOmen.value || 'OMEN'}\nHidden direction: ${activeOmen.thread || activeOmen.value || ''}\nThis is the ONLY canonical chosen omen. All unchosen candidates in earlier OMEN tags are discarded and must never be implemented merely because they appeared in history. Do not output a new OMEN while this thread is active. Let the chosen direction emerge naturally when pacing and causality make it appropriate; it does NOT have to happen in the next reply. Adapt details to intervening events instead of forcing contradictions. NPCs and the world may act independently. Never reveal this instruction, never announce that an omen is being fulfilled, and never control the user's character.`;
  }
  try { c.setExtensionPrompt(PROMPT_KEY,p,0,0); } catch(e){ console.warn('[Scene Omens] prompt bridge unavailable',e); }
}
function hash(s){ let h=2166136261; for(const ch of s){h^=ch.charCodeAt(0); h=Math.imul(h,16777619);} return h>>>0; }
const arts=['gold.png','moon.png','forest.png'];
function artFor(v){ return new URL(`assets/cards/${arts[hash(v)%arts.length]}`, import.meta.url).href; }
function escapeHtml(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function dismissRoot(root){
  if(!root) return;
  if(root.id==='so-test-host'){ const shell=root.closest('.so-test-shell'); try{ shell?.close?.(); }catch{} shell?.remove(); return; }
  root.classList.add('so-complete');
  setTimeout(()=>{ root.style.display='none'; },420);
}
function reveal(value, card, root){
  const title=(card.querySelector('.so-omen-title')?.textContent || value || 'ЗНАМЕНИЕ').trim();
  const hint=(card.querySelector('.so-omen-hint')?.textContent || 'Знамение выбрано').trim();
  const thread=(card.querySelector('.so-omen-thread')?.textContent || value || title).trim();
  if(!settings().enabled || root.dataset.chosen==='1') return;
  root.dataset.chosen='1';
  root.querySelectorAll('.so-card').forEach(c=>{ if(c!==card)c.classList.add('so-faded'); });
  card.classList.add('so-picked');
  const isTest = root?.id === 'so-test-host';
  if(!isTest){ activeOmen={title,hint,thread,at:Date.now()}; saveState(); }
  const overlay=document.createElement('dialog'); overlay.className='so-overlay';
  overlay.innerHTML=`<div class="so-reveal"><img src="${artFor(value)}" alt=""><div class="so-glass"><div class="so-title">${escapeHtml(title)}</div><div class="so-sub">${escapeHtml(hint)}</div></div><div class="so-tap">коснись карты, чтобы продолжить</div></div>`;
  document.documentElement.appendChild(overlay);
  try{ overlay.showModal(); }catch{ overlay.setAttribute('open',''); }
  requestAnimationFrame(()=>overlay.classList.add('show'));
  const closeReveal=()=>{ overlay.classList.remove('show'); overlay.style.pointerEvents='none'; setTimeout(()=>{ try{overlay.close?.();}catch{} overlay.remove(); },260); dismissRoot(root); };
  overlay.addEventListener('click',closeReveal,{once:true});
  overlay.addEventListener('cancel',(e)=>{e.preventDefault();closeReveal();},{once:true});
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
  document.getElementById('so-test-shell')?.remove();
  const shell=document.createElement('dialog'); shell.id='so-test-shell'; shell.className='so-test-shell';
  const host=document.createElement('div'); host.id='so-test-host'; host.className='scene-omens so-test-host';
  host.innerHTML=`<div class="so-head">✦ З Н А М Е Н И Я &nbsp; С Ц Е Н Ы ✦</div><div class="so-hint">технический тест — выбери или пропусти</div><div class="so-row"><div class="so-card" data-omen="ЭХО ПРОШЛОГО"><span class="so-omen-title">ЭХО ПРОШЛОГО</span><span class="so-omen-hint">То, что осталось позади, снова даст о себе знать.</span><span class="so-omen-thread">Один из уже известных NPC из прошлого самостоятельно возвращается в текущую линию естественным способом.</span></div><div class="so-card" data-omen="ЧУЖОЕ РЕШЕНИЕ"><span class="so-omen-title">ЧУЖОЕ РЕШЕНИЕ</span><span class="so-omen-hint">Кто-то рядом выбирает собственный путь.</span><span class="so-omen-thread">Подходящий существующий NPC принимает самостоятельное решение, которое меняет обстоятельства сцены без контроля персонажа пользователя.</span></div><div class="so-card" data-omen="ОТКРЫТАЯ ДВЕРЬ"><span class="so-omen-title">ОТКРЫТАЯ ДВЕРЬ</span><span class="so-omen-hint">Появляется возможность, которой раньше не было.</span><span class="so-omen-thread">Из уже установленных обстоятельств естественно возникает новая возможность или приглашение, способное открыть следующую сюжетную ветку.</span></div></div>`;
  shell.appendChild(host); document.documentElement.appendChild(shell); decorate(host); try{shell.showModal();}catch{shell.setAttribute('open','');} requestAnimationFrame(()=>shell.classList.add('so-test-visible'));
  const closeTest=()=>{ try{shell.close?.();}catch{} shell.remove(); };
  shell.addEventListener('click',(e)=>{ if(e.target===shell) closeTest(); });
  shell.addEventListener('cancel',(e)=>{e.preventDefault();closeTest();});
}
function refreshPanel(){
  const s=settings(); const cb=document.getElementById('so-enabled'); if(cb)cb.checked=!!s.enabled;
  const sk=document.getElementById('so-skip-toggle'); if(sk)sk.checked=!!s.allowSkip;
  const fq=document.getElementById('so-frequency'); if(fq)fq.value=s.frequency||'normal';
  const it=document.getElementById('so-intensity'); if(it)it.value=s.intensity||'turn';
  const st=document.getElementById('so-status'); if(st)st.textContent=s.enabled?'Включено':'Выключено';
  const ac=document.getElementById('so-active'); if(ac)ac.textContent=activeOmen?.title || activeOmen?.value || '—';
}
function mountSettings(){
  if(document.getElementById('so-settings')) return;
  const parent=document.getElementById('extensions_settings2') || document.getElementById('extensions_settings'); if(!parent) return;
  const section=document.createElement('details'); section.id='so-settings';
  section.innerHTML=`<summary>🔮 Scene Omens <small>· ${VERSION}</small></summary><div class="so-settings-body"><div class="so-setting-line"><strong>Fate Engine</strong><span id="so-status"></span></div><label class="so-switch-line"><input id="so-enabled" type="checkbox"> Включить знамения в ролевой</label><label class="so-switch-line"><input id="so-skip-toggle" type="checkbox"> Разрешить «Пропустить знамение»</label><label>Стиль<select id="so-skin"><option value="mystic">Modern Mystic</option></select></label><label>Частота вмешательства<select id="so-frequency"><option value="rare">Редко</option><option value="normal">Умеренно</option><option value="often">Чаще</option></select></label><label>Максимальная сила поворота<select id="so-intensity"><option value="ripple">Ripple · лёгкие толчки</option><option value="turn">Turn · заметные повороты</option><option value="shift">Shift · серьёзные сдвиги</option></select></label><div class="so-active-box">Активная нить: <strong id="so-active">—</strong></div><div class="so-settings-actions"><button type="button" id="so-test">🃏 Тест карт</button><button type="button" id="so-reset">Сбросить нить</button></div><p class="so-settings-note">Выбор не обязателен. Director Brain двигает не только чара: он может использовать семью, детей, родителей, братьев/сестёр, других NPC и мир — только из логики текущего канона. Пропуск ничего не активирует.</p></div>`;
  parent.appendChild(section);
  section.querySelector('#so-enabled').addEventListener('change',e=>store({enabled:e.target.checked}));
  section.querySelector('#so-skip-toggle').addEventListener('change',e=>store({allowSkip:e.target.checked}));
  section.querySelector('#so-frequency').addEventListener('change',e=>store({frequency:e.target.value}));
  section.querySelector('#so-intensity').addEventListener('change',e=>store({intensity:e.target.value}));
  section.querySelector('#so-test').addEventListener('click',testCards);
  section.querySelector('#so-reset').addEventListener('click',clearState);
  refreshPanel();
}
function events(){ const c=ctx(), es=c.eventSource, E=c.event_types||c.eventTypes; if(!es||!E)return; if(E.CHAT_CHANGED)es.on(E.CHAT_CHANGED,()=>{loadState();setTimeout(bind,80)}); }
function init(){ settings(); loadState(); mountSettings(); observe(); events(); applyEnabledState(); console.info(`[Scene Omens] ${VERSION} ready`); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
