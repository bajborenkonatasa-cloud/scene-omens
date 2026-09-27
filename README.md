# Scene Omens — Fate Engine

Independent SillyTavern roleplay story director.

## v0.3.0 — Director Brain
- Context-aware omens for the whole world: char, user-facing circumstances, family, children, parents, siblings, established NPCs, institutions and world events.
- User character agency is protected: the engine never decides the user's thoughts, feelings, dialogue or actions.
- Three spoiler-light visible choices each carry a hidden concrete director thread. Only the chosen thread becomes canonical.
- Unchosen threads are explicitly discarded.
- Active threads are allowed to emerge later and adapt to intervening events.
- Frequency and maximum intensity controls.
- Skip remains fully non-canonical.

## Required Regex
Search regex:
```
\[OMEN\|([^|~\]]+)~([^|~\]]+)~([^|\]]+)\|([^|~\]]+)~([^|~\]]+)~([^|\]]+)\|([^|~\]]+)~([^|~\]]+)~([^|\]]+)\]
```

Replace with:
```html
<div class="scene-omens"><div class="so-head">✦ З Н А М Е Н И Я &nbsp; С Ц Е Н Ы ✦</div><div class="so-hint">между строками — выбери или пропусти</div><div class="so-row"><div class="so-card" data-omen="$1"><span class="so-omen-title">$1</span><span class="so-omen-hint">$2</span><span class="so-omen-thread">$3</span></div><div class="so-card" data-omen="$4"><span class="so-omen-title">$4</span><span class="so-omen-hint">$5</span><span class="so-omen-thread">$6</span></div><div class="so-card" data-omen="$7"><span class="so-omen-title">$7</span><span class="so-omen-hint">$8</span><span class="so-omen-thread">$9</span></div></div></div>
```

The Director Brain prompt is injected by the extension while enabled, so the old standalone `[SCENE OMENS]` preset is no longer required. Keep the Regex enabled so the model tag becomes the card UI.
