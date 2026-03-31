# react-openfeature-multiple-clients

Vite + React example for **[Split](https://www.split.io/) / [Harness FME](https://developer.harness.io/docs/feature-management-experimentation/)** with **OpenFeature**: two named clients (`anon-web`, `user-web`) on one page.

**Repository:** [github.com/Split-Community/react-openfeature-multiple-clients](https://github.com/Split-Community/react-openfeature-multiple-clients)

Uses the [Harness OpenFeature provider for React](https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/openfeature/react-sdk/) (`@splitsoftware/openfeature-web-split-provider` + `@splitsoftware/splitio-browserjs`).

---

## Why `openfeature-bootstrap.ts`?

[`src/main.tsx`](src/main.tsx) runs **`bootstrapOpenFeature()` before `createRoot(…).render`** so three problems do not show up on first paint:

1. **Provider readiness** — Until Split finishes initializing, OpenFeature can be `NOT_READY` and flag hooks error. `setProviderAndWait` waits for each domain provider before the UI mounts.

2. **Domain context timing** — `useContextMutator().setContext` runs in `useEffect`, which is *after* the first render. If you read flags immediately, OpenFeature may log “Unable to find context” for `anon-web` / `user-web` and evaluations can misbehave. Bootstrap calls `OpenFeature.setContext(domain, …)` up front so context exists before any hook runs.

3. **Split customer keys** — One `OpenFeatureSplitProvider` shares a single Split SDK client; changing OpenFeature `targetingKey` alone does not switch that client for `getTreatment`. This app registers **one OpenFeature provider per domain**, each with its own `SplitFactory` `core.key` (`anonymous` vs `user-1`), so anonymous and signed-in panels actually hit Split as different users.

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

| Flag key    | UI area           | OpenFeature domain |
| ----------- | ----------------- | ------------------ |
| `anon-flag` | Anonymous panel   | `anon-web`         |
| `user-flag` | Signed-in panel   | `user-web`         |

Create both in the environment that matches your browser key. String treatments work with `useFlag(…, defaultString)`.

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
