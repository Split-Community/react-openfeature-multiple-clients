/**
 * Example: two OpenFeature client domains (`anon-web`, `user-web`) with nested providers.
 *
 * Demonstrates:
 * 1. One shared Split factory (efficient - no duplicate resources)
 * 2. Static context (anon-web): set once in bootstrap, no React hooks needed
 * 3. Dynamic context (user-web): updated via setContext when userId changes
 */

import { OpenFeature, OpenFeatureProvider, useContextMutator, useFlag } from '@openfeature/react-sdk';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

/**
 * Updates user-web context when userId changes.
 * This triggers provider.onContextChange() which calls factory.client(newKey).
 */
function SyncUserContext({ userId }: { userId: string }) {
  const { setContext } = useContextMutator();
  useEffect(() => {
    console.log(`[App] Setting context for user-web: ${userId}`);
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
  const [userId, setUserId] = useState('user-1');
  const anonWeb = useMemo(() => OpenFeature.getClient('anon-web'), []);
  const userWeb = useMemo(() => OpenFeature.getClient('user-web'), []);

  return (
    <OpenFeatureProvider client={anonWeb}>
      {/* No SyncAnonContext needed - anonymous context is static (set in bootstrap) */}

      <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '24px auto', padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>OpenFeature + Split: Multiple Clients</h1>

        <section style={{ background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>📚 What This Demonstrates</h2>
          <ul style={{ margin: '8px 0', paddingLeft: 20, fontSize: 14 }}>
            <li><strong>One shared Split factory</strong> (efficient: shared network, cache, storage)</li>
            <li><strong>Two OpenFeature domains</strong> (<code>anon-web</code>, <code>user-web</code>) with separate providers</li>
            <li><strong>Static context</strong> (anonymous): set once in bootstrap</li>
            <li><strong>Dynamic context</strong> (user): updated with <code>setContext()</code> when user ID changes</li>
          </ul>
        </section>

        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#666' }}>
          Create <code>anon-flag</code> and <code>user-flag</code> in Harness. Target them differently (e.g., by user key or attributes).
        </p>

        <DemoPanel label="Anonymous Panel (anon-web domain)" flagKey="anon-flag" />

        <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setLoggedIn((v) => !v)}
            style={{ padding: '8px 14px', fontSize: 16 }}
          >
            {loggedIn ? 'Sign out' : 'Sign in'}
          </button>

          {loggedIn && (
            <>
              <label htmlFor="userId" style={{ fontSize: 14 }}>User ID:</label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-1"
                style={{ padding: '6px 10px', fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <span style={{ fontSize: 13, color: '#666' }}>← Change to see dynamic context update</span>
            </>
          )}
        </div>

        {loggedIn ? (
          <OpenFeatureProvider client={userWeb}>
            {/* SyncUserContext updates context when userId changes - triggers provider.onContextChange() */}
            <SyncUserContext userId={userId} />
            <DemoPanel label={`User Panel (user-web domain, key: ${userId})`} flagKey="user-flag" />
          </OpenFeatureProvider>
        ) : (
          <p style={{ marginTop: 16, color: '#555', fontSize: 14 }}>
            Sign in to mount <code>user-web</code> provider and evaluate <code>user-flag</code>.
          </p>
        )}
      </main>
    </OpenFeatureProvider>
  );
}
