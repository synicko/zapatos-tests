# Tests with sub-queries in Zapatos

This project uses a fork of [Zapatos](https://github.com/jawj/zapatos) allowing sub-queries in `lateral` option, `Whereable`, `Insertable`, and `Updatable` types.

## New properties in options

- column : allows to retrieve a value instead of an object for an existing column

```typescript
const orders = await db
  .select('shop.order', db.all, {
    lateral: {
      userLastName: db.selectOne(
        'shop.user',
        { id: db.parent('user_id') },
        {
          column: 'last_name',
        },
        db.SelectResultMode.String
      ),
    },
  })
  .run(pool);
```

will return an array of objects like

```typescript
[
  {
    id: 1,
    user_id: 1,
    created_at: '2023-05-08T11:17:19.353265+00:00',
    userLastName: 'Charpin'
  }
]
```

- extra : allows to retrieve a value instead of an object for a calculated column

```typescript
const orders = await db
  .select('shop.order', db.all, {
    columns: ['id', 'created_at'],
    lateral: {
      userName: db.selectOne(
        'shop.user',
        { id: db.parent('user_id') },
        { extra: db.sql`${'first_name'} || ' ' || ${'last_name'}` },
        db.SelectResultMode.String
      ),
    },
  })
  .run(pool);
```

will return an array of objects like

```typescript
[
  {
    id: 1,
    userName: 'Nico Charpin',
    created_at: '2023-05-08T11:17:19.353265+00:00'
  }
]
```

- array : allows to retrieve an array of values instead of an array of objects for an existing column

```typescript
const products = await db
  .select('shop.product', db.all, {
    lateral: {
      orderIds: db.select(
        'shop.order_item',
        { product_id: db.parent('id') },
        { array: 'order_id' },
        db.SelectResultMode.NumberArray
      ),
    },
  })
  .run(pool);
```

will return an array of objects like

```typescript
[
  {
    id: 1,
    price: 25.99,
    orderIds: [ 1, 4 ],
    attributes: [ 'largeur: 15cm', 'hauteur: 20cm', 'profondeur: 7cm' ],
    description: 'Trilogie "Le Seigneur des Anneaux" (blue-ray)'
  }
]
```

## New shortcut

- nested<expected_type> : allows the usage of sub-queries to set a value in  `Whereable`, `Insertable`, and `Updatable`  
 **MUST** be used with db.conditions in `Whereable` to keep the field name 

`Insertable` / `Updatable` example :

```typescript
{
  user_id: db.nested(
    db.selectOne('shop.user', { first_name: 'Nico' }, { column: 'id' }, db.SelectResultMode.Number),
  ),
  product_id: db.nested(
    db.selectOne(
      'shop.product',
      { description: db.conditions.like('%Dune%') },
      { column: 'id' },
       db.SelectResultMode.Number
    ),
  ),
}
```

`Wherable` examples :

```typescript
const users = await db
  .select('shop.user', {
    id: db.conditions.eq(
      db.nested(
        db.selectOne('shop.order', { id: 4 }, { column: 'user_id' }, db.SelectResultMode.Number),
      ),
    ),
  })
  .run(pool);
```

```typescript
// Don't use the array property in this case, we wish to obtain a virtual table, not an array of values
const users = await db
  .select(
    'shop.user',
    {
      id: db.conditions.isIn(
        db.nested(
          db.select(
            'shop.order',
            { id: db.conditions.ne(3) },
            { column: 'user_id' },
            , db.SelectResultMode.NumberArray
          ),
        ),
      ),
    },
    {
      order: { by: 'id', direction: 'ASC' },
    },
  )
  .run(pool);
```

## New SelectResultMode values

In order to correctly type the result of sub-queries, 6 new SelectResultMode are available (also in selectOne and selectExactlyOne) :
- Boolean
- Number
- String
- BooleanArray
- NumberArray
- StringArray

## Required

[Docker](https://docs.docker.com/engine/install/) must be installed to set up the test database

## Usage

### Installation

```sh
yarn install
```

### Run test suite

```sh
yarn test
```

### Run test suite with logs of SQL queries

```sh
yarn test:debug
```
