docker-compose down 
docker-compose build --no-cache
docker-compose up -d
docker-compose exec api python scripts/load_all_tire_data.py