import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Country {
  id: number;
  code: string;
  name: string;
  has_states: boolean;
}

export interface State {
  id: number;
  code: string;
  name: string;
}

export interface City {
  id: number;
  name: string;
}

export interface CityDetails {
  id: number;
  city_name: string;
  country_id: number;
  country_code: string;
  country_name: string;
  state_id?: number;
  state_code?: string;
  state_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private readonly apiUrl = 'http://localhost:3000/api/locations';

  constructor(private http: HttpClient) {}

  getAllCountries(language?: string): Observable<Country[]> {
    const lang = language || localStorage.getItem('language') || 'fr';
    return this.http.get<Country[]>(`${this.apiUrl}/countries?lang=${lang}`);
  }

  getStatesByCountry(countryId: number): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiUrl}/countries/${countryId}/states`);
  }

  getCities(countryId: number, stateId?: number): Observable<City[]> {
    let url = `${this.apiUrl}/cities?countryId=${countryId}`;
    if (stateId) {
      url += `&stateId=${stateId}`;
    }
    return this.http.get<City[]>(url);
  }

  getCityDetails(cityId: number): Observable<CityDetails> {
    return this.http.get<CityDetails>(`${this.apiUrl}/cities/${cityId}`);
  }

  searchCities(searchTerm: string, countryId?: number, stateId?: number, limit: number = 500): Observable<City[]> {
    let url = `${this.apiUrl}/cities/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`;
    if (countryId) {
      url += `&countryId=${countryId}`;
    }
    if (stateId) {
      url += `&stateId=${stateId}`;
    }
    return this.http.get<City[]>(url);
  }
}
