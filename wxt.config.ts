import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['activeTab', 'storage', 'scripting'],
    host_permissions: ['<all_urls>']
  },
  modules: ['@wxt-dev/module-react'],
});
