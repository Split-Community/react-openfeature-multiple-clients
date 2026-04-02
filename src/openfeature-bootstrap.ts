/**
 * Registers Split OpenFeature providers for `anon-web` and `user-web`, waits until ready, seeds domain context.
 * See README: “Why `openfeature-bootstrap.ts`?” for rationale.
 */
import { OpenFeature, type Hook } from '@openfeature/react-sdk';
import { OpenFeatureSplitProvider } from '@splitsoftware/openfeature-web-split-provider';
import { SplitFactory } from '@splitsoftware/splitio-browserjs';

const authKey =
  (import.meta.env.VITE_SPLIT_BROWSER_KEY as string | undefined)?.trim() || '<YOUR_AUTHORIZATION_KEY>';

/**
 * Creates a SINGLE shared Split factory to avoid duplicating resources.
 * Multiple providers can share the same factory - each provider will call
 * factory.client(targetingKey) internally based on context.
 */
function createSharedFactory() {
  return SplitFactory({
    core: {
      authorizationKey: authKey,
      key: 'bootstrap-key' // Initial key, will be overridden by context
    },
    debug: Boolean(import.meta.env.DEV),
  });
}

/** Call from `main.tsx` before `createRoot(…).render` so flags are safe to read on first paint. */
export async function bootstrapOpenFeature(): Promise<void> {
  if (import.meta.env.DEV) {
    OpenFeature.setLogger(console);
    const hook: Hook = {
      before(hc) {
        console.debug('[OpenFeature]', hc.flagKey, hc.clientMetadata.domain, hc.context.targetingKey);
      },
      after(hc, d) {
        console.debug('[OpenFeature]', hc.flagKey, d.value, d.reason);
      },
      error(hc, err) {
        console.warn('[OpenFeature]', hc.flagKey, err);
      },
    };
    OpenFeature.addHooks(hook);
  }

  // ONE shared factory for efficiency (shared network, cache, storage)
  const sharedFactory = createSharedFactory();

  // Register two providers (one per domain) that share the same factory
  // Each provider will internally call factory.client(targetingKey) based on context
  await OpenFeature.setProviderAndWait('anon-web', new OpenFeatureSplitProvider(sharedFactory));
  await OpenFeature.setProviderAndWait('user-web', new OpenFeatureSplitProvider(sharedFactory));

  // Set initial context for anonymous domain (static, won't change)
  await OpenFeature.setContext('anon-web', { targetingKey: 'anonymous' });

  // Initial context for user domain (will be updated dynamically in React components)
  await OpenFeature.setContext('user-web', { targetingKey: 'user-1' });
}
