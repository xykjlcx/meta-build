import { use } from 'react';
import { StyleContext } from './style-provider';

export function useStyle() {
  const ctx = use(StyleContext);
  if (!ctx) throw new Error('useStyle must be used within StyleProvider');
  return ctx;
}
