'use strict';
// Public destinations configured in Restream; no streaming keys are needed here.
const liveChannel = 'UCMKSa-y173FFnY2Pq074dGA';
const clips = [
  { id: 'InYk4SZSELs', title: 'CorredorX · Apresentação', start: 0 },
  { id: 'Adu3f5xZrp0', title: 'Race Diary GT7 · Circuit Spa', start: 0 }
];
const tabs = [...document.querySelectorAll('[role="tab"]')];
const status = document.getElementById('highlight-status');
const pauseButton = document.getElementById('highlight-pause');
const nextButton = document.getElementById('highlight-next');
let player;
let currentClip = 0;
let poll;
let sdk;
let loadingClip = false;
let playbackStarted = false;

function mountLive(destination) {
  const container = document.getElementById(`${destination}-stream`);
  if (container.firstChild) return;
  const frame = document.createElement('iframe');
  frame.title = destination === 'youtube' ? 'Live do CorredorX no YouTube' : 'Live do CorredorX na Twitch';
  frame.src = destination === 'youtube'
    ? `https://www.youtube.com/embed/live_stream?channel=${liveChannel}&autoplay=0`
    : `https://player.twitch.tv/?channel=fv46__corred0x23&parent=${encodeURIComponent(location.hostname)}&autoplay=false&muted=true`;
  frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  container.append(frame);
}
function activateTab(tab) {
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
  });
  for (const destination of ['youtube', 'twitch']) {
    if (tab.id === `tab-${destination}`) mountLive(destination);
    else document.getElementById(`${destination}-stream`).replaceChildren();
  }
  if (tab.id !== 'tab-highlights' && player?.pauseVideo) player.pauseVideo();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); tabs[next].focus(); activateTab(tabs[next]); }
  });
});
function youtubeSDK() {
  if (window.YT?.Player) return Promise.resolve();
  if (sdk) return sdk;
  sdk = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 15000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timeout); resolve(); };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timeout); reject(new Error('network')); };
    document.head.append(script);
  });
  return sdk;
}
function selectClip(index) {
  currentClip = index;
  const clip = clips[index];
  document.querySelectorAll('[data-highlight]').forEach((card, i) => card.setAttribute('aria-pressed', String(i === index)));
  document.getElementById('highlight-original').href = `https://www.youtube.com/watch?v=${clip.id}&t=${clip.start}`;
  status.textContent = `${clip.title} · carregando trecho…`;
  playbackStarted = false;
  player.loadVideoById({ videoId: clip.id, startSeconds: clip.start, endSeconds: clip.start + 50 });
}
function advance() { selectClip((currentClip + 1) % clips.length); }
async function playClip(index) {
  if (loadingClip) return;
  if (player?.loadVideoById) { selectClip(index); return; }
  loadingClip = true;
  currentClip = index;
  status.textContent = 'Carregando player de highlights…';
  try {
    await youtubeSDK();
    player = new YT.Player('highlight-player', {
      width: '100%', height: '100%',
      playerVars: { playsinline: 1, rel: 0, origin: location.origin },
      events: {
        onReady: () => {
          loadingClip = false;
          pauseButton.disabled = false;
          nextButton.disabled = false;
          selectClip(currentClip);
          poll = setInterval(() => {
            if (player.getPlayerState() !== YT.PlayerState.PLAYING) return;
            const elapsed = player.getCurrentTime() - clips[currentClip].start;
            if (elapsed >= 50) { advance(); return; }
            status.textContent = `${clips[currentClip].title} · ${Math.max(0, Math.floor(elapsed))}/50s`;
          }, 250);
        },
        onStateChange: event => {
          if (event.data === YT.PlayerState.PLAYING) {
            playbackStarted = true;
            if (document.getElementById('panel-highlights').hidden || document.hidden) { player.pauseVideo(); return; }
          }
          pauseButton.textContent = event.data === YT.PlayerState.PLAYING ? 'Pausar' : 'Continuar';
          if (event.data === YT.PlayerState.ENDED && playbackStarted) advance();
        },
        onAutoplayBlocked: () => { status.textContent = 'Toque no play do vídeo para iniciar o trecho.'; },
        onError: () => { status.textContent = 'Este vídeo está indisponível no player. Escolha o próximo trecho ou abra o vídeo completo.'; }
      }
    });
  } catch {
    loadingClip = false;
    status.textContent = 'Não foi possível carregar o YouTube. Recarregue a página ou use o link do vídeo completo.';
  }
}
document.querySelectorAll('[data-highlight]').forEach(card => {
  card.setAttribute('aria-pressed', 'false');
  card.addEventListener('click', () => playClip(Number(card.dataset.highlight)));
});
pauseButton.addEventListener('click', () => {
  if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
});
nextButton.addEventListener('click', advance);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && player?.pauseVideo) player.pauseVideo();
});
window.addEventListener('pagehide', () => clearInterval(poll));
mountLive('youtube');
