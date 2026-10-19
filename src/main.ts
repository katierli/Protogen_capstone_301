import './assets/main.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { Chart, registerables } from 'chart.js'
import App from './App.vue'

Chart.register(...registerables)

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
  theme: {
    defaultTheme: 'elaLight',
    themes: {
      elaLight: {
        dark: false,
        colors: {
          primary: '#1A237E',
          secondary: '#00897B',
          success: '#43A047',
          warning: '#FDD835',
          error: '#E53935',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          background: '#F5F7FA',
          surface: '#FFFFFF',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(vuetify)

app.mount('#app')
