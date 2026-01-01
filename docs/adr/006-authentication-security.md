# ADR-006: Authentication & Security

**Status:** Accepted  
**Date:** 2026-01-01  
  

## Context

The app handles personal spiritual data. Users expect:

1. **Privacy**: Nobody else can see their logs
2. **Quick access**: Don't want to login every time
3. **Optional cloud backup**: Only when they choose to
4. **Device security**: PIN lock like the original Android app

### Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| Someone picks up unlocked phone | Medium | High | 4-digit PIN lock |
| Browser data theft (malware) | Low | High | Beyond our control |
| Man-in-middle on backup | Low | Medium | HTTPS + Google OAuth |
| Google account compromise | Low | High | User's responsibility |

## Decision

### Two-Layer Security Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       SECURITY ARCHITECTURE                              │
│                                                                          │
│   LAYER 1: Local PIN Lock (Optional but Recommended)                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                                                                  │   │
│   │    User opens app                                               │   │
│   │         │                                                        │   │
│   │         ▼                                                        │   │
│   │    ┌─────────────┐     Yes    ┌─────────────────────────────┐   │   │
│   │    │ PIN enabled?│───────────▶│  Show PIN Entry Screen      │   │   │
│   │    └─────────────┘            │  • 4 digit input             │   │   │
│   │         │ No                  │  • 3 attempts before timeout │   │   │
│   │         ▼                     │  • Biometric option (future) │   │   │
│   │    ┌─────────────┐            └──────────────┬──────────────┘   │   │
│   │    │  Show App   │◀──────────────────────────┘                  │   │
│   │    └─────────────┘            (on correct PIN)                  │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   LAYER 2: Google OAuth (For Cloud Backup Only)                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                                                                  │   │
│   │    User clicks "Backup to Google"                               │   │
│   │         │                                                        │   │
│   │         ▼                                                        │   │
│   │    ┌─────────────────────────────────────────────────────────┐  │   │
│   │    │                  Google OAuth Flow                       │  │   │
│   │    │  1. Redirect to Google consent screen                   │  │   │
│   │    │  2. User grants drive.file scope                        │  │   │
│   │    │  3. Receive access token + refresh token                │  │   │
│   │    │  4. Store tokens in IndexedDB                           │  │   │
│   │    └─────────────────────────────────────────────────────────┘  │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### PIN Implementation

**Storage**: Hashed with SHA-256 (not bcrypt - this is convenience lock, not password)

```typescript
// Simple hash for PIN - this is a convenience lock, not a security boundary
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'adhyatmik-salt-2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Rationale for SHA-256 over bcrypt:**
- This is a convenience lock, not protecting against determined attackers
- If someone has access to IndexedDB, they have access to the data anyway
- 4 digits = 10,000 combinations, not meant to be cryptographically secure
- Matches the original Android app's approach

### Auto-Lock Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTO-LOCK TRIGGERS                           │
│                                                                  │
│   • App goes to background (visibilitychange event)            │
│   • Browser tab loses focus for > 30 seconds                   │
│   • User manually clicks "Lock" button                         │
│   • After configurable idle timeout (default: 5 minutes)       │
│                                                                  │
│   On lock:                                                      │
│   • Clear any sensitive data from memory                        │
│   • Show PIN entry overlay                                      │
│   • Block all navigation until unlocked                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Google OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OAUTH TOKEN LIFECYCLE                             │
│                                                                          │
│   ┌─────────────┐                                                       │
│   │ User clicks │                                                       │
│   │   "Backup"  │                                                       │
│   └──────┬──────┘                                                       │
│          │                                                               │
│          ▼                                                               │
│   ┌─────────────────┐    No     ┌─────────────────────────────────────┐│
│   │ Have valid      │──────────▶│ Redirect to Google OAuth            ││
│   │ access token?   │           │                                     ││
│   └─────────────────┘           │ 1. accounts.google.com/o/oauth2     ││
│          │ Yes                  │ 2. User approves scope              ││
│          │                      │ 3. Redirect back with code          ││
│          │                      │ 4. Exchange code for tokens         ││
│          │                      └──────────────────┬──────────────────┘│
│          │                                         │                    │
│          │◀────────────────────────────────────────┘                    │
│          │                                                               │
│          ▼                                                               │
│   ┌─────────────────┐                                                   │
│   │ Check if token  │    Yes    ┌─────────────────────────────────────┐│
│   │ expires < 5min  │──────────▶│ Use refresh token to get new access ││
│   └─────────────────┘           │ token (silent, no user interaction) ││
│          │ No                   └──────────────────┬──────────────────┘│
│          │                                         │                    │
│          │◀────────────────────────────────────────┘                    │
│          ▼                                                               │
│   ┌─────────────────┐                                                   │
│   │ Make API call   │                                                   │
│   │ with token      │                                                   │
│   └─────────────────┘                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Token Storage

Tokens stored in IndexedDB `settings` table:

```typescript
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;  // Unix timestamp
  scope: string;
  email: string;
}

// Stored as:
db.settings.put({ key: 'googleAuth', value: authTokens });
```

**Why not localStorage?**
- IndexedDB has more storage
- Consistent with rest of app data
- Easier to backup/restore with rest of data

## Alternatives Considered

### 1. No PIN, rely on device lock

**Why Not:**
- Not all devices have lock enabled
- Shared devices are common
- Original app has PIN, users expect it

### 2. Biometric authentication

**Future consideration:**
- Web Authentication API exists but browser support varies
- Could add as "Unlock with fingerprint" option later
- PIN remains fallback

### 3. End-to-end encryption of IndexedDB

**Why Not:**
- Adds complexity
- Key management is hard
- If attacker has IndexedDB access, they can also intercept the key
- Not in original app's threat model

### 4. Server-side auth with our backend

**Why Not:**
- Requires backend (cost, maintenance)
- User data would flow through us (privacy concern)
- Google OAuth is sufficient for backup feature

## Consequences

### Positive

- PIN provides quick, familiar security
- No backend required
- User's Google account = their security boundary for backup
- Simple implementation, low attack surface

### Negative

- 4-digit PIN is not cryptographically strong
  - Accepted: This is a convenience lock
- Tokens in IndexedDB could be accessed by malicious browser extensions
  - Accepted: Same risk as any web app

### Risks

- User forgets PIN
  - Mitigated by: "Forgot PIN" can clear local data, restore from backup
- Google token revocation
  - Mitigated by: Clear error handling, re-auth flow

## Security Checklist

- [ ] PIN hash uses salt
- [ ] Auto-lock on background
- [ ] Brute force protection (timeout after 3 failures)
- [ ] OAuth uses PKCE
- [ ] Tokens refreshed before expiry
- [ ] HTTPS enforced for all API calls
- [ ] No sensitive data in logs

