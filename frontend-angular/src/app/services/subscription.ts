import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan {
  id: string;
  nameKey: string;
  durationKey: string;
  price: string;
  currency?: string;
  descriptionKey: string;
  recurring?: boolean;
  savingsKey?: string;
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription?: {
    id: number;
    user_id: number;
    subscription_type: string;
    start_date: string;
    end_date: string;
    status: string;
    cancelled_at?: string | null;
    will_renew: boolean;
  } | null;
  conversationCount: number;
  freeLimit: number;
  conversationsRemaining: number;
  canAccessNewConversations: boolean;
  userConversations: number[];
}

export interface ConversationAccess {
  canAccess: boolean;
  reason: string;
  remaining?: number;
  conversationCount?: number;
  limit?: number;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class Subscription {
  private readonly apiUrl = 'http://localhost:3000/api/subscription';

  constructor(private http: HttpClient) {}

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.apiUrl}/plans`);
  }

  getStatus(): Observable<SubscriptionStatus> {
    return this.http.get<SubscriptionStatus>(`${this.apiUrl}/status`);
  }

  canAccessConversation(matchId: number): Observable<ConversationAccess> {
    return this.http.get<ConversationAccess>(`${this.apiUrl}/can-access/${matchId}`);
  }

  createPayPalOrder(planId: string): Observable<{ orderId: string }> {
    return this.http.post<{ orderId: string }>(`${this.apiUrl}/create-order`, { planId });
  }

  capturePayPalOrder(orderId: string, planId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/capture-order`, { orderId, planId });
  }

  cancelSubscription(): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancel`, {});
  }

  getPaymentHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payment-history`);
  }
}
