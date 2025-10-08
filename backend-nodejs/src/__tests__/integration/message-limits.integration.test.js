const request = require('supertest');
const app = require('../../server');
const server = require('../../server').server;
const db = require('../../config/database');
const jwt = require('jsonwebtoken');

describe('Message Limits Integration Tests', () => {
  let authToken1, authToken2;
  let userId1, userId2;
  let matches = [];

  beforeAll(async () => {
    // Create test users
    const [user1] = await db.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      ['limit-test1@example.com', 'hashedpassword']
    );
    userId1 = user1.insertId;

    const [user2] = await db.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      ['limit-test2@example.com', 'hashedpassword']
    );
    userId2 = user2.insertId;

    // Create profiles
    await db.execute(
      'INSERT INTO profiles (user_id, first_name, last_name, birth_date, gender, looking_for) VALUES (?, ?, ?, ?, ?, ?)',
      [userId1, 'User', 'One', '1990-01-01', 'male', 'female']
    );
    await db.execute(
      'INSERT INTO profiles (user_id, first_name, last_name, birth_date, gender, looking_for) VALUES (?, ?, ?, ?, ?, ?)',
      [userId2, 'User', 'Two', '1992-01-01', 'female', 'male']
    );

    // Create 6 matches for testing
    for (let i = 0; i < 6; i++) {
      // Create additional users for matches
      const [matchUser] = await db.execute(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [`match${i}@example.com`, 'hashedpassword']
      );

      await db.execute(
        'INSERT INTO profiles (user_id, first_name, last_name, birth_date, gender, looking_for) VALUES (?, ?, ?, ?, ?, ?)',
        [matchUser.insertId, 'Match', `User${i}`, '1990-01-01', 'female', 'male']
      );

      const [match] = await db.execute(
        'INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)',
        [userId1, matchUser.insertId]
      );
      matches.push(match.insertId);
    }

    // Generate auth tokens
    authToken1 = jwt.sign({ userId: userId1 }, process.env.JWT_SECRET || 'test-secret');
    authToken2 = jwt.sign({ userId: userId2 }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM user_conversations WHERE user_id = ?', [userId1]);
    await db.execute('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId1, userId1]);
    await db.execute('DELETE FROM matches WHERE user1_id = ? OR user2_id = ?', [userId1, userId1]);
    await db.execute('DELETE FROM subscriptions WHERE user_id = ?', [userId1]);
    await db.execute('DELETE FROM profiles WHERE user_id = ?', [userId1]);
    await db.execute('DELETE FROM users WHERE email LIKE ?', ['limit-test%@example.com']);
    await db.execute('DELETE FROM users WHERE email LIKE ?', ['match%@example.com']);

    // Close database and server connections
    await db.end();
    if (server && server.close) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  beforeEach(async () => {
    // Clear conversations and subscriptions before each test
    await db.execute('DELETE FROM user_conversations WHERE user_id = ?', [userId1]);
    await db.execute('DELETE FROM messages WHERE sender_id = ?', [userId1]);
    await db.execute('DELETE FROM subscriptions WHERE user_id = ?', [userId1]);
  });

  describe('Conversation Limit Enforcement', () => {
    it('should allow sending message to first conversation', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          matchId: matches[0],
          receiverId: userId2,
          message: 'First conversation message'
        })
        .expect(201);

      expect(response.body).toHaveProperty('messageId');
      expect(response.body.message).toBe('Message sent successfully');

      // Verify conversation was tracked
      const [conversations] = await db.execute(
        'SELECT * FROM user_conversations WHERE user_id = ? AND match_id = ?',
        [userId1, matches[0]]
      );
      expect(conversations).toHaveLength(1);
    });

    it('should allow sending multiple messages to same conversation', async () => {
      // Send first message
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          matchId: matches[0],
          receiverId: userId2,
          message: 'Message 1'
        })
        .expect(201);

      // Send second message to same conversation
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          matchId: matches[0],
          receiverId: userId2,
          message: 'Message 2'
        })
        .expect(201);

      expect(response.body.message).toBe('Message sent successfully');

      // Should still only have 1 conversation tracked
      const [conversations] = await db.execute(
        'SELECT * FROM user_conversations WHERE user_id = ?',
        [userId1]
      );
      expect(conversations).toHaveLength(1);
    });

    it('should allow up to 5 different conversations', async () => {
      // Start 5 conversations
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            matchId: matches[i],
            receiverId: userId2,
            message: `Message to conversation ${i + 1}`
          })
          .expect(201);

        expect(response.body).toHaveProperty('messageId');
      }

      // Verify 5 conversations are tracked
      const [conversations] = await db.execute(
        'SELECT * FROM user_conversations WHERE user_id = ?',
        [userId1]
      );
      expect(conversations).toHaveLength(5);
    });

    it('should block 6th conversation without subscription', async () => {
      // Start 5 conversations first
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            matchId: matches[i],
            receiverId: userId2,
            message: `Message ${i + 1}`
          })
          .expect(201);
      }

      // Try to start 6th conversation - should be blocked
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          matchId: matches[5],
          receiverId: userId2,
          message: 'This should be blocked'
        })
        .expect(403);

      expect(response.body.error).toBe('Conversation limit reached');
      expect(response.body.requiresSubscription).toBe(true);
      expect(response.body.conversationCount).toBe(5);
      expect(response.body.limit).toBe(5);

      // Verify message was not saved
      const [messages] = await db.execute(
        'SELECT * FROM messages WHERE match_id = ?',
        [matches[5]]
      );
      expect(messages).toHaveLength(0);
    });

    it('should still allow messages to first 5 conversations after limit reached', async () => {
      // Start 5 conversations
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            matchId: matches[i],
            receiverId: userId2,
            message: `Initial message ${i + 1}`
          })
          .expect(201);
      }

      // Try to send another message to 3rd conversation - should work
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          matchId: matches[2],
          receiverId: userId2,
          message: 'Follow-up message'
        })
        .expect(201);

      expect(response.body.message).toBe('Message sent successfully');

      // Should still have only 5 conversations
      const [conversations] = await db.execute(
        'SELECT * FROM user_conversations WHERE user_id = ?',
        [userId1]
      );
      expect(conversations).toHaveLength(5);
    });

    it('should allow 6th conversation with active subscription', async () => {
      // Start 5 conversations
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            matchId: matches[i],
            receiverId: userId2,
            message: `Message ${i + 1}`
          })
          .expect(201);
      }

      // Create active subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      await db.execute(
        'INSERT INTO subscriptions (user_id, subscription_type, amount, start_date, end_date, status) VALUES (?, ?, ?, NOW(), ?, ?)',
        [userId1, 'monthly', 12.00, endDate.toISOString().split('T')[0], 'active']
      );

      // Now 6th conversation should work
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          matchId: matches[5],
          receiverId: userId2,
          message: 'Subscription allows this'
        })
        .expect(201);

      expect(response.body.message).toBe('Message sent successfully');

      // Should have 6 conversations now
      const [conversations] = await db.execute(
        'SELECT * FROM user_conversations WHERE user_id = ?',
        [userId1]
      );
      expect(conversations).toHaveLength(6);
    });

    it('should allow unlimited conversations with subscription', async () => {
      // Create active subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);
      await db.execute(
        'INSERT INTO subscriptions (user_id, subscription_type, amount, start_date, end_date, status) VALUES (?, ?, ?, NOW(), ?, ?)',
        [userId1, '24h', 5.00, endDate.toISOString().split('T')[0], 'active']
      );

      // Start all 6 conversations
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            matchId: matches[i],
            receiverId: userId2,
            message: `Message ${i + 1}`
          })
          .expect(201);

        expect(response.body).toHaveProperty('messageId');
      }

      // Should have 6 conversations
      const [conversations] = await db.execute(
        'SELECT * FROM user_conversations WHERE user_id = ?',
        [userId1]
      );
      expect(conversations).toHaveLength(6);
    });
  });

  describe('GET /api/messages/:matchId', () => {
    it('should allow reading messages from existing conversation', async () => {
      // Start conversation
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          matchId: matches[0],
          receiverId: userId2,
          message: 'Test message'
        })
        .expect(201);

      // Read conversation
      const response = await request(app)
        .get(`/api/messages/${matches[0]}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].message).toBe('Test message');
    });

    it('should allow reading even when at conversation limit', async () => {
      // Start 5 conversations
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/messages')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            matchId: matches[i],
            receiverId: userId2,
            message: `Message ${i + 1}`
          })
          .expect(201);
      }

      // Should still be able to read any of the 5 conversations
      const response = await request(app)
        .get(`/api/messages/${matches[2]}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
