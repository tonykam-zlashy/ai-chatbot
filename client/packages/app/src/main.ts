import '@/assets/main.css'
// 引入 adp-chat-component 组件库样式（生产构建后的完整样式，包含 TDesign 主题变量）
import 'adp-chat-component/style.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import router from '@/router'
import i18n from '@/i18n'
import { setResponseInterceptor } from 'adp-chat-component'

// Keep component API responses unwrapped without redirecting public users to login.
setResponseInterceptor(
  (response) => response.data,
  async (error) => {
    console.log('[error] app', error)
    return Promise.reject(error)
  }
)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
