export const CUSTOM_FOURX_ICONS: Record<string, string> = {
  'NIFTY 50': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="niftyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022c22"/>
      <stop offset="100%" stop-color="#00B386"/>
    </linearGradient>
    <linearGradient id="niftyLine" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#a7f3d0"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#niftyGrad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5"/>
  <path d="M12 44 L24 32 L34 38 L52 18" fill="none" stroke="url(#niftyLine)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="52" cy="18" r="3.5" fill="#ffffff"/>
  <text x="32" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">N50</text>
</svg>`,

  'SENSEX': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="sensexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="sensexAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#93c5fd"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#sensexGrad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="1.5"/>
  <path d="M14 42 C20 42, 24 36, 30 26 C34 19, 42 16, 50 16" fill="none" stroke="url(#sensexAccent)" stroke-width="3.5" stroke-linecap="round"/>
  <polygon points="50,12 54,16 50,20" fill="#ffffff"/>
  <text x="32" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">BSE 30</text>
</svg>`,

  'BANK NIFTY': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#082f49"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#bankGrad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#0ea5e9" stroke-opacity="0.3" stroke-width="1.5"/>
  <!-- Neoclassical Bank Pillars -->
  <path d="M16 24 L48 24 L32 14 Z" fill="#38bdf8"/>
  <rect x="18" y="27" width="5" height="15" rx="1" fill="#e0f2fe"/>
  <rect x="26" y="27" width="5" height="15" rx="1" fill="#e0f2fe"/>
  <rect x="33" y="27" width="5" height="15" rx="1" fill="#e0f2fe"/>
  <rect x="41" y="27" width="5" height="15" rx="1" fill="#e0f2fe"/>
  <rect x="14" y="43" width="36" height="3" rx="1" fill="#38bdf8"/>
  <text x="32" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">BANK</text>
</svg>`,

  'NIFTY IT': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="itGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2e1065"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#itGrad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#8b5cf6" stroke-opacity="0.3" stroke-width="1.5"/>
  <!-- Chip Circuit Design -->
  <rect x="22" y="16" width="20" height="20" rx="4" fill="#a78bfa" stroke="#ffffff" stroke-width="2"/>
  <circle cx="32" cy="26" r="4" fill="#ffffff"/>
  <path d="M14 26 L22 26 M42 26 L50 26 M32 8 L32 16 M32 36 L32 44 M26 10 L26 16 M38 10 L38 16" stroke="#c4b5fd" stroke-width="2" stroke-linecap="round"/>
  <text x="32" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">TECH</text>
</svg>`,

  'GOLD24K': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03"/>
      <stop offset="50%" stop-color="#b45309"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#goldGrad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="1.5"/>
  <!-- 3D Gold Bar -->
  <polygon points="18,22 46,22 40,16 12,16" fill="#fef9c3"/>
  <polygon points="46,22 52,38 46,44 40,16" fill="#eab308"/>
  <polygon points="18,22 46,22 46,44 18,44" fill="url(#barGrad)"/>
  <text x="32" y="34" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="8" font-weight="900" fill="#78350f" text-anchor="middle" letter-spacing="0.5">999.9</text>
  <text x="32" y="55" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">24K GOLD</text>
</svg>`,

  'GOLD22K': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="gold22Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451a03"/>
      <stop offset="50%" stop-color="#92400e"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#gold22Grad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="1.5"/>
  <circle cx="32" cy="27" r="14" fill="url(#coinGrad)" stroke="#fef08a" stroke-width="2"/>
  <circle cx="32" cy="27" r="11" fill="none" stroke="#78350f" stroke-width="1" stroke-dasharray="2,2"/>
  <text x="32" y="31" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" font-weight="900" fill="#78350f" text-anchor="middle">AU</text>
  <text x="32" y="55" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">22K GOLD</text>
</svg>`,

  'SILVER1KG': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="silverBar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#silverGrad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#cbd5e1" stroke-opacity="0.3" stroke-width="1.5"/>
  <polygon points="18,22 46,22 40,16 12,16" fill="#f8fafc"/>
  <polygon points="46,22 52,38 46,44 40,16" fill="#94a3b8"/>
  <polygon points="18,22 46,22 46,44 18,44" fill="url(#silverBar)"/>
  <text x="32" y="34" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="8" font-weight="900" fill="#1e293b" text-anchor="middle" letter-spacing="0.5">999 AG</text>
  <text x="32" y="55" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">SILVER</text>
</svg>`,

  'CRUDEOIL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="crudeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="oilDrop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#crudeGrad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1.5"/>
  <!-- Oil Drop Icon -->
  <path d="M32 12 C32 12, 18 28, 18 36 C18 44, 24 50, 32 50 C40 50, 46 44, 46 36 C46 28, 32 12, 32 12 Z" fill="url(#oilDrop)"/>
  <path d="M26 34 C26 28, 32 18, 32 18 C32 18, 22 28, 22 34 C22 38, 24 41, 26 42 C25 40, 26 36, 26 34 Z" fill="#fef3c7" opacity="0.6"/>
  <text x="32" y="58" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" font-weight="900" fill="#fcd34d" text-anchor="middle" letter-spacing="0.5">CRUDE</text>
</svg>`,

  'NATURALGAS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="gasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#082f49"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#gasGrad)"/>
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="1.5"/>
  <!-- Gas Flame -->
  <path d="M32 12 C32 12, 22 26, 22 35 C22 43, 26 48, 32 48 C38 48, 42 43, 42 35 C42 26, 32 12, 32 12 Z" fill="url(#flameGrad)"/>
  <path d="M32 24 C32 24, 26 32, 26 38 C26 42, 29 45, 32 45 C35 45, 38 42, 38 38 C38 32, 32 24, 32 24 Z" fill="#e0f2fe"/>
  <text x="32" y="58" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" font-weight="900" fill="#7dd3fc" text-anchor="middle" letter-spacing="0.5">NAT GAS</text>
</svg>`
};

// Aliases mapping
CUSTOM_FOURX_ICONS['NIFTY50'] = CUSTOM_FOURX_ICONS['NIFTY 50'];
CUSTOM_FOURX_ICONS['NIFTY'] = CUSTOM_FOURX_ICONS['NIFTY 50'];
CUSTOM_FOURX_ICONS['BANKNIFTY'] = CUSTOM_FOURX_ICONS['BANK NIFTY'];
CUSTOM_FOURX_ICONS['NIFTYIT'] = CUSTOM_FOURX_ICONS['NIFTY IT'];
CUSTOM_FOURX_ICONS['GOLD'] = CUSTOM_FOURX_ICONS['GOLD24K'];
CUSTOM_FOURX_ICONS['SILVER'] = CUSTOM_FOURX_ICONS['SILVER1KG'];
CUSTOM_FOURX_ICONS['CRUDE'] = CUSTOM_FOURX_ICONS['CRUDEOIL'];

