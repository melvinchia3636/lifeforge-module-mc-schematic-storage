import { defineModuleClientConfig } from '@lifeforge/configs/vite'

export default defineModuleClientConfig(
  {
    dirname: __dirname
  },
  {
    optimizeDeps: {
      exclude: ['block-model-renderer']
    }
  }
)
