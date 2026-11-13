import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TOP_STOCK_LOGOS: Record<string, string> = {
  'RELIANCE': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#003399"/>
    <circle cx="32" cy="32" r="24" fill="#ffffff"/>
    <path d="M26 18 L38 32 L26 46 Z" fill="#E31837"/>
    <text x="32" y="56" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">RELIANCE</text>
  </svg>`,

  'TCS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#001B44"/>
    <text x="32" y="38" font-family="-apple-system, sans-serif" font-size="16" font-weight="900" fill="#0076CE" text-anchor="middle" letter-spacing="1">TCS</text>
    <rect x="20" y="44" width="24" height="2.5" rx="1" fill="#E40046"/>
  </svg>`,

  'HDFCBANK': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#004C8F"/>
    <rect x="20" y="20" width="24" height="24" rx="2" fill="#ED232A"/>
    <rect x="24" y="24" width="7" height="7" fill="#ffffff"/>
    <rect x="33" y="24" width="7" height="7" fill="#ffffff"/>
    <rect x="24" y="33" width="7" height="7" fill="#ffffff"/>
    <rect x="33" y="33" width="7" height="7" fill="#004C8F"/>
    <text x="32" y="56" font-family="-apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#ffffff" text-anchor="middle">HDFC BANK</text>
  </svg>`,

  'INFY': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#007CC3"/>
    <text x="32" y="38" font-family="-apple-system, sans-serif" font-size="15" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">Infosys</text>
    <circle cx="50" cy="26" r="2.5" fill="#ffffff"/>
  </svg>`,

  'ITC': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0F2D6B"/>
    <polygon points="32,16 46,38 18,38" fill="#F4B400"/>
    <polygon points="32,22 42,37 22,37" fill="#0F2D6B"/>
    <text x="32" y="52" font-family="-apple-system, sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">ITC</text>
  </svg>`,

  'TATAMOTORS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#003865"/>
    <circle cx="32" cy="30" r="14" fill="none" stroke="#ffffff" stroke-width="2.5"/>
    <path d="M24 24 L40 24 M32 24 L32 38" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#ffffff" text-anchor="middle">TATA MOTORS</text>
  </svg>`,

  'ICICIBANK': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#AF231C"/>
    <circle cx="32" cy="28" r="14" fill="#F37021"/>
    <path d="M26 28 C26 22, 38 22, 38 28 C38 34, 26 34, 26 40" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">ICICI</text>
  </svg>`,

  'SBIN': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0091D0"/>
    <circle cx="32" cy="32" r="18" fill="#ffffff"/>
    <circle cx="32" cy="32" r="8" fill="#0091D0"/>
    <rect x="30" y="32" width="4" height="18" fill="#0091D0"/>
  </svg>`,

  'BHARTIARTL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#E40000"/>
    <path d="M22 42 C22 28, 42 28, 42 42 C42 42, 32 30, 22 42 Z" fill="#ffffff"/>
    <circle cx="32" cy="22" r="4" fill="#ffffff"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">airtel</text>
  </svg>`,

  'MARUTI': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1C3F94"/>
    <path d="M20 20 L32 20 L24 34 L32 34 L44 20" fill="none" stroke="#E60012" stroke-width="3" stroke-linecap="round"/>
    <text x="32" y="53" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">MARUTI</text>
  </svg>`,

  'SUNPHARMA': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#E86C00"/>
    <circle cx="32" cy="28" r="10" fill="#ffffff"/>
    <circle cx="32" cy="28" r="6" fill="#E86C00"/>
    <text x="32" y="52" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">SUN PHARMA</text>
  </svg>`,

  'LT': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#00457C"/>
    <text x="32" y="42" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">L&amp;T</text>
  </svg>`,

  'ZOMATO': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#CB202D"/>
    <text x="32" y="40" font-family="-apple-system, sans-serif" font-size="14" font-weight="900" font-style="italic" fill="#ffffff" text-anchor="middle">zomato</text>
  </svg>`,

  'TATASTEEL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0A3B7C"/>
    <path d="M22 22 L42 22 M32 22 L32 38" stroke="#0099FF" stroke-width="3.5" stroke-linecap="round"/>
    <text x="32" y="53" font-family="-apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#ffffff" text-anchor="middle">TATA STEEL</text>
  </svg>`,

  'TATAPOWER': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#002D62"/>
    <polygon points="34,18 24,32 32,32 30,46 42,30 34,30" fill="#00B386"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">TATA POWER</text>
  </svg>`,

  'SWIGGY': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#FC8019"/>
    <path d="M38 18 C30 18, 24 24, 24 30 C24 38, 38 40, 38 46 C38 50, 32 50, 28 48" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
    <text x="32" y="58" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="900" fill="#ffffff" text-anchor="middle">SWIGGY</text>
  </svg>`,

  'HYUNDAI': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#002C6C"/>
    <ellipse cx="32" cy="30" rx="18" ry="11" fill="none" stroke="#ffffff" stroke-width="2.5" transform="rotate(-15 32 30)"/>
    <path d="M26 24 L29 36 M38 24 L35 36 M27 30 L37 30" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">HYUNDAI</text>
  </svg>`,

  'WAAREE': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#059669"/>
    <circle cx="32" cy="28" r="10" fill="#FBBF24"/>
    <path d="M20 44 L32 34 L44 44" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#ffffff" text-anchor="middle">WAAREE</text>
  </svg>`,

  'HINDUNILVR': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#002366"/>
    <path d="M22 20 C22 36, 42 36, 42 20" stroke="#00B386" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="38" r="3" fill="#ffffff"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">HUL</text>
  </svg>`,

  'KOTAKBANK': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#EE2726"/>
    <path d="M24 32 C24 26, 32 26, 32 32 C32 38, 40 38, 40 32 C40 26, 32 26, 32 32 C32 38, 24 38, 24 32 Z" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">KOTAK</text>
  </svg>`,

  'AXISBANK': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#97144D"/>
    <polygon points="32,16 48,40 36,40 32,32 28,40 16,40" fill="#ffffff"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">AXIS</text>
  </svg>`,

  'BAJFINANCE': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#003366"/>
    <path d="M18 24 L32 36 L46 24" fill="none" stroke="#00A3E0" stroke-width="4" stroke-linecap="round"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">BAJAJ FIN</text>
  </svg>`,

  'ASIANPAINT': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#F4511E"/>
    <circle cx="25" cy="28" r="7" fill="#FFB300"/>
    <circle cx="39" cy="28" r="7" fill="#00897B"/>
    <text x="32" y="52" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">ASIAN PAINTS</text>
  </svg>`,

  'HCLTECH': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#006699"/>
    <text x="32" y="38" font-family="-apple-system, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">HCL</text>
    <text x="32" y="52" font-family="-apple-system, sans-serif" font-size="7.5" font-weight="800" fill="#00E5FF" text-anchor="middle">TECH</text>
  </svg>`,

  'TITAN': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1A1A1A"/>
    <circle cx="32" cy="28" r="12" fill="none" stroke="#C5A059" stroke-width="2.5"/>
    <text x="32" y="52" font-family="-apple-system, sans-serif" font-size="9" font-weight="900" fill="#C5A059" text-anchor="middle" letter-spacing="1">TITAN</text>
  </svg>`,

  'ULTRACEMCO': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#FFC20E"/>
    <polygon points="32,18 46,38 18,38" fill="#111111"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="900" fill="#111111" text-anchor="middle">ULTRATECH</text>
  </svg>`,

  'BAJAJFINSV': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#004B87"/>
    <path d="M20 22 L32 34 L44 22" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="900" fill="#ffffff" text-anchor="middle">FINSERV</text>
  </svg>`,

  'NTPC': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#005A9C"/>
    <polygon points="34,16 22,32 32,32 30,48 44,30 34,30" fill="#48BB78"/>
    <text x="32" y="56" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">NTPC</text>
  </svg>`,

  'ONGC': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#C41230"/>
    <path d="M32 18 C32 18, 22 28, 22 34 C22 40, 26 44, 32 44 C38 44, 42 40, 42 34 C42 28, 32 18, 32 18 Z" fill="#FBBF24"/>
    <text x="32" y="56" font-family="-apple-system, sans-serif" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle">ONGC</text>
  </svg>`,

  'POWERGRID': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0B6623"/>
    <path d="M22 38 L32 18 L42 38 M26 30 L38 30" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="900" fill="#ffffff" text-anchor="middle">POWERGRID</text>
  </svg>`,

  'JSWSTEEL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#002B49"/>
    <path d="M18 24 L46 24 L32 42 Z" fill="#D32F2F"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">JSW STEEL</text>
  </svg>`,

  'M&M': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#D12026"/>
    <text x="32" y="38" font-family="-apple-system, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">M&amp;M</text>
    <text x="32" y="52" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="800" fill="#ffffff" text-anchor="middle">Mahindra</text>
  </svg>`,

  'ADANIENT': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1F2D60"/>
    <circle cx="32" cy="28" r="10" fill="#1084D0"/>
    <path d="M22 38 C26 32, 38 32, 42 38" stroke="#ffffff" stroke-width="3" fill="none"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">ADANI</text>
  </svg>`,

  'ADANIPORTS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#162B4D"/>
    <path d="M18 36 L32 20 L46 36" stroke="#00A3E0" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">PORTS</text>
  </svg>`,

  'COALINDIA': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#222222"/>
    <circle cx="32" cy="28" r="10" fill="#F57C00"/>
    <text x="32" y="53" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="900" fill="#ffffff" text-anchor="middle">COAL INDIA</text>
  </svg>`,

  'WIPRO': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="4.5" fill="#E91E63"/>
    <circle cx="40" cy="24" r="4.5" fill="#4CAF50"/>
    <circle cx="24" cy="36" r="4.5" fill="#FF9800"/>
    <circle cx="40" cy="36" r="4.5" fill="#2196F3"/>
    <text x="32" y="53" font-family="-apple-system, sans-serif" font-size="8.5" font-weight="900" fill="#222222" text-anchor="middle">wipro</text>
  </svg>`,

  'PAYTM': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#002E6E"/>
    <text x="32" y="38" font-family="-apple-system, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">Pay</text>
    <text x="32" y="52" font-family="-apple-system, sans-serif" font-size="12" font-weight="900" fill="#00BAF2" text-anchor="middle">tm</text>
  </svg>`,

  'JIOFIN': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0A2540"/>
    <circle cx="32" cy="26" r="12" fill="#0070F3"/>
    <text x="32" y="31" font-family="-apple-system, sans-serif" font-size="11" font-weight="900" fill="#ffffff" text-anchor="middle">Jio</text>
    <text x="32" y="53" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">FINANCIAL</text>
  </svg>`,

  'IRCTC': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#F37021"/>
    <circle cx="32" cy="28" r="10" fill="#003366"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">IRCTC</text>
  </svg>`,

  'BEL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#145A32"/>
    <polygon points="32,18 44,36 20,36" fill="#ffffff"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">BEL</text>
  </svg>`,

  'HAL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1B4F72"/>
    <path d="M16 32 L32 20 L48 32 L32 28 Z" fill="#E67E22"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">HAL</text>
  </svg>`,

  'PARASHLTH': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0f766e"/>
    <path d="M28 18 H36 V26 H44 V34 H36 V42 H28 V34 H20 V26 H28 Z" fill="#ffffff"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">PARAS</text>
  </svg>`,

  'NTPCGREEN': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#065f46"/>
    <circle cx="32" cy="26" r="13" fill="#10b981"/>
    <path d="M32 17 C32 17, 38 23, 38 28 C38 32, 35 35, 32 35 C29 35, 26 32, 26 28 C26 23, 32 17, 32 17 Z" fill="#ffffff"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">NTPC GREEN</text>
  </svg>`,

  'TATATECH': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#003865"/>
    <circle cx="32" cy="26" r="12" fill="none" stroke="#38bdf8" stroke-width="2.5"/>
    <path d="M26 26 H38 M32 20 V32" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
    <text x="32" y="54" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">TATA TECH</text>
  </svg>`,

  'BAJAJHFL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0047BA"/>
    <path d="M20 32 L32 20 L44 32 V42 H20 Z" fill="#ffffff"/>
    <rect x="28" y="34" width="8" height="8" fill="#0047BA"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">BAJAJ HOUSING</text>
  </svg>`,

  'FIRSTCRY': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#f59e0b"/>
    <circle cx="32" cy="28" r="13" fill="#ffffff"/>
    <circle cx="28" cy="26" r="2" fill="#f59e0b"/>
    <circle cx="36" cy="26" r="2" fill="#f59e0b"/>
    <path d="M28 32 Q32 36 36 32" stroke="#f59e0b" stroke-width="2" fill="none" stroke-linecap="round"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">FIRSTCRY</text>
  </svg>`,

  'OLAELEC': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#09090b"/>
    <circle cx="32" cy="27" r="14" fill="#10b981"/>
    <path d="M33 18 L26 29 H32 L30 38 L38 27 H32 Z" fill="#09090b"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">OLA</text>
  </svg>`,

  'AFCONS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#c2410c"/>
    <path d="M18 40 L32 18 L46 40 M24 33 H40" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">AFCONS</text>
  </svg>`,

  'PREMIERENE': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1e3a8a"/>
    <circle cx="32" cy="27" r="10" fill="#eab308"/>
    <path d="M22 41 L32 33 L42 41" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">PREMIER</text>
  </svg>`,

  'BCSSL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#334155"/>
    <rect x="20" y="20" width="24" height="8" rx="2" fill="#94a3b8"/>
    <rect x="28" y="28" width="8" height="14" fill="#64748b"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">BCSSL</text>
  </svg>`,

  'BLSPOLY': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0369a1"/>
    <polygon points="32,18 42,24 42,36 32,42 22,36 22,24" stroke="#ffffff" stroke-width="2.5" fill="none"/>
    <circle cx="32" cy="30" r="4" fill="#38bdf8"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">BLS</text>
  </svg>`,

  'SFCTECH': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#047857"/>
    <path d="M32 16 C32 16, 22 28, 22 36 C22 43, 26 47, 32 47 C38 47, 42 43, 42 36 C42 28, 32 16, 32 16 Z" fill="#34d399"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">SFC</text>
  </svg>`,

  'HGSINDIALT': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1d4ed8"/>
    <path d="M18 32 Q25 20 32 32 T46 32" stroke="#60a5fa" stroke-width="3" fill="none"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">HGS</text>
  </svg>`,

  'MAXENGS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#b45309"/>
    <circle cx="32" cy="27" r="11" fill="none" stroke="#fde68a" stroke-width="3" stroke-dasharray="4,2"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">MAXWELL</text>
  </svg>`,

  'VPFL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#6d28d9"/>
    <polygon points="32,18 44,30 32,42 20,30" stroke="#c4b5fd" stroke-width="2.5" fill="none"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#ffffff" text-anchor="middle">VEDANT</text>
  </svg>`,

  'MKJEWELS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#78350f"/>
    <polygon points="22,24 42,24 48,34 32,44 16,34" fill="#fbbf24"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">MK JEWELS</text>
  </svg>`,

  'EDELALTS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1e3a8a"/>
    <circle cx="32" cy="27" r="12" fill="#3b82f6"/>
    <text x="32" y="32" font-family="-apple-system, sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">E</text>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="900" fill="#ffffff" text-anchor="middle">EDELWEISS</text>
  </svg>`,

  'SMCGLOBAL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#0f172a"/>
    <path d="M18 36 C24 22, 40 22, 46 36" stroke="#f97316" stroke-width="3" fill="none"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">SMC</text>
  </svg>`,

  'VNL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1e293b"/>
    <line x1="18" y1="26" x2="46" y2="26" stroke="#38bdf8" stroke-width="2"/>
    <line x1="18" y1="34" x2="46" y2="34" stroke="#38bdf8" stroke-width="2"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">VNL</text>
  </svg>`,

  'NITYAS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#064e3b"/>
    <polygon points="32,16 46,28 32,40 18,28" stroke="#34d399" stroke-width="2" fill="none"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="7" font-weight="900" fill="#ffffff" text-anchor="middle">NITYA'S</text>
  </svg>`,

  'ACEVECTOR': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#b91c1c"/>
    <polygon points="32,18 46,42 18,42" fill="#ffffff"/>
    <polygon points="32,26 40,40 24,40" fill="#b91c1c"/>
    <text x="32" y="56" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="900" fill="#ffffff" text-anchor="middle">ACEVECTOR</text>
  </svg>`,

  'SRIT': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#1e3a8a"/>
    <circle cx="32" cy="27" r="10" stroke="#60a5fa" stroke-width="2" fill="none"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">SRIT</text>
  </svg>`,

  'SHAHINVEST': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#881337"/>
    <circle cx="32" cy="27" r="10" fill="#f43f5e"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">SIHL</text>
  </svg>`,

  'PAPADMALJI': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#b45309"/>
    <circle cx="32" cy="27" r="12" fill="#fde68a"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="6" font-weight="900" fill="#ffffff" text-anchor="middle">PAPADMALJI</text>
  </svg>`,

  'EVENTIONS': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#6b21a8"/>
    <circle cx="32" cy="27" r="10" fill="#d8b4fe"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="6.5" font-weight="900" fill="#ffffff" text-anchor="middle">EVENTIONS</text>
  </svg>`,

  'RKFAL': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="16" fill="#be185d"/>
    <circle cx="32" cy="27" r="10" fill="#fbcfe8"/>
    <text x="32" y="55" font-family="-apple-system, sans-serif" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">RKF</text>
  </svg>`
};

