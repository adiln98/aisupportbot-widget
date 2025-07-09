import { bootstrapApplication } from '@angular/platform-browser';
import { ChatbotComponent } from './app/chatbot/chatbot';
import { ChatbotService } from './app/chatbot/chatbotservice';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(ChatbotComponent, {
  providers: [provideHttpClient(), ChatbotService]
}).catch(err => console.error(err));
