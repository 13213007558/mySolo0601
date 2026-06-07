import React from 'react';

export default function Toast({ type, message }: { type: 'success' | 'error' | 'warn'; message: string }) {
  return <div className={`toast ${type}`}>{message}</div>;
}
