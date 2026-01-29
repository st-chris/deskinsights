import type { store } from '../store';

// To avoid circular dependency issues, store types are defined here
// and imported in other files as needed.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
