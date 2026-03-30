/**
 * Nested OpenFeature React example: one default provider, two named clients.
 *
 * **What this demonstrates.** OpenFeature lets you register a single default provider
 * (`OpenFeature.setProvider(myProvider)`) and still use multiple logical clients via
 * `OpenFeature.getClient('some-domain')`. Each client has its own domain string (here `anon-web` and
 * `user-web`). React’s `OpenFeatureProvider` accepts a `client` prop so different subtrees evaluate
 * flags against different domains while sharing the same vendor provider instance.
 *
 * **Domain vs targeting key.** The client domain (`anon-web`, `user-web`) selects which OpenFeature
 * client handles hooks under that tree (`OpenFeature.getContext(domain)` and metadata). It is not
 * automatically your vendor user id. Evaluation context (`targetingKey`, custom attributes) comes
 * from `useContextMutator().setContext` and is what providers receive on each `resolve*Evaluation`
 * call. This demo uses `anonymous` for the public shell and a synthetic `user-1` after sign-in.
 *
 * **Split / Harness caveat.** `OpenFeatureSplitProvider` keeps one underlying Split SDK client per
 * provider instance. OpenFeature passes per-domain evaluation `context` into Split on each call, but
 * Split’s `onContextChange` user-key lifecycle targets one mutable client. Two domains do not by
 * themselves mean two isolated Split sessions unless you use separate provider instances per domain.
 * @file
 * @see https://openfeature.dev
 */

import {
  OpenFeature,
  OpenFeatureProvider,
  type Hook,
  useContextMutator,
  useFlag,
} from '@openfeature/react-sdk';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { OpenFeatureSplitProvider } from '@splitsoftware/openfeature-web-split-provider';
import { SplitFactory } from '@splitsoftware/splitio-browserjs';

/* -------------------------------------------------------------------------- */
/* Optional development diagnostics                                           */
/* -------------------------------------------------------------------------- */

/**
 * Registers a global logger and evaluation hooks only in Vite development builds.
 *
 * - `setLogger(console)` forwards OpenFeature’s internal log calls (still relatively sparse).
 * - Hooks log every evaluation lifecycle stage; use the browser console with “Verbose” enabled
 *   if `debug` lines are filtered out.
 *
 * Remove this entire `if (import.meta.env.DEV)` block for a minimal production-oriented sample.
 */
if (import.meta.env.DEV) {
  OpenFeature.setLogger(console);
  const diagnosticHook: Hook = {
    before(hc) {
      console.debug('[OpenFeature]', 'before', hc.flagKey, {
        clientDomain: hc.clientMetadata.domain,
        targetingKey: hc.context.targetingKey,
      });
    },
    after(hc, details) {
      console.debug('[OpenFeature]', 'after', hc.flagKey, {
        value: details.value,
        reason: details.reason,
        errorCode: details.errorCode,
      });
    },
    error(hc, err) {
      console.warn('[OpenFeature]', 'evaluation error', hc.flagKey, err);
    },
  };
  OpenFeature.addHooks(diagnosticHook);
}

/* -------------------------------------------------------------------------- */
/* Domain-scoped evaluation context sync                                      */
/* -------------------------------------------------------------------------- */

/**
 * Runs under the **outer** `OpenFeatureProvider` (`client={anonWeb}` → domain `anon-web`).
 * `useContextMutator` infers the domain from React context and calls
 * `OpenFeature.setContext('anon-web', …)`, so anonymous traffic is isolated from the user domain’s
 * context map entry.
 * @returns {null} Renders nothing; only syncs evaluation context for the anonymous domain.
 */
function SyncAnonContext() {
  const { setContext } = useContextMutator();
  useEffect(() => {
    void setContext({ targetingKey: 'anonymous' });
  }, [setContext]);
  return null;
}

/**
 * Runs under the **inner** `OpenFeatureProvider` (`client={userWeb}` → domain `user-web`).
 * Sets a stable synthetic user id so flag rules in Harness can target signed-in behavior separately
 * from the anonymous shell.
 * @param {string} userId Value stored as `targetingKey` for the user domain (demo: `user-1`).
 * @returns {null} Renders nothing; only syncs evaluation context for the signed-in user domain.
 */
function SyncUserContext({ userId }: { userId: string }) {
  const { setContext } = useContextMutator();
  useEffect(() => {
    void setContext({ targetingKey: userId });
  }, [userId, setContext]);
  return null;
}

/* -------------------------------------------------------------------------- */
/* Vendor provider setup (Harness FME / Split browser SDK)                    */
/* -------------------------------------------------------------------------- */

/** Client-side SDK key from your Harness / Split environment (do not commit real secrets to public repos). */
const AUTHORIZATION_KEY = '<YOUR_AUTHORIZATION_KEY>';

/**
 * Split factory: owns network I/O and local flag state. `core.key` is the initial Split customer id
 * for this factory; we align it with anonymous traffic for a predictable starting point.
 */
