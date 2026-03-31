/** Example: two OpenFeature client domains (`anon-web`, `user-web`) with nested providers. Split wiring is in `openfeature-bootstrap.ts`. */

import { OpenFeature, OpenFeatureProvider, useContextMutator, useFlag } from '@openfeature/react-sdk';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

function SyncAnonContext() {
  const { setContext } = useContextMutator();
  useEffect(() => {
    void setContext({ targetingKey: 'anonymous' });
  }, [setContext]);
  return null;
}

function SyncUserContext({ userId }: { userId: string }) {
  const { setContext } = useContextMutator();
  useEffect(() => {
    void setContext({ targetingKey: userId });
  }, [userId, setContext]);
  return null;
}

function DemoPanel(props: { label: string; flagKey: string }): ReactElement {
  const { label, flagKey } = props;
  const q = useFlag(flagKey, '(flag missing)');

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
        <strong>Value:</strong> {q.value}
      </p>
      {q.isError ? (
        <p style={{ margin: '8px 0', fontSize: 13, color: '#a40' }}>
          <strong>OpenFeature resolution note:</strong> {String(q.reason)} — {q.errorMessage}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Demo shell + optional signed-in subtree, each bound to a different OpenFeature client.
 * @returns {ReactElement} Root layout with nested OpenFeature providers.
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
        <p style={{ margin: '0 0 12px' }}>
          Two clients: <code>anon-web</code> (anonymous shell) and <code>user-web</code> (after Sign in). Each uses{' '}
          <code>OpenFeatureProvider</code> with the matching <code>client</code>. Split is set up per domain in{' '}
          <code>openfeature-bootstrap.ts</code> so anonymous vs signed-in traffic use different Split customer keys (
          <code>anonymous</code> vs <code>user-1</code>).
        </p>
        <p style={{ margin: '0 0 12px' }}>
          Add <code>anon-flag</code> and <code>user-flag</code> in Harness. If you see the default string, check the
          resolution line or console; missing flags often come back as Split <code>control</code>.
        </p>

        <DemoPanel label="Anonymous shell — anon-web client" flagKey="anon-flag" />

        <button
          type="button"
          onClick={() => setLoggedIn((v) => !v)}
          style={{ marginTop: 16, padding: '8px 14px', fontSize: 16 }}
        >
          {loggedIn ? 'Sign out' : 'Sign in'}
        </button>

        {loggedIn ? (
          <OpenFeatureProvider client={userWeb}>
            <SyncUserContext userId={userId} />
            <DemoPanel label="Signed-in user — user-web client" flagKey="user-flag" />
          </OpenFeatureProvider>
        ) : (
          <p style={{ marginTop: 16, color: '#555' }}>
            Sign in to mount <code>user-web</code> and evaluate <code>user-flag</code>.
          </p>
        )}
      </main>
    </OpenFeatureProvider>
  );
}
