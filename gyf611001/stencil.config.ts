import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'fencing-referee-panel',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
  globalStyle: 'src/global/global.css',
  bundles: [
    { components: ['referee-panel', 'score-display', 'keyboard-mapper', 'controversy-mode', 'countdown-timer', 'xml-exporter', 'offline-cache', 'pin-validator'] }
  ],
};
