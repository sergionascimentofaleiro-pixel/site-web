import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProfileData {
  id?: number;
  user_id?: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  looking_for: 'male' | 'female' | 'other' | 'all';
  bio?: string;
  location?: string;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  interests?: string;
  profile_photo?: string;
  interests_with_icons?: string;
  match_percentage?: number;
}

export interface PotentialMatch extends ProfileData {
  user_id: number;
  match_percentage: number;
  distance_km?: number;
  city_name?: string;
  country_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Profile {
  private readonly apiUrl = 'http://localhost:3000/api/profile';

  constructor(private http: HttpClient) {}

  createOrUpdateProfile(profileData: ProfileData): Observable<any> {
    return this.http.post(`${this.apiUrl}`, profileData);
  }

  getMyProfile(): Observable<ProfileData> {
    return this.http.get<ProfileData>(`${this.apiUrl}/me`);
  }

  getPotentialMatches(limit: number = 10, language?: string): Observable<PotentialMatch[]> {
    const lang = language || localStorage.getItem('language') || 'fr';
    return this.http.get<PotentialMatch[]>(`${this.apiUrl}/potential-matches?limit=${limit}&lang=${lang}`);
  }

  swipe(targetUserId: number, action: 'like' | 'pass'): Observable<{ message: string; isMatch: boolean }> {
    return this.http.post<{ message: string; isMatch: boolean }>(`${this.apiUrl}/swipe`, {
      targetUserId,
      action
    });
  }

  uploadPhoto(file: File): Observable<{ success: boolean; photoUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<{ success: boolean; photoUrl: string; message: string }>(`${this.apiUrl}/upload-photo`, formData);
  }

  updatePhotoUrl(photoUrl: string): Observable<{ success: boolean; photoUrl: string; message: string }> {
    return this.http.post<{ success: boolean; photoUrl: string; message: string }>(`${this.apiUrl}/update-photo-url`, { photoUrl });
  }
}
