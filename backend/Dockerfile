# backend/Dockerfile
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose Django port
EXPOSE 8000

# Run gunicorn (better for prod)
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
