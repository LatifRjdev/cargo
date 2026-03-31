import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
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

  it('POST /api/auth/login — should return OTP sent', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '+992000000000' })
      .expect(201);

    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('phone', '+992000000000');
  });

  it('POST /api/auth/verify-otp — should return tokens with dev code 0000', async () => {
    // First login to create OTP entry
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '+992000000000' });

    const res = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ phone: '+992000000000', code: '0000' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('POST /api/auth/verify-otp — should reject wrong code', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ phone: '+992000000000' });

    await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ phone: '+992000000000', code: '9999' })
      .expect(401);
  });

  it('POST /api/auth/register — should reject existing phone', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ phone: '+992000000000' })
      .expect(409);
  });
});
