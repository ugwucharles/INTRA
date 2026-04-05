import { AsyncLocalStorage } from 'node:async_hooks';

export type TenantStore = {
  orgId?: string;
  userId?: string;
  role?: string;
  /**
   * Used for very controlled internal operations (e.g., auth/signup) where there is
   * no logged-in tenant yet. Prefer explicit org scoping instead of bypassing.
   */
  bypassTenantEnforcement?: boolean;
};

const als = new AsyncLocalStorage<TenantStore>();

export const TenantContext = {
  run<T>(store: TenantStore, fn: () => T): T {
    return als.run(store, fn);
  },

  getStore(): TenantStore | undefined {
    return als.getStore();
  },

  getOrgId(): string | undefined {
    return als.getStore()?.orgId;
  },

  isBypassEnabled(): boolean {
    return !!als.getStore()?.bypassTenantEnforcement;
  },
};