// Aliases for IPO normalized names and common variations
const IPO_ALIASES: Record<string, string> = {
  'ipo:swiggy': 'SWIGGY',
  'ipo:hyundai-motor-india': 'HYUNDAI',
  'ipo:hyundai': 'HYUNDAI',
  'ipo:waaree-energies': 'WAAREE',
  'ipo:waaree': 'WAAREE',
  'ipo:paras-healthcare': 'PARASHLTH',
  'ipo:ntpc-green-energy': 'NTPCGREEN',
  'ipo:tata-technologies': 'TATATECH',
  'ipo:bajaj-housing-finance': 'BAJAJHFL',
  'ipo:brainbees-solutions': 'FIRSTCRY',
  'ipo:firstcry': 'FIRSTCRY',
  'ipo:ola-electric': 'OLAELEC',
  'ipo:afcons-infrastructure': 'AFCONS',
  'ipo:premier-energies': 'PREMIERENE',
  'ipo:bombay-coated-and-special-steels': 'BCSSL',
  'ipo:bls-polymers': 'BLSPOLY',
  'ipo:sfc-environmental-technologies': 'SFCTECH',
  'ipo:sfc-environmental': 'SFCTECH',
  'ipo:hgs-india': 'HGSINDIALT',
  'ipo:maxwell-engineering-solutions': 'MAXENGS',
  'ipo:maxwell-engineering': 'MAXENGS',
  'ipo:vedant-poly-fabs': 'VPFL',
  'ipo:mk-sons-fine-jewels': 'MKJEWELS',
  'ipo:m-k-sons-fine-jewels': 'MKJEWELS',
  'ipo:eaaa-india-alternatives': 'EDELALTS',
  'SMCG04': 'SMCGLOBAL',
  'ipo:smc-global-securities': 'SMCGLOBAL',
  'ipo:r-k-fashion-accessories': 'RKFAL',
  'ipo:nityas-gems-and-jewellery': 'NITYAS',
  'ipo:vishal-nirmiti': 'VNL',
  'ipo:eventions': 'EVENTIONS',
  'ipo:papadmalji-agro-foods': 'PAPADMALJI',
  'ipo:srit-india': 'SRIT',
  'ipo:shah-investor-s-home': 'SHAHINVEST',
  'ipo:acevector': 'ACEVECTOR',
};

for (const [alias, target] of Object.entries(IPO_ALIASES)) {
  if (TOP_STOCK_LOGOS[target]) {
    TOP_STOCK_LOGOS[alias] = TOP_STOCK_LOGOS[target];
  }
}

export function seedLocalLogos(targetDir: string) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  for (const [symbol, svg] of Object.entries(TOP_STOCK_LOGOS)) {
    const filePath = path.join(targetDir, `${symbol}.svg`);
    fs.writeFileSync(filePath, svg.trim(), 'utf-8');
  }
}
