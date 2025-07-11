// chatbotservice.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ChatQueryPayload {
  query: string;
  n_results?: number;
  conversation_id?: string | null;
  user_email?: string | null;
  data_types?: string[];
  page_context?: string;
}

interface BotResponse {
  answer: string;
  follow_up_questions?: string[];
  conversation_id?: string;
  data_types_used?: string[];
  docs?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://localhost:8000/api/agent/query';

  constructor(private http: HttpClient) {}

  queryBot(userQuery: string, pageContext: string): Observable<BotResponse> {
    const payload: ChatQueryPayload = {
      query: userQuery,
      n_results: 5,
      conversation_id: null,
      user_email: null,
      page_context: pageContext
    };

    console.log('[ChatbotService] Sending payload:', payload);
    console.log('[ChatbotService] Stringified payload:', JSON.stringify(payload, null, 2));
    
    return this.http.post<BotResponse>(this.apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }
}
