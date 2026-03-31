import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admin API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Get admin token
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '+992000000000' });

    const res = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ phone: '+992000000000', code: '0000' });

    adminToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/admin/dashboard — should return stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('today');
    expect(res.body).toHaveProperty('totals');
    expect(res.body.today).toHaveProperty('intake');
  });

  it('GET /api/admin/users — should return paginated users', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/admin/boxes — should return boxes list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/boxes?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
  });

  it('GET /api/admin/warehouses — should return warehouses', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/warehouses')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/admin/tariffs — should return tariffs', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/tariffs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/admin/settings — should return settings', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/admin/audit-log — should return audit entries', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/audit-log?limit=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('items');
  });

  it('GET /api/admin/reports/revenue — should return revenue data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/reports/revenue')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('totalRevenue');
  });

  it('GET /api/admin/unidentified-parcels — should return array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/unidentified-parcels')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/dashboard')
      .expect(401);
  });
});
