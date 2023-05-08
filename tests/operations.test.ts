import { Pool } from 'pg';
import * as db from 'zapatos/db';

describe('Operations', () => {
  let pool: Pool;

  beforeAll(async () => {
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

  it('should add a new set of records', async () => {
    const recs = [
      {
        user_id: db.nested<number>(
          db.selectOne('shop.user', { first_name: 'Nico' }, { column: 'id' }),
        ),
        product_id: db.nested<number>(
          db.selectOne(
            'shop.product',
            { description: db.conditions.like('%Dune%') },
            { column: 'id' },
          ),
        ),
      },
      {
        user_id: db.nested<number>(
          db.selectOne('shop.user', { first_name: 'Vanina' }, { column: 'id' }),
        ),
        product_id: db.nested<number>(
          db.selectOne(
            'shop.product',
            { description: db.conditions.like('Enceinte%') },
            { column: 'id' },
          ),
        ),
      },
    ];
    const expected = [
      { id: 1, user_id: 1, product_id: 4 },
      { id: 2, user_id: 2, product_id: 3 },
    ];
    const favorites = await db.insert('shop.favorite', recs).run(pool);
    expect(favorites).toBeDefined();
    expect(favorites).toEqual(expected);
  });

  it('should update an existing record with update', async () => {
    const favorites = await db
      .update(
        'shop.favorite',
        {
          product_id: db.nested<number>(
            db.selectOne(
              'shop.product',
              { description: db.conditions.like('%Seigneur%') },
              { column: 'id' },
            ),
          ),
        },
        {
          user_id: db.conditions.eq(
            db.nested<number>(
              db.selectOne(
                'shop.user',
                { first_name: 'Nico' },
                { column: 'id' },
              ),
            ),
          ),
        },
      )
      .run(pool);
    const expected = [{ id: 1, user_id: 1, product_id: 1 }];
    expect(favorites).toBeDefined();
    expect(favorites).toEqual(expected);
  });

  it('should add a new record with upsert', async () => {
    const favorite = await db
      .upsert(
        'shop.favorite',
        {
          user_id: db.nested<number>(
            db.selectOne(
              'shop.user',
              { first_name: 'Olivier' },
              { column: 'id' },
            ),
          ),
          product_id: db.nested<number>(
            db.selectOne(
              'shop.product',
              { description: db.conditions.like('%bluetooth') },
              { column: 'id' },
            ),
          ),
        },
        ['user_id'],
      )
      .run(pool);
    const expected = { $action: 'INSERT', id: 3, user_id: 3, product_id: 5 };
    expect(favorite).toBeDefined();
    expect(favorite).toEqual(expected);
  });

  it('should update an existing record with upsert', async () => {
    const favorite = await db
      .upsert(
        'shop.favorite',
        {
          user_id: db.nested<number>(
            db.selectOne('shop.user', { first_name: 'Nico' }, { column: 'id' }),
          ),
          product_id: db.nested<number>(
            db.selectOne(
              'shop.product',
              { description: db.conditions.like('%Dune%') },
              { column: 'id' },
            ),
          ),
        },
        ['user_id'],
      )
      .run(pool);
    const expected = { $action: 'UPDATE', id: 1, user_id: 1, product_id: 4 };
    expect(favorite).toBeDefined();
    expect(favorite).toEqual(expected);
  });

  it('should delete an existing record', async () => {
    const favorite = await db
      .deletes('shop.favorite', {
        user_id: db.conditions.eq(
          db.nested<number>(
            db.selectOne(
              'shop.user',
              { first_name: 'Olivier' },
              { column: 'id' },
            ),
          ),
        ),
      })
      .run(pool);
    const expected = [{ id: 3, user_id: 3, product_id: 5 }];
    expect(favorite).toBeDefined();
    expect(favorite).toEqual(expected);
  });

  afterAll(async () => {
    await db.truncate('shop.favorite', 'RESTART IDENTITY').run(pool);
    await pool.end();
  });
});
