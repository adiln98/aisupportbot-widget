import { bootstrapApplication } from '@angular/platform-browser';
import { ChatbotComponent } from './app/chatbot/chatbot';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(ChatbotComponent, {
  providers: [provideHttpClient()]
}).catch((err) => console.error(err));