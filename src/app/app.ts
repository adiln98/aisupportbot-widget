import { Component } from '@angular/core';
import { ChatbotComponent } from './chatbot/chatbot';   //import chatbot comp

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatbotComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {}