const splitFactory = SplitFactory({
  core: { authorizationKey: AUTHORIZATION_KEY, key: 'anonymous' },
  debug: true,
});

/** Bridges OpenFeature’s provider interface to the Split SDK instance created above. */
const openFeatureProvider = new OpenFeatureSplitProvider(splitFactory);

/**
 * Single **default** provider for the whole app. Named clients (`anon-web`, `user-web`) both resolve
 * through this instance unless you later call `OpenFeature.setProvider('some-domain', otherProvider)`.
 */
void OpenFeature.setProvider(openFeatureProvider);

/* -------------------------------------------------------------------------- */
/* UI helpers                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Renders one flag via `useFlag`. The second argument is the **default** returned when evaluation
 * errors (e.g. unknown flag → Split `control` → OpenFeature error path). It is not a separate API
 * shape like `{ defaultValue }`.
 * @param {object} props Component props.
 * @param {string} props.label Section heading for the demo panel.
 * @param {string} props.flagKey Harness / Split feature flag name evaluated in the current provider subtree.
 * @returns {ReactElement} A bordered section showing flag key, resolved value, and error note if any.
 */
function DemoPanel(props: { label: string; flagKey: string }): ReactElement {
  const { label, flagKey } = props;
  const query = useFlag(flagKey, '(flag missing)');

  return (
    <section
      style={{
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: 16,
        marginTop: 12,
        background: '#fafafa',
      }}
    >
      <h3 style={{ marginTop: 0 }}>{label}</h3>
      <p style={{ margin: '8px 0' }}>
        <strong>Flag key:</strong> <code>{flagKey}</code>
      </p>
      <p style={{ margin: '8px 0' }}>
        <strong>Value:</strong> {query.value}
      </p>
      {query.isError ? (
        <p style={{ margin: '8px 0', fontSize: 13, color: '#a40' }}>
          <strong>OpenFeature resolution note:</strong> {String(query.reason)} — {query.errorMessage}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Root layout: outer provider tree always mounted (anonymous shell), inner tree mounted only when
 * `loggedIn` simulates a signed-in session.
 * **Client memoization:** `getClient` is cheap but returns a fresh object identity if called every
 * render; `useMemo` with an empty dependency list keeps one stable client per domain for the app
 * lifetime, which matches typical “create clients once” usage.
 * @returns {ReactElement} The full demo page with nested OpenFeature provider trees.
 */
export function App(): ReactElement {
  const [loggedIn, setLoggedIn] = useState(false);
  const userId = 'user-1';

  const anonWeb = useMemo(() => OpenFeature.getClient('anon-web'), []);
  const userWeb = useMemo(() => OpenFeature.getClient('user-web'), []);

  return (
    <OpenFeatureProvider client={anonWeb}>
      <SyncAnonContext />

      <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '24px auto', padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Nested OpenFeature clients</h1>
        <p>
          This app uses one <code>OpenFeature.setProvider(myProvider)</code> and two named clients:{' '}
          <code>OpenFeature.getClient(&apos;anon-web&apos;)</code> for the always-visible anonymous
          shell and <code>OpenFeature.getClient(&apos;user-web&apos;)</code> for the signed-in subtree.
          Each subtree wraps children in <code>OpenFeatureProvider</code> with the matching{' '}
          <code>client</code> so hooks resolve under the correct domain. The{' '}
          <strong>client domain</strong> (<code>anon-web</code> / <code>user-web</code>) is separate
          from the Split <strong>targeting key</strong> set via <code>useContextMutator().setContext</code>{' '}
          (<code>anonymous</code> vs a user id). A single Split-backed provider shares one underlying
          Split SDK client; OpenFeature still supplies per-domain evaluation context on each call.
          Define <code>anon-flag</code> and <code>user-flag</code> in Harness FME. If the value stays
          at the default string, read the red resolution line or devtools hooks — unknown flags often
          surface as Split <code>control</code> and become OpenFeature evaluation errors.
        </p>

        <DemoPanel label="Anonymous shell — anon-web client" flagKey="anon-flag" />

        <button
          type="button"
          onClick={() => setLoggedIn((v) => !v)}
          style={{ marginTop: 16, padding: '8px 14px', fontSize: 16 }}
        >
          {loggedIn ? 'Sign out (unmount user-web subtree)' : 'Sign in (mount user-web subtree)'}
        </button>

        {loggedIn ? (
          <OpenFeatureProvider client={userWeb}>
            <SyncUserContext userId={userId} />
            <DemoPanel label="Signed-in user — user-web client" flagKey="user-flag" />
          </OpenFeatureProvider>
        ) : (
          <p style={{ marginTop: 16, color: '#555' }}>
            Sign in to mount the inner <code>OpenFeatureProvider</code>. The inner tree evaluates{' '}
            <code>user-flag</code> on the <code>user-web</code> client; the panel above evaluates{' '}
            <code>anon-flag</code> on <code>anon-web</code>. Both use the same default OpenFeature
            provider instance registered at startup.
          </p>
        )}
      </main>
    </OpenFeatureProvider>
  );
}
