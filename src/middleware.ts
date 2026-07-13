// Next.js middleware entry-point.  The actual logic lives in proxy.ts so it
// can be unit-tested independently; here we simply re-export it under the
// conventional name that the framework requires.
export { proxy as middleware, config } from './proxy';
