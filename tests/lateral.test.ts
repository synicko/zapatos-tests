import { Pool } from 'pg';
import * as db from 'zapatos/db';

describe('Lateral', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: 'postgres://zapatos:zapatos@localhost/zapatos',
    });
    db.setConfig({
      queryListener: (query: db.SQLQuery) => {
        if (process.env.DEBUG_SQL === 'true') {
          console.log(query);
        }
      },
    });
  });

  it('should work as usual with a classic lateral', async () => {
    const orders = await db
      .select('shop.order', db.all, {
        lateral: {
          user: db.selectOne('shop.user', { id: db.parent('user_id') }),
        },
      })
      .run(pool);

    expect(orders.length).toBe(5);
    for (const order of orders) {
      expect(order.user).toBeDefined();
      expect(order.user).toBeInstanceOf(Object);
    }
  });

  it('should add a single value instead of an object with column in lateral', async () => {
    const orders = await db
      .select('shop.order', db.all, {
        lateral: {
          userLastName: db.selectOne(
            'shop.user',
            { id: db.parent('user_id') },
            {
              column: 'last_name',
            },
          ),
        },
      })
      .run(pool);
    expect(orders.length).toBe(5);
    for (const order of orders) {
      expect(order.userLastName).toBeDefined();
      expect(typeof order.userLastName).toBe('string');
    }
  });

  it('should add an array of values instead of an array of objects with column in lateral', async () => {
    const products = await db
      .select('shop.product', db.all, {
        lateral: {
          orderIds: db.select(
            'shop.order_item',
            { product_id: db.parent('id') },
            { array: 'order_id' },
          ),
        },
      })
      .run(pool);
    console.log(products[0]);
    expect(products.length).toBe(5);
    for (const product of products) {
      expect(product.orderIds).toBeDefined();
      expect(Array.isArray(product.orderIds)).toBe(true);
      expect(product.orderIds.length).toBeGreaterThan(0);
      for (const id of product.orderIds) {
        expect(typeof id).toBe('number');
      }
    }
  });
  it('should add a single value instead of an object with no columns and extra in lateral', async () => {
    const orders = await db
      .select('shop.order', db.all, {
        columns: ['id', 'created_at'],
        lateral: {
          userName: db.selectOne(
            'shop.user',
            { id: db.parent('user_id') },
            { extra: db.sql`${'first_name'} || ' ' || ${'last_name'}` },
          ),
        },
      })
      .run(pool);
    expect(orders.length).toBe(5);
    for (const order of orders) {
      expect(order.userName).toBeDefined();
      expect(typeof order.userName).toBe('string');
    }
  });

  it('should add an array of values instead of an array of objects with no columns and extra in lateral', async () => {
    const orders = await db
      .select('shop.order', db.all, {
        lateral: {
          userAndProductIds: db.select(
            'shop.order_item',
            { order_id: db.parent('id') },
            {
              extra: db.sql`${'user_id'} || '-' || ${'product_id'}`,
              order: { by: 'product_id', direction: 'ASC' },
            },
          ),
        },
      })
      .run(pool);
    expect(orders.length).toBe(5);
    for (const order of orders) {
      expect(order.userAndProductIds).toBeDefined();
      expect(Array.isArray(order.userAndProductIds)).toBe(true);
      expect(order.userAndProductIds.length).toBeGreaterThan(0);
      for (const id of order.userAndProductIds) {
        expect(id).toMatch(/\d+-\d+/);
      }
    }
  });

  it('should add correct values with multiple new properties in lateral', async () => {
    const orders = await db
      .select('shop.order', db.all, {
        lateral: {
          userName: db.selectOne(
            'shop.user',
            { id: db.parent('user_id') },
            {
              extra: db.sql`${'first_name'} || ' ' || ${'last_name'}`,
            },
          ),
          products: db.select(
            'shop.order_item',
            { order_id: db.parent('id') },
            {
              lateral: db.selectOne(
                'shop.product',
                { id: db.parent('product_id') },
                { column: 'description' },
              ),
            },
          ),
        },
      })
      .run(pool);
    expect(orders.length).toBe(5);
    for (const order of orders) {
      expect(order.userName).toBeDefined();
      expect(typeof order.userName).toBe('string');
      expect(order.products).toBeDefined();
      expect(Array.isArray(order.products)).toBe(true);
      expect(order.products.length).toBeGreaterThan(0);
      for (const product of order.products) {
        expect(typeof product).toBe('string');
      }
    }
  });

  afterAll(async () => {
    await pool.end();
  });
});
