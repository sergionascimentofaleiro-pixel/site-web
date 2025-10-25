import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Profile } from './components/profile/profile';
import { Discover } from './components/discover/discover';
import { Matches } from './components/matches/matches';
import { Messages } from './components/messages/messages';
import { Chat } from './components/chat/chat';
import { SubscriptionComponent } from './components/subscription/subscription';
import { authGuard } from './guards/auth.guard';
import { profileGuard } from './guards/profile.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'discover', component: Discover, canActivate: [authGuard, profileGuard] },
  { path: 'matches', component: Matches, canActivate: [authGuard, profileGuard] },
  { path: 'messages', component: Messages, canActivate: [authGuard, profileGuard] },
  { path: 'chat/:matchId', component: Chat, canActivate: [authGuard, profileGuard] },
  { path: 'subscription', component: SubscriptionComponent, canActivate: [authGuard, profileGuard] }
];
