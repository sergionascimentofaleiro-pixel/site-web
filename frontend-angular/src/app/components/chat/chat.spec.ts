import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Chat } from './chat';
import { Message as MessageService } from '../../services/message';
import { Match as MatchService } from '../../services/match';
import { Auth } from '../../services/auth';
import { SocketService } from '../../services/socket';
import { Subscription as SubscriptionService } from '../../services/subscription';
import { TranslateModule } from '@ngx-translate/core';

describe('ChatComponent', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;
  let messageService: jasmine.SpyObj<MessageService>;
  let matchService: jasmine.SpyObj<MatchService>;
  let authService: jasmine.SpyObj<Auth>;
  let socketService: jasmine.SpyObj<SocketService>;
  let subscriptionService: jasmine.SpyObj<SubscriptionService>;
  let activatedRoute: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockMatch = {
    matchId: 5,
    matchedAt: '2025-10-07',
    otherUser: {
      id: 2,
      name: 'Jane Doe',
      photo: 'photo.jpg',
      age: 28,
      bio: 'Test bio',
      email: 'jane@example.com'
    },
    createdAt: '2025-10-07'
  };

  const mockMessages = [
    {
      id: 1,
      match_id: 5,
      sender_id: 1,
      receiver_id: 2,
      message: 'Hello',
      created_at: '2025-10-07T10:00:00Z',
      is_read: true
    },
    {
      id: 2,
      match_id: 5,
      sender_id: 2,
      receiver_id: 1,
      message: 'Hi there!',
      created_at: '2025-10-07T10:01:00Z',
      is_read: true
    }
  ];

  beforeEach(async () => {
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['getConversation', 'sendMessage']);
    const matchServiceSpy = jasmine.createSpyObj('MatchService', ['getMatches']);
    const authServiceSpy = jasmine.createSpyObj('Auth', ['currentUser']);
    const socketServiceSpy = jasmine.createSpyObj('SocketService', [
      'connect',
      'onNewMessage',
      'onMessageError',
      'onTyping',
      'onStopTyping',
      'sendMessage',
      'startTyping',
      'stopTyping',
      'joinConversation',
      'leaveConversation',
      'removeAllListeners',
      'getConnectionStatus'
    ]);
    const subscriptionServiceSpy = jasmine.createSpyObj('SubscriptionService', ['canAccessConversation']);

    activatedRoute = {
      params: of({ matchId: '5' })
    };

    authServiceSpy.currentUser.and.returnValue(mockUser);

    await TestBed.configureTestingModule({
      imports: [Chat, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: MatchService, useValue: matchServiceSpy },
        { provide: Auth, useValue: authServiceSpy },
        { provide: SocketService, useValue: socketServiceSpy },
        { provide: SubscriptionService, useValue: subscriptionServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    matchService = TestBed.inject(MatchService) as jasmine.SpyObj<MatchService>;
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    socketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    subscriptionService = TestBed.inject(SubscriptionService) as jasmine.SpyObj<SubscriptionService>;

    // Setup default returns to avoid undefined errors
    messageService.getConversation.and.returnValue(of([]));
    messageService.sendMessage.and.returnValue(of({ id: 1, match_id: 5, sender_id: 1, receiver_id: 2, message: 'Test', created_at: new Date().toISOString(), is_read: false }));

    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load match and messages on init when access is granted', async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: true,
        reason: 'free'
      }));
      matchService.getMatches.and.returnValue(of([mockMatch]));
      messageService.getConversation.and.returnValue(of(mockMessages));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.accessDenied()).toBe(false);
      expect(component.match()).toEqual(mockMatch);
      expect(component.messages()).toEqual(mockMessages);
      expect(component.isLoading()).toBe(false);
    });

    it('should show subscription prompt when access is denied', async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: false,
        reason: 'limit_reached',
        conversationCount: 5,
        limit: 5
      }));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.accessDenied()).toBe(true);
      expect(component.requiresSubscription()).toBe(true);
      expect(component.isLoading()).toBe(false);
    });

    it('should allow access to existing conversation', async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: true,
        reason: 'existing_conversation'
      }));
      matchService.getMatches.and.returnValue(of([mockMatch]));
      messageService.getConversation.and.returnValue(of(mockMessages));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.accessDenied()).toBe(false);
      expect(component.match()).toEqual(mockMatch);
    });

    it('should allow access with active subscription', async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: true,
        reason: 'subscription'
      }));
      matchService.getMatches.and.returnValue(of([mockMatch]));
      messageService.getConversation.and.returnValue(of(mockMessages));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.accessDenied()).toBe(false);
    });

    it('should connect to socket service', () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: true,
        reason: 'free'
      }));
      matchService.getMatches.and.returnValue(of([mockMatch]));
      messageService.getConversation.and.returnValue(of([]));

      fixture.detectChanges();

      expect(socketService.connect).toHaveBeenCalled();
    });
  });

  describe('Sending Messages', () => {
    beforeEach(async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: true,
        reason: 'free'
      }));
      matchService.getMatches.and.returnValue(of([mockMatch]));
      messageService.getConversation.and.returnValue(of(mockMessages));
      socketService.getConnectionStatus.and.returnValue(true);

      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should send message via WebSocket when connected', () => {
      component.newMessage.set('Test message');
      component.sendMessage();

      expect(socketService.sendMessage).toHaveBeenCalledWith(
        5,
        2,
        'Test message'
      );
      expect(component.newMessage()).toBe('');
      expect(component.isSending()).toBe(true);
    });

    it('should not send empty message', () => {
      component.newMessage.set('   ');
      component.sendMessage();

      expect(socketService.sendMessage).not.toHaveBeenCalled();
      expect(messageService.sendMessage).not.toHaveBeenCalled();
    });

    it('should fallback to HTTP when WebSocket not connected', () => {
      socketService.getConnectionStatus.and.returnValue(false);
      messageService.sendMessage.and.returnValue(of({
        id: 3,
        match_id: 5,
        sender_id: 1,
        receiver_id: 2,
        message: 'HTTP message',
        created_at: new Date().toISOString(),
        is_read: false
      }));

      component.newMessage.set('HTTP message');
      component.sendMessage();

      expect(messageService.sendMessage).toHaveBeenCalledWith(5, 2, 'HTTP message');
    });

    it('should trigger typing indicator', () => {
      component.onInput();

      expect(socketService.startTyping).toHaveBeenCalledWith(5, 2);
    });
  });

  describe('Message Display', () => {
    beforeEach(async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: true,
        reason: 'free'
      }));
      matchService.getMatches.and.returnValue(of([mockMatch]));
      messageService.getConversation.and.returnValue(of(mockMessages));

      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should identify own messages', () => {
      const ownMessage = mockMessages[0];
      expect(component.isMyMessage(ownMessage)).toBe(true);
    });

    it('should identify other user messages', () => {
      const theirMessage = mockMessages[1];
      expect(component.isMyMessage(theirMessage)).toBe(false);
    });

    it('should format time correctly', () => {
      // Test with a timestamp from 5 minutes ago
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const timeString = component.getTimeString(fiveMinutesAgo);
      expect(timeString).toContain('min');
    });
  });

  describe('Access Control', () => {
    it('should hide messages when access is denied', async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: false,
        reason: 'limit_reached',
        conversationCount: 5,
        limit: 5
      }));

      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const messagesList = compiled.querySelector('.messages-list');
      expect(messagesList?.classList.contains('hidden')).toBe(true);
    });

    it('should hide message input when access is denied', async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: false,
        reason: 'limit_reached',
        conversationCount: 5,
        limit: 5
      }));

      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const inputContainer = compiled.querySelector('.message-input-container');
      expect(inputContainer?.classList.contains('hidden')).toBe(true);
    });

    it('should show subscription prompt when access is denied', async () => {
      subscriptionService.canAccessConversation.and.returnValue(of({
        canAccess: false,
        reason: 'limit_reached',
        conversationCount: 5,
        limit: 5
      }));

      fixture.detectChanges();
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const subscriptionPrompt = compiled.querySelector('.subscription-required');
      expect(subscriptionPrompt).toBeTruthy();
    });
  });
});
