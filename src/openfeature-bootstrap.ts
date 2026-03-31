/**
 * Registers Split OpenFeature providers for `anon-web` and `user-web`, waits until ready, seeds domain context.
 * See README: “Why `openfeature-bootstrap.ts`?” for rationale.
 */
import { OpenFeature, type Hook } from '@openfeature/react-sdk';
import { OpenFeatureSplitProvider } from '@splitsoftware/openfeature-web-split-provider';
import { SplitFactory } from '@splitsoftware/splitio-browserjs';

const authKey =
  (import.meta.env.VITE_SPLIT_BROWSER_KEY as string | undefined)?.trim() || '<YOUR_AUTHORIZATION_KEY>';

async function registerSplitDomain(domain: string, splitCustomerKey: string): Promise<void> {
  const factory = SplitFactory({
    core: { authorizationKey: authKey, key: splitCustomerKey },
    debug: Boolean(import.meta.env.DEV),
  });
  await OpenFeature.setProviderAndWait(domain, new OpenFeatureSplitProvider(factory));
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

  await registerSplitDomain('anon-web', 'anonymous');
  await registerSplitDomain('user-web', 'user-1');
  await OpenFeature.setContext('anon-web', { targetingKey: 'anonymous' });
  await OpenFeature.setContext('user-web', { targetingKey: 'user-1' });
}
