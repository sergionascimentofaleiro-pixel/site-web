import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Profile } from './components/profile/profile';
import { Discover } from './components/discover/discover';
import { Matches } from './components/matches/matches';
import { Chat } from './components/chat/chat';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'profile', component: Profile },
  { path: 'discover', component: Discover },
  { path: 'matches', component: Matches },
  { path: 'chat/:matchId', component: Chat }
];
