import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MatchData {
  matchId: number;
  matchedAt: string;
  otherUser: {
    id: number;
    name: string;
    photo: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class Match {
  private readonly apiUrl = 'http://localhost:3000/api/matches';

  constructor(private http: HttpClient) {}

  getMatches(): Observable<MatchData[]> {
    return this.http.get<MatchData[]>(this.apiUrl);
  }

  unmatch(matchId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${matchId}`);
  }
}
