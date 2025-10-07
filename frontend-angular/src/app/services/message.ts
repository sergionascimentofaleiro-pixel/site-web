import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MessageData {
  id: number;
  match_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_photo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Message {
  private readonly apiUrl = 'http://localhost:3000/api/messages';

  constructor(private http: HttpClient) {}

  sendMessage(matchId: number, receiverId: number, message: string): Observable<any> {
    return this.http.post(this.apiUrl, { matchId, receiverId, message });
  }

  getConversation(matchId: number, limit: number = 50): Observable<MessageData[]> {
    return this.http.get<MessageData[]>(`${this.apiUrl}/${matchId}?limit=${limit}`);
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread-count`);
  }

  getUnreadCounts(): Observable<{ [matchId: number]: number }> {
    return this.http.get<{ [matchId: number]: number }>(`${this.apiUrl}/unread-counts`);
  }

  getConversations(): Observable<MessageData[]> {
    return this.http.get<MessageData[]>(`${this.apiUrl}/conversations`);
  }
}
