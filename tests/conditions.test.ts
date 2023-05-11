import { Pool } from 'pg';
import * as db from 'zapatos/db';

describe('Conditions', () => {
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

  const expected = [
    {
      id: 1,
      first_name: 'Nico',
      last_name: 'Charpin',
      favorite_color: 'blue',
    },
    {
      id: 2,
      first_name: 'Vanina',
      last_name: 'Platon',
      favorite_color: 'green',
    },
    {
      id: 3,
      first_name: 'Olivier',
      last_name: 'Prezeau',
      favorite_color: 'red',
    },
  ];

  it('should work as usual with a classic whereable', async () => {
    const user = await execute(
      db.selectOne('shop.user', {
        last_name: 'Charpin',
        first_name: db.sql`${db.self} = 'Nico'`,
      }),
    );
    expect(user).toEqual(expected[0]);
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.isDistinctFrom', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.isDistinctFrom(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 3 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(0, 2));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.isNotDistinctFrom', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.isNotDistinctFrom(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 3 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(1);
    expect(users[0]).toEqual(expected[2]);
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.eq', async () => {
    const users = await execute(
      db.select('shop.user', {
        id: db.conditions.eq(
          db.nested(
            db.selectOne(
              'shop.order',
              { id: 4 },
              { column: 'user_id' },
              db.SelectResultMode.Number,
            ),
          ),
        ),
      }),
    );
    expect(users.length).toBe(1);
    expect(users[0]).toEqual(expected[0]);
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.ne', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.ne(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 3 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(0, 2));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.gt', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.gt(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 1 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(1));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.lte', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.lte(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 2 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(0, 2));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.lt', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.lt(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 3 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(0, 2));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.gte', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.gte(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 2 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(1));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.between', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.between(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 1 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 2 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(0, 2));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.betweenSymetric', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.betweenSymmetric(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 2 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 1 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(0, 2));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.notBetween', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.notBetween(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 1 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 2 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(1);
    expect(users[0]).toEqual(expected[2]);
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.notBetweenSymetric', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.notBetweenSymmetric(
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 2 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
            db.nested(
              db.selectOne(
                'shop.order',
                { id: 1 },
                { column: 'user_id' },
                db.SelectResultMode.Number,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(1);
    expect(users[0]).toEqual(expected[2]);
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.isIn', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.isIn(
            db.nested(
              db.select(
                'shop.order',
                { id: db.conditions.ne(3) },
                { column: 'user_id' },
                db.SelectResultMode.NumberArray,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(2);
    expect(users).toEqual(expected.slice(0, 2));
  });

  it('should retrieve the correct set of records with a nested query in whereable and conditions.isNotIn', async () => {
    const users = await execute(
      db.select(
        'shop.user',
        {
          id: db.conditions.isNotIn(
            db.nested(
              db.select(
                'shop.order',
                { id: db.conditions.ne(3) },
                { column: 'user_id' },
                db.SelectResultMode.NumberArray,
              ),
            ),
          ),
        },
        {
          order: { by: 'id', direction: 'ASC' },
        },
      ),
    );
    expect(users.length).toBe(1);
    expect(users[0]).toEqual(expected[2]);
  });

  afterAll(async () => {
    await pool.end();
  });
});
