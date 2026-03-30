# react-openfeature-multiple-clients

Example Vite + React app for **[Split](https://www.split.io/) / [Harness FME](https://developer.harness.io/docs/feature-management-experimentation/)** showing how to use **OpenFeature** with **one** registered provider and **multiple named clients** in the same page.

**Repository:** [github.com/Split-Community/react-openfeature-multiple-clients](https://github.com/Split-Community/react-openfeature-multiple-clients)

**Pattern:** `OpenFeature.setProvider(myProvider)` once, then `OpenFeature.getClient('anon-web')` and `OpenFeature.getClient('user-web')`, each subtree wrapped in `<OpenFeatureProvider client={…}>`. The anonymous shell uses evaluation context `targetingKey: 'anonymous'`; after “Sign in”, the inner tree uses `targetingKey: 'user-1'`. Evaluations go through the [Harness OpenFeature provider for React](https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/openfeature/react-sdk/) (`@splitsoftware/openfeature-web-split-provider` + `@splitsoftware/splitio-browserjs`).

---

## Prerequisites

- **Node.js** (LTS) and npm
- A **browser (client-side) SDK key** from Harness FME / Split for the environment where you will define flags

---

## Step 1 — Clone and install

```bash
git clone https://github.com/Split-Community/react-openfeature-multiple-clients.git
cd react-openfeature-multiple-clients
npm install
```

Dependencies (`@openfeature/react-sdk`, `@openfeature/web-sdk`, Split OpenFeature provider, Split browser SDK, React, Vite) are resolved from the **public npm registry**.

---

## Step 2 — Configure your browser SDK key

1. Open [`src/App.tsx`](src/App.tsx).
2. Find `AUTHORIZATION_KEY` next to `SplitFactory`.
3. Set your **client-side** SDK key:

   ```ts
   const AUTHORIZATION_KEY = '<paste-your-browser-sdk-key-here>';
   ```

Never commit production keys to a public repo. Prefer environment variables (e.g. Vite `import.meta.env.VITE_*`) and `.env.local` (gitignored) if you extend this sample.

`SplitFactory` uses `core.key: 'anonymous'` as the initial Split customer id; OpenFeature `targetingKey` is set per subtree via `useContextMutator().setContext` (see comments in `App.tsx`).

---

## Step 3 — Create feature flags in Harness FME

The UI reads two **string** flags (keys must match exactly):

| Flag key    | Panel                 | OpenFeature client domain |
| ----------- | --------------------- | ------------------------- |
| `anon-flag` | Anonymous shell       | `anon-web`                |
| `user-flag` | Signed-in user        | `user-web`                |

In the environment tied to your browser SDK key:

1. Create flags **`anon-flag`** and **`user-flag`** (or change the keys in `App.tsx` to match your existing flags).
2. Use string treatments compatible with `useFlag(flagKey, defaultString)`.
3. Optionally target using evaluation context: anonymous tree uses `targetingKey: 'anonymous'`; signed-in tree uses `targetingKey: 'user-1'`.

If a flag is missing or Split returns `control`, OpenFeature may surface an evaluation error; the UI shows a default string and a **resolution note** when `isError` is true.

---

## Step 4 — Run the app

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

1. Check the **Anonymous shell** panel for `anon-flag`.
2. Click **Sign in** to mount the inner `user-web` provider and the **Signed-in user** panel for `user-flag`.
3. Click **Sign out** to unmount the inner tree.

**Debugging:** In development, `App.tsx` enables `OpenFeature.setLogger(console)` and diagnostic hooks. Open the browser console (show verbose/debug logs if filtered). Split is created with `debug: true`.

---

## Step 5 — Production build (optional)

```bash
npm run build
npm run preview
```

---

## Optional: run from the OpenFeature `js-sdk` monorepo

If you still have this app under `examples/nested-openfeature-providers` inside [open-feature/js-sdk](https://github.com/open-feature/js-sdk), install from the monorepo root, then:

```bash
npm run dev --workspace=react-openfeature-multiple-clients
```

---

## Reference

- [OpenFeature](https://openfeature.dev)
- [Harness — OpenFeature provider for React](https://developer.harness.io/docs/feature-management-experimentation/sdks-and-infrastructure/openfeature/react-sdk/)
