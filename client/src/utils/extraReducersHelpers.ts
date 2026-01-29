import {
  isPending,
  isRejected,
  isFulfilled,
  type UnknownAction,
} from '@reduxjs/toolkit';

export const isAuthThunkPending = (action: UnknownAction) =>
  isPending(action) && action.type.startsWith('auth/');

export const isAuthThunkFulfilled = (action: UnknownAction) =>
  isFulfilled(action) && action.type.startsWith('auth/');

export const isAuthThunkRejected = (action: UnknownAction) =>
  isRejected(action) && action.type.startsWith('auth/');
