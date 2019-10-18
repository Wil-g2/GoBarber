import express from 'express';
import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = express();

    this.middlewares();
    this.routes();
  }

  // Middlewares application method
  middlewares() {
    this.server.use(express.json());
  }

  // Routes application
  routes() {
    this.server.use(routes);
  }
}

export default new App().server;
