import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ProductSchema } from '@thefox/shared';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info'
  }
});

await app.register(helmet);
await app.register(cors, {
  origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  credentials: true
});

app.get('/health', async () => ({
  ok: true,
  service: 'thefox-api',
  version: '0.1.0'
}));

app.get('/v1/products', async () => {
  const products = [
    ProductSchema.parse({
      id: 'morning-glory',
      name: 'ผักบุ้งจีนสด',
      price: 25,
      unit: 'กำ',
      category: 'ผักสด',
      imageUrl: 'https://picsum.photos/seed/veg1/640/480',
      vendorId: 'vendor-local-1',
      stock: 80,
      description: 'คัดจากตลาดเช้า ส่งถึงครัวในวันเดียว'
    })
  ];

  return { data: products };
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
