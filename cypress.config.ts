/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'jcfv2t',
  e2e: {
    setupNodeEvents(_on, _config) {
      // console.log('config', config);
      // implement node event listeners here
    },
  },
});
