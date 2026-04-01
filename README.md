# react-openfeature-multiple-clients

Vite + React example for **[Split](https://www.split.io/) / [Harness FME](https://developer.harness.io/docs/feature-management-experimentation/)** with **OpenFeature**: two named clients (`anon-web`, `user-web`) on one page.

**Repository:** [github.com/Split-Community/react-openfeature-multiple-clients](https://github.com/Split-Community/react-openfeature-multiple-clients)

Uses the [Harness OpenFeature provider for React](https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/openfeature/react-sdk/) (`@splitsoftware/openfeature-web-split-provider` + `@splitsoftware/splitio-browserjs`).

---

## Why `openfeature-bootstrap.ts`?

[`src/main.tsx`](src/main.tsx) runs **`bootstrapOpenFeature()` before `createRoot(…).render`** so three problems do not show up on first paint:

1. **Provider readiness** — Until Split finishes initializing, OpenFeature can be `NOT_READY` and flag hooks error. `setProviderAndWait` waits for each domain provider before the UI mounts.

2. **Domain context timing** — `useContextMutator().setContext` runs in `useEffect`, which is *after* the first render. If you read flags immediately, OpenFeature may log “Unable to find context” for `anon-web` / `user-web` and evaluations can misbehave. Bootstrap calls `OpenFeature.setContext(domain, …)` up front so context exists before any hook runs.

3. **Efficient resource usage** — The app creates **one shared Split factory** and registers **two OpenFeature providers** (one per domain) that share it. When context changes via `setContext({ targetingKey: newUserId })`, the provider internally calls `factory.client(newUserId)` to get the appropriate Split client. This avoids duplicating network connections, caches, and storage.

## Architecture Best Practices

- **One `SplitFactory`** shared by multiple providers (efficient)
- **Two OpenFeature domains** for simultaneous evaluation of different users
- **Static context** (anonymous) set once in bootstrap
- **Dynamic context** (user) updated via `setContext()` when user ID changes

**What to avoid:**
- Creating multiple `SplitFactory` instances (wastes resources: 2x network, memory, storage)
- Using `setContext()` in React for static values already set in bootstrap (unnecessary)
- Forgetting that `factory.client(key)` shares the factory infrastructure efficiently

## When to Use `setContext()`

| Scenario | Approach | Example |
|----------|----------|---------|
| **Static user key** (won't change) | Set in bootstrap only | Anonymous users always with key `”anonymous”` |
| **Dynamic user key** (changes at runtime) | Use `setContext()` in React `useEffect` | User signs in, changes account, switches profile |
| **Multiple simultaneous users** | Multiple domains/providers, each with own context | Show flags for anonymous AND logged-in user on same page |

**In this demo:**
- `anon-web` domain → static context (`”anonymous”`), set in bootstrap
- `user-web` domain → dynamic context (changes via input field), updated with `setContext()`

---

## Prerequisites

- Node.js (LTS) and npm  
- A **browser (client-side)** SDK key from Harness FME / Split  

---

## Step 1 — Clone and install

```bash
git clone https://github.com/Split-Community/react-openfeature-multiple-clients.git
cd react-openfeature-multiple-clients
npm install
```

---

## Step 2 — Browser SDK key

**Preferred:** `.env.local` in the project root:

```bash
VITE_SPLIT_BROWSER_KEY=your-client-side-sdk-key
```

Restart `npm run dev` after editing env files.

**Or** set the fallback in [`src/openfeature-bootstrap.ts`](src/openfeature-bootstrap.ts) (`authKey` / `<YOUR_AUTHORIZATION_KEY>`).

Do not commit real keys to a public repo.

---

## Step 3 — Feature flags in Harness

| Flag key    | UI area           | OpenFeature domain | Split customer key |
| ----------- | ----------------- | ------------------ | ------------------ |
| `anon-flag` | Anonymous panel   | `anon-web`         | `anonymous` (static) |
| `user-flag` | Signed-in panel   | `user-web`         | Dynamic (e.g., `user-1`, `user-2`) |

Create both in the environment that matches your browser key.

**Try targeting by key:**
- Set `anon-flag` to `"on"` for key = `"anonymous"`
- Set `user-flag` to `"premium"` for key = `"user-1"`, `"basic"` for `"user-2"`
- Change the User ID input in the UI to see different treatments

---

## Step 4 — Run

```bash
npm run dev
```

In dev, bootstrap also enables `OpenFeature.setLogger(console)`, lightweight evaluation hooks, and Split `debug` on the factories. Use the browser console (show verbose logs if needed).

---

## Step 5 — Build (optional)

```bash
npm run build
npm run preview
```

---

## Optional: inside the OpenFeature `js-sdk` monorepo

From [open-feature/js-sdk](https://github.com/open-feature/js-sdk) root:

```bash
npm install
npm run dev --workspace=react-openfeature-multiple-clients
```

---

## Reference

- [OpenFeature](https://openfeature.dev)
- [Harness — OpenFeature provider for React](https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/openfeature/react-sdk/)
