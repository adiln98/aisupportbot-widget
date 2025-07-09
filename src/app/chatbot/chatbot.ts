// chatbot.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from './chatbotservice';

interface BotResponse {
  answer: string;
  follow_up_questions?: string[];
  conversation_id?: string;
  data_types_used?: string[];
  docs?: any;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss']
})
export class ChatbotComponent {
  showChat = false;
  input = '';
  messages: { sender: 'user' | 'bot'; text: string }[] = [];
  loading = false;

  constructor(private chatbotService: ChatbotService) {}

  toggleChat() {
    this.showChat = !this.showChat;
  }

sendMessage() {
  const userMsg = this.input.trim();
  if (!userMsg) return;

  this.messages.push({ sender: 'user', text: userMsg });
  this.input = '';
  this.loading = true;

  this.chatbotService.queryBot(userMsg).subscribe({
    next: (response: BotResponse) => {
      this.messages.push({ sender: 'bot', text: response.answer });
      console.log('[Chatbot Response]', response);
      this.loading = false;
    },
    error: (error: unknown) => {
      console.error('[Chatbot Error]', error);
      this.messages.push({ sender: 'bot', text: 'Sorry, something went wrong.' });
      this.loading = false;
    }
  });
}
}
