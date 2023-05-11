import { Pool } from 'pg';
import * as db from 'zapatos/db';

describe('Operations', () => {
  let pool: Pool;

  const execute = async <T extends db.SQLFragment<any>>(
    query: T,
  ): Promise<db.RunResultForSQLFragment<T>> => {
    return query.run(pool);
  };

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
        user_id: db.nested(
          db.selectOne(
            'shop.user',
            { first_name: 'Nico' },
            { column: 'id' },
            db.SelectResultMode.Number,
          ),
        ),
        product_id: db.nested(
          db.selectOne(
            'shop.product',
            { description: db.conditions.like('%Dune%') },
            { column: 'id' },
            db.SelectResultMode.Number,
          ),
        ),
      },
      {
        user_id: db.nested(
          db.selectOne(
            'shop.user',
            { first_name: 'Vanina' },
            { column: 'id' },
            db.SelectResultMode.Number,
          ),
        ),
        product_id: db.nested(
          db.selectOne(
            'shop.product',
            { description: db.conditions.like('Enceinte%') },
            { column: 'id' },
            db.SelectResultMode.Number,
          ),
        ),
      },
    ];
    const expected = [
      { id: 1, user_id: 1, product_id: 4 },
      { id: 2, user_id: 2, product_id: 3 },
    ];
    const favorites = await execute(db.insert('shop.favorite', recs));
    expect(favorites).toBeDefined();
    expect(favorites).toEqual(expected);
  });

  it('should update an existing record with update', async () => {
    const favorites = await execute(
      db.update(
        'shop.favorite',
        {
          product_id: db.nested(
            db.selectOne(
              'shop.product',
              { description: db.conditions.like('%Seigneur%') },
              { column: 'id' },
              db.SelectResultMode.Number,
            ),
          ),
        },
        {
          user_id: db.conditions.eq(
            db.nested(
              db.selectOne(
                'shop.user',
                { first_name: 'Nico' },
                { column: 'id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
      ),
    );
    const expected = [{ id: 1, user_id: 1, product_id: 1 }];
    expect(favorites).toBeDefined();
    expect(favorites).toEqual(expected);
  });

  it('should add a new record with upsert', async () => {
    const favorite = await execute(
      db.upsert(
        'shop.favorite',
        {
          user_id: db.nested(
            db.selectOne(
              'shop.user',
              { first_name: 'Olivier' },
              { column: 'id' },
              db.SelectResultMode.Number,
            ),
          ),
          product_id: db.nested(
            db.selectOne(
              'shop.product',
              { description: db.conditions.like('%bluetooth') },
              { column: 'id' },
              db.SelectResultMode.Number,
            ),
          ),
        },
        ['user_id'],
      ),
    );
    const expected = { $action: 'INSERT', id: 3, user_id: 3, product_id: 5 };
    expect(favorite).toBeDefined();
    expect(favorite).toEqual(expected);
  });

  it('should update an existing record with upsert', async () => {
    const favorite = await execute(
      db.upsert(
        'shop.favorite',
        {
          user_id: db.nested(
            db.selectOne(
              'shop.user',
              { first_name: 'Nico' },
              { column: 'id' },
              db.SelectResultMode.Number,
            ),
          ),
          product_id: db.nested(
            db.selectOne(
              'shop.product',
              { description: db.conditions.like('%Dune%') },
              { column: 'id' },
              db.SelectResultMode.Number,
            ),
          ),
        },
        ['user_id'],
      ),
    );
    const expected = { $action: 'UPDATE', id: 1, user_id: 1, product_id: 4 };
    expect(favorite).toBeDefined();
    expect(favorite).toEqual(expected);
  });

  it('should delete an existing record', async () => {
    const favorite = await execute(
      db.deletes('shop.favorite', {
        user_id: db.conditions.eq(
          db.nested(
            db.selectOne(
              'shop.user',
              { first_name: 'Olivier' },
              { column: 'id' },
              db.SelectResultMode.Number,
            ),
          ),
        ),
      }),
    );
    const expected = [{ id: 3, user_id: 3, product_id: 5 }];
    expect(favorite).toBeDefined();
    expect(favorite).toEqual(expected);
  });

  afterAll(async () => {
    await db.truncate('shop.favorite', 'RESTART IDENTITY').run(pool);
    await pool.end();
  });
});
