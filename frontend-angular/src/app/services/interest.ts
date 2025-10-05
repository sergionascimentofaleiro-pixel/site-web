import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Interest {
  interest_id: number;
  interest_name: string;
  interest_icon: string;
  display_order: number;
}

export interface InterestCategory {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_order: number;
  interests: Interest[];
}

export interface ProfileInterest {
  interest_id: number;
  interest_name: string;
  interest_icon: string;
  category_name: string;
  category_icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class InterestService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/interests';

  getAllInterests(language?: string): Observable<InterestCategory[]> {
    const lang = language || localStorage.getItem('language') || 'fr';
    return this.http.get<InterestCategory[]>(`${this.apiUrl}/all?lang=${lang}`);
  }

  getMyInterests(language?: string): Observable<ProfileInterest[]> {
    const lang = language || localStorage.getItem('language') || 'fr';
    return this.http.get<ProfileInterest[]>(`${this.apiUrl}/my?lang=${lang}`);
  }

  setMyInterests(interestIds: number[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/my`, { interestIds });
  }
}
