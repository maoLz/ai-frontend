import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import { createPinia } from 'pinia'
import VMdEditor from '@kangc/v-md-editor';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';
import '@kangc/v-md-editor/lib/theme/style/vuepress.css';
import Prism from 'prismjs';
import VMdPreview from '@kangc/v-md-editor/lib/preview';


const app = createApp(App)

VMdEditor.use(vuepressTheme, {
  Prism
})
VMdPreview.use(vuepressTheme, {
  Prism
})

app.use(ElementPlus)
app.use(router)
app.use(createPinia())
app.use(VMdEditor)
app.use(VMdPreview)

app.mount('#app')
