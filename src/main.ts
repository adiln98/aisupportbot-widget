import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app'; // <-- this is your actual root
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));