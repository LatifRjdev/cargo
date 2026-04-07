import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Warehouse API (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    await request(app.getHttpServer()).post('/api/auth/login').send({ phone: '+992902001001' });
    const res = await request(app.getHttpServer()).post('/api/auth/verify-otp').send({ phone: '+992902001001', code: '0000' });
    token = res.body.accessToken;
  });

  afterAll(async () => { await app.close(); });

  it('GET /api/warehouse/parcels — should return parcels', async () => {
    const res = await request(app.getHttpServer()).get('/api/warehouse/parcels').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty('items');
  });

  it('GET /api/warehouse/parcels/unidentified — should return array', async () => {
    const res = await request(app.getHttpServer()).get('/api/warehouse/parcels/unidentified').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/warehouse/boxes/queue — should return packing queue', async () => {
    const res = await request(app.getHttpServer()).get('/api/warehouse/boxes/queue').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/warehouse/cells — should return cells', async () => {
    const res = await request(app.getHttpServer()).get('/api/warehouse/cells').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/warehouse/inventory — should return inventory', async () => {
    const res = await request(app.getHttpServer()).get('/api/warehouse/inventory').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toHaveProperty('items');
  });

  it('should reject customer accessing warehouse', async () => {
    await request(app.getHttpServer()).post('/api/auth/login').send({ phone: '+992901001001' });
    const custRes = await request(app.getHttpServer()).post('/api/auth/verify-otp').send({ phone: '+992901001001', code: '0000' });
    await request(app.getHttpServer()).get('/api/warehouse/parcels').set('Authorization', `Bearer ${custRes.body.accessToken}`).expect(403);
  });
});
