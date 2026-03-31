import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Public API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/public/calculate — should return price for weight', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/public/calculate')
      .send({ weightKg: 5 })
      .expect(201);

    expect(res.body).toHaveProperty('price');
    expect(res.body).toHaveProperty('billableWeight');
    expect(res.body).toHaveProperty('currency');
    expect(res.body.price).toBeGreaterThan(0);
  });

  it('GET /api/public/track/:code — should return 404 for nonexistent', async () => {
    await request(app.getHttpServer())
      .get('/api/public/track/NONEXISTENT')
      .expect(404);
  });

  it('GET /api/warehouses — should return warehouse list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/warehouses')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });
});
