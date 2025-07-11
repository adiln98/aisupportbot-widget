// component chatbot.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from './chatbotservice';
import { environment } from '../../environments/environment';

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
  showChat = false; // Hide chat on load, show only button
  input = '';
  messages: { sender: 'user' | 'bot'; text: string }[] = [
    { sender: 'bot', text: 'Hey DocNow!👋' }
  ];
  loading = false;
  private pageContext: string = window.location.pathname; // fallback

  constructor(private chatbotService: ChatbotService) {
    // Listen for postMessage from parent
    window.addEventListener('message', (event) => {
      if (
        event.origin === environment.parentOrigin &&
        event.data &&
        event.data.type === 'PAGE_CONTEXT' &&
        typeof event.data.page_context === 'string'
      ) {
        this.pageContext = event.data.page_context;
        // Optionally, log for debugging
        // console.log('[Chatbot] Received page context:', this.pageContext);
      }
    });
  }

  getPageContext(): string {
    return this.pageContext;
  }

  toggleChat() {
    this.showChat = !this.showChat;
  }

  sendMessage() {
    const userMsg = this.input.trim();
    if (!userMsg) return;

    this.messages.push({ sender: 'user', text: userMsg });
    this.input = '';
    this.loading = true;

    this.chatbotService.queryBot(userMsg, this.getPageContext()).subscribe({
      next: (response: BotResponse) => {
        this.messages.push({ sender: 'bot', text: response.answer });
        console.log('[Chatbot Response]', response);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('[Chatbot Error]', error);
        console.error('[Error Details]', {
          status: error?.status,
          message: error?.message,
          url: error?.url
        });
        this.messages.push({ sender: 'bot', text: 'Sorry, something went wrong. Check console for details.' });
        this.loading = false;
      }
    });
  }

  private cleanHtmlResponse(htmlText: string): string {
    // Remove HTML tags but keep line breaks
    let cleanText = htmlText
      .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
      .replace(/<[^>]*>/g, '')        // Remove all other HTML tags
      .replace(/&rsaquo;/g, '›')      // Convert HTML entity to simple character
      .replace(/&nbsp;/g, ' ')        // Convert non-breaking space to regular space
      .replace(/\n\s*\n/g, '\n')      // Remove extra blank lines
      .trim();                         // Remove leading/trailing whitespace
    
    return cleanText;
  }
}
