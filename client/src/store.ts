import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/auth/auth';
import { setupTokenRefreshInterceptor } from './services/api';
import workspaceReducer from './reducers/workspace/workspace';
import documentReducer from './reducers/document/document';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspaces: workspaceReducer,
    documents: documentReducer,
  },
});

setupTokenRefreshInterceptor(store);
