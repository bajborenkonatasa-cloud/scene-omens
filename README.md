# Scene Omens — Fate Engine

Independent SillyTavern roleplay extension.

v0.2.1: mobile viewport centering, safer phone sizing, lighter reveal glass.

v0.2.0: settings panel, master enable/disable switch, optional skip, active omen status/reset, built-in card test, fullscreen reveal, per-chat active fate prompt bridge.

Expected rendered markup: `.scene-omens` with three `.so-card` elements carrying `data-omen` values.


## 0.2.2
Mobile modal centering fix; test overlay is isolated and fully removed on skip/close; test choices no longer overwrite the active story omen.


### 0.2.3
Android/WebView top-layer fix: test chooser and reveal now use native modal dialogs, so RP Glass/SillyTavern transforms cannot pin them to the top or leave invisible click-blocking layers.
