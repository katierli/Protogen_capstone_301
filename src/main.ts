import './assets/main.css'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
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
          primary: '#6A1B9A',
          secondary: '#FF6F3C',
          accent: '#EC008C',
          info: '#29ABE2',
          success: '#43A047',
          warning: '#FDD835',
          error: '#E53935',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'on-accent': '#FFFFFF',
          background: '#F5F7FA',
          surface: '#FFFFFF',
        },
      },
      elaDark: {
        dark: true,
        colors: {
          primary: '#C77DFF',
          secondary: '#FF8A5B',
          accent: '#FF5FA9',
          info: '#4FC3F7',
          success: '#66BB6A',
          warning: '#FFCA28',
          error: '#EF5350',
          'on-primary': '#1A0B2E',
          'on-secondary': '#1A0B2E',
          'on-accent': '#1A0B2E',
          background: '#121212',
          surface: '#1E1E1E',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(vuetify)

app.mount('#app')
