import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Customer API (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    await request(app.getHttpServer()).post('/api/auth/login').send({ phone: '+992901001001' });
    const res = await request(app.getHttpServer()).post('/api/auth/verify-otp').send({ phone: '+992901001001', code: '0000' });
    token = res.body.accessToken;
  });

  afterAll(async () => { await app.close(); });

  it('GET /api/me/profile — should return profile', async () => {
    const res = await request(app.getHttpServer()).get('/api/me/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty('phone', '+992901001001');
    expect(res.body).toHaveProperty('clientCode');
  });

  it('GET /api/me/parcels — should return parcels list', async () => {
    const res = await request(app.getHttpServer()).get('/api/me/parcels').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty('items');
  });

  it('GET /api/me/boxes — should return boxes list', async () => {
    const res = await request(app.getHttpServer()).get('/api/me/boxes').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty('items');
  });

  it('GET /api/me/qr — should return QR code', async () => {
    const res = await request(app.getHttpServer()).get('/api/me/qr').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty('clientCode');
    expect(res.body).toHaveProperty('qrCodeUrl');
  });

  it('PATCH /api/me/profile — should update name', async () => {
    const res = await request(app.getHttpServer()).patch('/api/me/profile').set('Authorization', `Bearer ${token}`).send({ fullName: 'Рахмонов Фирдавс Тест' }).expect(200);
    expect(res.body.fullName).toBe('Рахмонов Фирдавс Тест');
    // Restore
    await request(app.getHttpServer()).patch('/api/me/profile').set('Authorization', `Bearer ${token}`).send({ fullName: 'Рахмонов Фирдавс' });
  });

  it('should reject unauthenticated request', async () => {
    await request(app.getHttpServer()).get('/api/me/profile').expect(401);
  });
});
