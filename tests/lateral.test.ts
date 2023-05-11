import { Pool } from 'pg';
import * as db from 'zapatos/db';

describe('Lateral', () => {
  let pool: Pool;

  const execute = async <T extends db.SQLFragment<any>>(
    query: T,
  ): Promise<db.RunResultForSQLFragment<T>> => {
    return query.run(pool);
  };

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
    const orders = await execute(
      db.select('shop.order', db.all, {
        lateral: {
          user: db.selectOne('shop.user', { id: db.parent('user_id') }),
        },
      }),
    );

    expect(orders.length).toBe(5);
    for (const order of orders) {
      expect(order.user).toBeDefined();
      expect(order.user).toBeInstanceOf(Object);
    }
  });

  it('should add a single value instead of an object with column in lateral', async () => {
    const orders = await execute(
      db.select('shop.order', db.all, {
        lateral: {
          userLastName: db.selectOne(
            'shop.user',
            { id: db.parent('user_id') },
            {
              column: 'last_name',
            },
            db.SelectResultMode.String,
          ),
        },
      }),
    );
    expect(orders.length).toBe(5);
    for (const order of orders) {
      const test: string = order.userLastName;
      expect(test).toBeDefined();
      expect(typeof test).toBe('string');
    }
  });

  it('should add an array of values instead of an array of objects with column in lateral', async () => {
    const products = await execute(
      db.select('shop.product', db.all, {
        lateral: {
          orderIds: db.select(
            'shop.order_item',
            { product_id: db.parent('id') },
            { array: 'order_id' },
            db.SelectResultMode.NumberArray,
          ),
        },
      }),
    );
    expect(products.length).toBe(5);
    for (const product of products) {
      const ids: number[] = product.orderIds;
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(typeof id).toBe('number');
      }
    }
  });
  it('should add a single value instead of an object with no columns and extra in lateral', async () => {
    const orders = await execute(
      db.select('shop.order', db.all, {
        columns: ['id', 'created_at'],
        lateral: {
          userName: db.selectOne(
            'shop.user',
            { id: db.parent('user_id') },
            { extra: db.sql`${'first_name'} || ' ' || ${'last_name'}` },
            db.SelectResultMode.String,
          ),
        },
      }),
    );
    expect(orders.length).toBe(5);
    for (const order of orders) {
      const name: string = order.userName;
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    }
  });

  it('should add an array of values instead of an array of objects with no columns and extra in lateral', async () => {
    const orders = await execute(
      db.select('shop.order', db.all, {
        lateral: {
          userAndProductIds: db.select(
            'shop.order_item',
            { order_id: db.parent('id') },
            {
              extra: db.sql`${'user_id'} || '-' || ${'product_id'}`,
              order: { by: 'product_id', direction: 'ASC' },
            },
            db.SelectResultMode.StringArray,
          ),
        },
      }),
    );

    expect(orders.length).toBe(5);
    for (const order of orders) {
      const ids: string[] = order.userAndProductIds;
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        expect(id).toMatch(/\d+-\d+/);
      }
    }
  });

  it('should add correct values with multiple new properties in lateral', async () => {
    const orders = await execute(
      db.select('shop.order', db.all, {
        lateral: {
          userName: db.selectOne(
            'shop.user',
            { id: db.parent('user_id') },
            {
              extra: db.sql`${'first_name'} || ' ' || ${'last_name'}`,
            },
            db.SelectResultMode.String,
          ),
          products: db.select(
            'shop.order_item',
            { order_id: db.parent('id') },
            {
              lateral: db.selectOne(
                'shop.product',
                { id: db.parent('product_id') },
                { column: 'description' },
                db.SelectResultMode.String,
              ),
            },
          ),
        },
      }),
    );
    expect(orders.length).toBe(5);
    for (const order of orders) {
      const name: string = order.userName;
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
      expect(order.products).toBeDefined();
      expect(Array.isArray(order.products)).toBe(true);
      expect(order.products.length).toBeGreaterThan(0);
      for (let i = 0; i < order.products.length; i++) {
        const desc: string = order.products[i];
        expect(typeof desc).toBe('string');
      }
    }
  });

  afterAll(async () => {
    await pool.end();
  });
});
