import { createApp } from 'vue';
import App from './App.vue';
import { installPrintStyles } from './print/installPrintStyles.js';
import './styles.css';

installPrintStyles();
createApp(App).mount('#root');
