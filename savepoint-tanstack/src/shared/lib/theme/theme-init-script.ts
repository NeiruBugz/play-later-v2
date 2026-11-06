// Pre-hydration theme script. Runs in <head> before React mounts to prevent
// FOUC. Must stay in sync with the hand-rolled ThemeProvider —
// theme value === CSS class name: light→"", dark→"dark", system→resolved via
// prefers-color-scheme. A stored retired theme (e.g. "cartridge") fails the
// validThemes check and falls back to 'system'. See DIVERGENCES.md → Slice 19
// for why this lives inline instead of inside `next-themes`.
export const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var validThemes=['light','dark','system'];var mode=validThemes.indexOf(stored)!==-1?stored:'system';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var classMap={light:'',dark:'dark'};var resolved=mode==='system'?(prefersDark?'dark':'light'):mode;var nextClass=classMap[resolved];var root=document.documentElement;root.classList.remove('dark');if(nextClass){root.classList.add(nextClass)}if(mode==='system'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=(resolved==='dark')?'dark':'light';}catch(e){}})();`;
