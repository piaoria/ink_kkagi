import { AppController } from './app/AppController.js';
import './styles/global.css';
import './styles/screens.css';
import './styles/game.css';

const root = document.querySelector('#app');
const app = new AppController(root);

app.start();

