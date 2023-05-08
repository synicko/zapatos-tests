BEGIN;

CREATE TYPE COLOR AS ENUM ('yellow', 'red', 'blue', 'green');

CREATE SCHEMA shop;

CREATE TABLE shop."user" (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  favorite_color COLOR
);

CREATE TABLE shop.product (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  description TEXT UNIQUE NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  attributes jsonb
);

CREATE TABLE shop."order" (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id INT NOT NULL REFERENCES shop."user"(id)
);

CREATE TABLE shop.order_item (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quantity INT NOT NULL,
  order_id INT NOT NULL REFERENCES shop."order"(id),
  product_id INT NOT NULL REFERENCES shop.product(id)
);

CREATE TABLE shop.favorite (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES shop."user"(id),
  product_id INT NOT NULL REFERENCES shop.product(id)
);

COMMIT;

BEGIN;

TRUNCATE shop.favorite, shop.order_item, shop."order", shop.product, shop."user" RESTART IDENTITY;

INSERT INTO shop."user"(first_name, last_name, favorite_color) VALUES
('Nico', 'Charpin', 'blue'),
('Vanina', 'Platon', 'green'),
('Olivier', 'Prezeau', 'red');

INSERT INTO shop.product(description, price, attributes) VALUES
('Trilogie "Le Seigneur des Anneaux" (blue-ray)', 25.99, '["largeur: 15cm","hauteur: 20cm", "profondeur: 7cm"]'::jsonb),
('T-Shirt "I love green"', 12.75, '["poids: pas lourd"]'::jsonb),
('Enceinte portable', 29.65, '["largeur: 8cm","hauteur: 5cm", "profondeur: 3cm"]'::jsonb),
('Le cycle de Dune (coffret 6 livres)', 39.99, '["1 - Dune", "2 - Le messie de Dune", "3 - Les enfants de Dune", "4 - L''empereur-Dieu de Dune", "5 - Les hérétiques de Dune", "6 - La maison des mères"]'::jsonb),
('Casque bluetooth', 34.99, '["portée: 50m", "poids: 45g"]'::jsonb);

INSERT INTO shop."order"(user_id) VALUES
(1),
(2),
(3),
(1),
(2);

INSERT INTO shop.order_item(quantity, product_id, order_id) VALUES
(1,1,1),
(1,1,4),
(3,2,2),
(2,2,3),
(2,3,3),
(1,5,3),
(1,3,4),
(1,5,4),
(1,5,5),
(1,4,5);

COMMIT;