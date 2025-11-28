CREATE DATABASE `socket_restaurant`;
USE `socket_restaurant`;

-- socket_restaurant.orders definition

CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `items` text NOT NULL,
  `status` enum('pending','preparing','ready','out_for_delivery','delivered') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;


-- socket_restaurant.users definition

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `role` enum('customer','staff','admin') DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;


-- DATA DUMMY
INSERT INTO users (name,`role`,created_at) VALUES
	 ('John Doe','customer','2025-11-28 13:55:15'),
	 ('Jane Smith','customer','2025-11-28 13:55:15'),
	 ('Mike Staff','staff','2025-11-28 13:55:15'),
	 ('Admin User','admin','2025-11-28 13:55:15');

INSERT INTO orders (customer_id,customer_name,items,status,created_at,updated_at) VALUES
	 (1,'John Doe','Burger, Fries, Coke','pending','2025-11-28 13:55:12','2025-11-28 13:55:12'),
	 (2,'Jane Smith','Pizza Margherita, Garlic Bread','preparing','2025-11-28 13:55:12','2025-11-28 13:55:12'),
	 (1,'John Doe','Pasta Carbonara, Salad','ready','2025-11-28 13:55:12','2025-11-28 13:55:12');