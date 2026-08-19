-- 自動生成: python scripts/dump_schema.py（編集しない）
-- docs/development_plan.md セクション 73

CREATE TABLE categories (
	id SERIAL NOT NULL, 
	name VARCHAR(200) NOT NULL, 
	parent_id INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parent_id) REFERENCES categories (id)
);

CREATE TABLE exchange_rates (
	id SERIAL NOT NULL, 
	base_currency VARCHAR(8) NOT NULL, 
	quote_currency VARCHAR(8) NOT NULL, 
	rate FLOAT NOT NULL, 
	kind VARCHAR(16) NOT NULL, 
	checked_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE users (
	id VARCHAR(64) NOT NULL, 
	email VARCHAR(320) NOT NULL, 
	display_name VARCHAR(200), 
	password_hash VARCHAR(255), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (email)
);

CREATE TABLE cost_rules (
	id SERIAL NOT NULL, 
	user_id VARCHAR(64), 
	name VARCHAR(200) NOT NULL, 
	size_tier VARCHAR(2), 
	intl_shipping INTEGER NOT NULL, 
	domestic_shipping INTEGER NOT NULL, 
	import_tax_rate FLOAT NOT NULL, 
	platform_fee_rate FLOAT NOT NULL, 
	other_rate FLOAT NOT NULL, 
	packaging INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE products (
	id VARCHAR(64) NOT NULL, 
	name VARCHAR(400) NOT NULL, 
	brand VARCHAR(200) NOT NULL, 
	category_id INTEGER, 
	sub_category VARCHAR(200) NOT NULL, 
	model VARCHAR(200) NOT NULL, 
	size_tier VARCHAR(2) NOT NULL, 
	best_direction VARCHAR(16) NOT NULL, 
	seasonality VARCHAR(16) NOT NULL, 
	risk VARCHAR(16) NOT NULL, 
	match_type VARCHAR(24) NOT NULL, 
	match_confidence INTEGER NOT NULL, 
	score INTEGER NOT NULL, 
	image_url VARCHAR(1000), 
	source VARCHAR(200), 
	source_url VARCHAR(1000), 
	retrieved_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(category_id) REFERENCES categories (id)
);

CREATE TABLE research_jobs (
	id VARCHAR(64) NOT NULL, 
	user_id VARCHAR(64), 
	category VARCHAR(200) NOT NULL, 
	options JSON, 
	status VARCHAR(24) NOT NULL, 
	products_analyzed INTEGER NOT NULL, 
	opportunities_found INTEGER NOT NULL, 
	jp_to_cn INTEGER NOT NULL, 
	cn_to_jp INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE watchlists (
	id SERIAL NOT NULL, 
	user_id VARCHAR(64), 
	kind VARCHAR(16) NOT NULL, 
	value VARCHAR(400) NOT NULL, 
	monitor_frequency VARCHAR(16) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE alerts (
	id SERIAL NOT NULL, 
	user_id VARCHAR(64), 
	product_id VARCHAR(64), 
	kind VARCHAR(24) NOT NULL, 
	payload JSON, 
	message TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	read_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE market_prices (
	id SERIAL NOT NULL, 
	product_id VARCHAR(64) NOT NULL, 
	market VARCHAR(2) NOT NULL, 
	normalized_price INTEGER NOT NULL, 
	original_price FLOAT, 
	currency VARCHAR(8) NOT NULL, 
	competitors INTEGER, 
	demand_index INTEGER, 
	review_count INTEGER, 
	source VARCHAR(200), 
	source_url VARCHAR(1000), 
	checked_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE opportunities (
	id SERIAL NOT NULL, 
	product_id VARCHAR(64) NOT NULL, 
	direction VARCHAR(16) NOT NULL, 
	score INTEGER NOT NULL, 
	estimated_profit INTEGER NOT NULL, 
	margin_rate FLOAT NOT NULL, 
	price_gap_rate FLOAT NOT NULL, 
	seasonality VARCHAR(16) NOT NULL, 
	risk VARCHAR(16) NOT NULL, 
	reasons JSON, 
	computed_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE product_matches (
	id SERIAL NOT NULL, 
	product_id VARCHAR(64) NOT NULL, 
	matched_ref VARCHAR(400) NOT NULL, 
	match_type VARCHAR(24) NOT NULL, 
	match_confidence INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE profit_calculations (
	id SERIAL NOT NULL, 
	product_id VARCHAR(64) NOT NULL, 
	direction VARCHAR(16) NOT NULL, 
	sell_price INTEGER NOT NULL, 
	purchase_price INTEGER NOT NULL, 
	total_cost INTEGER NOT NULL, 
	estimated_profit INTEGER NOT NULL, 
	margin_rate FLOAT NOT NULL, 
	roi FLOAT NOT NULL, 
	break_even_sell_price INTEGER NOT NULL, 
	cost_breakdown JSON, 
	calculated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);

CREATE TABLE seasonal_profiles (
	id SERIAL NOT NULL, 
	product_id VARCHAR(64) NOT NULL, 
	country VARCHAR(2) NOT NULL, 
	season VARCHAR(16) NOT NULL, 
	peak_month INTEGER NOT NULL, 
	recommended_buy_month INTEGER NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id)
);
