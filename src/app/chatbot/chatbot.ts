// component chatbot.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ChatbotService } from './chatbotservice';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger';

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
  private pageContext: string | null = window.location.pathname; // fallback
  private accessToken: string | null = null;
  private isInitialized = false; // Track if chatbot is ready

  constructor(private chatbotService: ChatbotService) {
    // Listen for postMessage from parent
    window.addEventListener('message', (event) => {
      if (event.origin === environment.parentOrigin && event.data) {
        // Handle page context updates
        if (event.data.type === 'PAGE_CONTEXT' && typeof event.data.page_context === 'string') {
          // Format page context with descriptive prefix
          this.pageContext = `I am on ${event.data.page_context}`;
          Logger.log('Received page context:', this.pageContext);
        }
        
        // Handle access token updates
        if (event.data.type === 'ACCESS_TOKEN' && event.data.accessToken) {
          this.accessToken = event.data.accessToken;
          Logger.log('Received access token:', this.accessToken ? 'Token received' : 'No token');
        }
      }
    });
  }

  getPageContext(): string | null {
    return this.pageContext;
  }

  toggleChat() {
    if (!this.showChat) {
      // Opening chat - show immediately, validate in background
      this.showChat = true;
      this.messages = [
        { sender: 'bot', text: 'Hey DocNow!👋 How can I help you today?' }
      ];
      
      // Validate in background without blocking UI
      this.validateInBackground();
    } else {
      // Closing chat
      this.showChat = false;
    }
  }

  /**
   * Validate chatbot in background without blocking UI
   */
  private async validateInBackground(): Promise<void> {
    try {
      Logger.log('Validating backend connection in background...');

      // Validate we have basic data
      if (!this.pageContext && !this.accessToken) {
        Logger.warn('No page context or token available');
      }

      // Make a test API call to validate backend connectivity
      const testResponse = await firstValueFrom(this.chatbotService.validateConnection());
      
      if (testResponse) {
        Logger.log('Backend connection validated successfully');
        this.isInitialized = true;
      }
    } catch (error) {
      Logger.error('Failed to validate chatbot:', error);
      // Don't show error to user immediately, only log it
      // User will see error when they try to send a message
    }
  }

  sendMessage() {
    const userMsg = this.input.trim();
    if (!userMsg) return;

    // Check if chatbot is initialized
    if (!this.isInitialized) {
      Logger.warn('Chatbot not initialized, attempting to validate...');
      this.validateInBackground();
      // Continue with message anyway - validation will happen in background
    }

    this.messages.push({ sender: 'user', text: userMsg });
    this.input = '';
    this.loading = true;

    // Log the access token being used (for debugging)
    Logger.log('Using access token:', this.accessToken ? 'Token available' : 'No token');

    this.chatbotService.queryBot(userMsg, this.getPageContext(), this.accessToken).subscribe({
      next: (response: BotResponse) => {
        this.messages.push({ sender: 'bot', text: response.answer });
        Logger.log('Chatbot Response', response);
        this.loading = false;
      },
      error: (error: any) => {
        Logger.error('Chatbot Error', error);
        Logger.error('Error Details', {
          status: error?.status,
          message: error?.message,
          url: error?.url
        });
        this.messages.push({ sender: 'bot', text: 'Sorry, something went wrong. I cannot help you right now. Please try again later.' });
        this.loading = false;
      }
    });
  }
}
