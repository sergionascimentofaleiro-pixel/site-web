import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Profile } from './components/profile/profile';
import { Discover } from './components/discover/discover';
import { Matches } from './components/matches/matches';
import { Messages } from './components/messages/messages';
import { Chat } from './components/chat/chat';
import { SubscriptionComponent } from './components/subscription/subscription';
import { profileGuard } from './guards/profile.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'profile', component: Profile },
  { path: 'discover', component: Discover, canActivate: [profileGuard] },
  { path: 'matches', component: Matches, canActivate: [profileGuard] },
  { path: 'messages', component: Messages, canActivate: [profileGuard] },
  { path: 'chat/:matchId', component: Chat, canActivate: [profileGuard] },
  { path: 'subscription', component: SubscriptionComponent, canActivate: [profileGuard] }
];
