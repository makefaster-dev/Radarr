// Loads the error-reporting SDK off the boot path: the store gets a
// pass-through middleware immediately and swaps in the real one once the
// SDK chunk arrives, so none of its code or initialization competes with
// first render.
export default function createSentryMiddleware() {
  const { analytics } = window.Radarr;

  if (!analytics) {
    return;
  }

  let middleware = null;

  import(/* webpackChunkName: "sentry" */ './initializeSentryMiddleware').then(
    ({ default: initializeSentryMiddleware }) => {
      middleware = initializeSentryMiddleware();
    }
  );

  return (store) => (next) => {
    let chain = null;

    return (action) => {
      if (middleware) {
        if (!chain) {
          chain = middleware(store)(next);
        }

        return chain(action);
      }

      return next(action);
    };
  };
}
