DB_PATH = data/interim/citistanbul.duckdb

.PHONY: help refresh_duckdb dbt_run api frontend test lint clean

help:
	@echo "Available targets:"
	@echo "  refresh_duckdb   Run full DuckDB POI pipeline"
	@echo "  dbt_run           Run dbt models (transform/dbt)"
	@echo "  api               Start FastAPI backend"
	@echo "  frontend          Start Next.js frontend"
	@echo "  test              Run tests"
	@echo "  lint              Run linters/formatters"
	@echo "  clean             Remove interim data / build artifacts"

refresh_duckdb:
	bash scripts/refresh_duckdb.sh

dbt_run:
	cd transform/dbt && dbt run

api:
	cd api && uvicorn main:app --reload

frontend:
	cd frontend && npm run dev

test:
	pytest

lint:
	black . && flake8 .

clean:
	rm -rf data/interim/*.duckdb data/interim/*.parquet
