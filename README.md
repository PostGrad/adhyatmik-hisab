# Adhyatmik Hisab - Spiritual Ledger PWA

A Progressive Web App for spiritual habit tracking, inspired by the Swaminarayan tradition of maintaining a personal spiritual ledger (Adhyatmik Hisab).

![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-ready-blue)

## ✨ Features

- **📝 Custom Habit Lists** - Create habits organized in categories
- **🎯 Flexible Tracking** - 4 tracking types:
  - ✅ Yes/No - Simple completion
  - ⭐ Rating - Quality options (Best/Good/Okay/Poor)
  - ⏱️ Time - Duration tracking
  - 🔢 Count - Numerical values
- **📊 Analytics** - Visualize progress with charts
- **🔐 PIN Protection** - Optional 4-digit lock
- **☁️ Cloud Backup** - Sync to Google Sheets (coming soon)
- **📴 Offline First** - Works without internet

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Database | IndexedDB (Dexie.js) |
| State | Zustand |
| Charts | Recharts |
| PWA | vite-plugin-pwa |

## 📁 Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # Reusable UI primitives
│   ├── habits/      # Habit management
│   ├── logging/     # Daily logging
│   └── analytics/   # Charts and stats
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── store/           # Zustand state
├── db/              # Dexie database
├── services/        # Google API integration
├── types/           # TypeScript types
└── utils/           # Helper functions

docs/
└── adr/             # Architecture Decision Records
```

## 📋 Architecture Decisions

See [docs/adr/](./docs/adr/) for detailed architecture decision records:

- [ADR-001: Tech Stack Selection](./docs/adr/001-tech-stack-selection.md)
- [ADR-002: Data Storage Strategy](./docs/adr/002-data-storage-strategy.md)
- [ADR-003: Cloud Backup Architecture](./docs/adr/003-cloud-backup-architecture.md)
- [ADR-004: PWA & Offline Strategy](./docs/adr/004-pwa-offline-strategy.md)
- [ADR-005: State Management](./docs/adr/005-state-management.md)
- [ADR-006: Authentication & Security](./docs/adr/006-authentication-security.md)

## 🎨 Design

The app uses a warm, spiritual color palette:
- **Saffron** - Primary color, representing spirituality
- **Forest Green** - Success states, representing nature
- **Gold** - Accents, representing auspiciousness
- **Ivory/Cream** - Background, representing peace

Typography:
- **DM Sans** - Clean, modern body text
- **Fraunces** - Elegant display headings

## 📱 PWA Installation

1. Visit the app in Chrome/Edge/Safari
2. Look for "Install" prompt or Add to Home Screen
3. The app will work offline after installation

## 🔒 Privacy

- All data stored locally in your browser
- No server-side storage (fully offline-capable)
- Optional Google Sheets backup uses only `drive.file` scope
- PIN protection for app access

## 📜 License

MIT License - feel free to use and modify.

---

*Inspired by the teaching of Lord Swaminarayan to maintain a spiritual ledger for self-reflection and improvement.* 🙏
