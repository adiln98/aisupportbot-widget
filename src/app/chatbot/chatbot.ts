// component chatbot.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ChatbotService } from './chatbotservice';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

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
export class ChatbotComponent implements OnDestroy {
  showChat = false;
  isClosing = false;
  input = '';
  messages: ChatMessage[] = [
    { sender: 'bot', text: 'Hey DocNow!👋', timestamp: new Date() }
  ];
  loading = false;
  private pageContext: string | null = window.location.pathname;
  private accessToken: string | null = null;
  private isInitialized = false;
  private closeTimeout?: number;

  constructor(private chatbotService: ChatbotService) {
    window.addEventListener('message', (event) => {
      if (event.origin === environment.parentOrigin && event.data) {
        if (event.data.type === 'PAGE_CONTEXT' && typeof event.data.page_context === 'string') {
          this.pageContext = `I am on ${event.data.page_context}`;
          Logger.log('Received page context:', this.pageContext);
        }
        
        if (event.data.type === 'ACCESS_TOKEN' && event.data.accessToken) {
          this.accessToken = event.data.accessToken;
          Logger.log('Received access token:', this.accessToken ? 'Token received' : 'No token');
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
  }

  getPageContext(): string | null {
    return this.pageContext;
  }

  toggleChat(): void {
    if (!this.showChat && !this.isClosing) {
      this.showChat = true;
      this.isClosing = false;
      this.messages = [
        { sender: 'bot', text: 'Hey DocNow!👋 How can I help you today?', timestamp: new Date() }
      ];
      this.validateInBackground();
    } else if (this.showChat && !this.isClosing) {
      this.closeChat();
    }
  }

  private closeChat(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    this.isClosing = true;
    
    this.closeTimeout = window.setTimeout(() => {
      this.showChat = false;
      this.isClosing = false;
      this.closeTimeout = undefined;
    }, 150);
  }

  private async validateInBackground(): Promise<void> {
    try {
      Logger.log('Validating backend connection in background...');

      if (!this.pageContext && !this.accessToken) {
        Logger.warn('No page context or token available');
      }

      const testResponse = await firstValueFrom(this.chatbotService.validateConnection());
      
      if (testResponse) {
        Logger.log('Backend connection validated successfully');
        this.isInitialized = true;
      }
    } catch (error) {
      Logger.error('Failed to validate chatbot:', error);
    }
  }

  sendMessage(): void {
    const userMsg = this.input.trim();
    if (!userMsg) return;

    if (!this.isInitialized) {
      Logger.warn('Chatbot not initialized, attempting to validate...');
      this.validateInBackground();
    }

    this.messages.push({ 
      sender: 'user', 
      text: userMsg, 
      timestamp: new Date() 
    });
    this.input = '';
    this.loading = true;

    Logger.log('Using access token:', this.accessToken ? 'Token available' : 'No token');

    this.chatbotService.queryBot(userMsg, this.getPageContext(), this.accessToken).subscribe({
      next: (response: BotResponse) => {
        this.messages.push({ 
          sender: 'bot', 
          text: response.answer, 
          timestamp: new Date() 
        });
        Logger.log('Chatbot Response', response);
        this.loading = false;
      },
      error: (error: any) => {
        this.handleError(error);
        Logger.error('Error Details', {
          status: error?.status,
          message: error?.message,
          url: error?.url
        });
      }
    });
  }

  private handleError(error: any): void {
    this.loading = false;
    this.messages.push({ 
      sender: 'bot', 
      text: 'Sorry, something went wrong. Please try again.',
      timestamp: new Date()
    });
    Logger.error('Chatbot Error:', error);
  }
}
