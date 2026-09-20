export interface VersionInfo {
  version: string;
  buildTime: number;
  builtAt?: string;
}

export const CURRENT_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
export const CURRENT_BUILD_TIME: number = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0;

let isChecking = false;
let updateFound = false;
let lastDismissedBuild = 0;

const STYLES = `
.game-update-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(18, 16, 26, 0.96);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid #ff4d2a;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 77, 42, 0.35);
  padding: 10px 16px;
  color: #f0e6d3;
  font-family: 'Exo 2', sans-serif;
  max-width: min(92vw, 480px);
  width: max-content;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.game-update-toast.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}
.update-toast-icon {
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: updatePulse 1.8s infinite ease-in-out;
}
@keyframes updatePulse {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px #ffb800); }
  50% { transform: scale(1.15); filter: drop-shadow(0 0 10px #ff4d2a); }
}
.update-toast-content {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.update-toast-title {
  font-family: 'Russo One', sans-serif;
  font-size: 13px;
  color: #ffb800;
  letter-spacing: 0.5px;
}
.update-toast-msg {
  font-size: 11px;
  color: #9a94a6;
  margin-top: 2px;
  line-height: 1.3;
}
.update-toast-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.update-toast-btn-reload {
  background: linear-gradient(135deg, #ff4d2a, #ffb800);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-family: 'Russo One', sans-serif;
  font-size: 11px;
  padding: 6px 14px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(255, 77, 42, 0.4);
  white-space: nowrap;
  transition: transform 0.15s, opacity 0.15s;
}
.update-toast-btn-reload:active {
  transform: scale(0.95);
  opacity: 0.9;
}
.update-toast-btn-dismiss {
  background: transparent;
  border: 1px solid #2a2636;
  border-radius: 6px;
  color: #9a94a6;
  font-size: 12px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.update-toast-btn-dismiss:hover {
  color: #f0e6d3;
  border-color: #ff4d2a;
}
`;

function injectStyles() {
  if (document.getElementById('versionCheckerStyles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'versionCheckerStyles';
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);
}

function createToastElement(info: VersionInfo): HTMLElement {
  let toast = document.getElementById('gameUpdateNotification');
  if (toast) return toast;

  injectStyles();

  toast = document.createElement('div');
  toast.id = 'gameUpdateNotification';
  toast.className = 'game-update-toast';
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <div class="update-toast-icon">🚀</div>
    <div class="update-toast-content">
      <div class="update-toast-title">Доступно обновление игры!</div>
      <div class="update-toast-msg">Свежая версия уже на сервере. Перезагрузите страницу.</div>
    </div>
    <div class="update-toast-actions">
      <button class="update-toast-btn-reload" id="updateToastReloadBtn">Обновить</button>
      <button class="update-toast-btn-dismiss" id="updateToastDismissBtn" title="Закрыть" aria-label="Закрыть">✕</button>
    </div>
  `;

  document.body.appendChild(toast);

  const reloadBtn = toast.querySelector('#updateToastReloadBtn');
  reloadBtn?.addEventListener('click', () => {
    // Force cache-busting reload
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_v', Date.now().toString());
    window.location.href = currentUrl.toString();
  });

  const dismissBtn = toast.querySelector('#updateToastDismissBtn');
  dismissBtn?.addEventListener('click', () => {
    toast?.classList.remove('visible');
    if (info.buildTime) {
      lastDismissedBuild = info.buildTime;
      try {
        sessionStorage.setItem('dismissed_build', String(info.buildTime));
      } catch {
        // Ignore storage errors
      }
    }
  });

  return toast;
}

export async function checkForUpdates(): Promise<boolean> {
  if (isChecking) return updateFound;
  isChecking = true;

  try {
    const targetUrl = new URL('version.json', document.baseURI || window.location.href);
    targetUrl.searchParams.set('_t', Date.now().toString());

    const res = await fetch(targetUrl.toString(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache'
      }
    });

    if (!res.ok) return false;

    const remoteInfo: VersionInfo = await res.json();

    const isNewerBuild = Boolean(
      remoteInfo.buildTime &&
      CURRENT_BUILD_TIME > 0 &&
      remoteInfo.buildTime > CURRENT_BUILD_TIME
    );

    const isDifferentVersion = Boolean(
      remoteInfo.version &&
      CURRENT_VERSION &&
      remoteInfo.version !== CURRENT_VERSION
    );

    if (isNewerBuild || isDifferentVersion) {
      updateFound = true;

      // Check if user already dismissed this specific build in this session
      let dismissedBuild = lastDismissedBuild;
      if (!dismissedBuild) {
        try {
          dismissedBuild = Number(sessionStorage.getItem('dismissed_build') || 0);
        } catch {
          dismissedBuild = 0;
        }
      }

      if (remoteInfo.buildTime && remoteInfo.buildTime === dismissedBuild) {
        return true;
      }

      const toast = createToastElement(remoteInfo);
      requestAnimationFrame(() => {
        toast.classList.add('visible');
      });

      return true;
    }
  } catch {
    // Network or parse failure, silently ignored
  } finally {
    isChecking = false;
  }

  return false;
}

export function formatBuildDate(time: number): string {
  if (!time) return '';
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function setupVersionDisplay(): void {
  const versionElements = document.querySelectorAll<HTMLElement>('#menuVersion, #labVersion, [data-app-version]');
  if (versionElements.length === 0) return;

  const buildDate = formatBuildDate(CURRENT_BUILD_TIME);
  const defaultText = buildDate ? `v${CURRENT_VERSION} (${buildDate})` : `v${CURRENT_VERSION}`;

  versionElements.forEach(el => {
    el.textContent = defaultText;
    el.title = 'Нажмите для проверки обновлений';
    el.style.cursor = 'pointer';

    el.addEventListener('click', async () => {
      const prevText = el.textContent;
      el.textContent = 'Проверка обновлений…';
      const hasUpdate = await checkForUpdates();
      if (!hasUpdate) {
        el.textContent = `✓ Актуальная версия (${defaultText})`;
        setTimeout(() => {
          el.textContent = defaultText;
        }, 2500);
      } else {
        el.textContent = defaultText;
      }
    });
  });
}

export function initVersionChecker(intervalMinutes = 3): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupVersionDisplay());
  } else {
    setupVersionDisplay();
  }

  // Initial check shortly after load
  setTimeout(() => {
    checkForUpdates();
  }, 3500);

  // Periodic polling check
  if (intervalMinutes > 0) {
    setInterval(() => {
      checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  // Re-check when user focuses/returns to the browser tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates();
    }
  });
}
