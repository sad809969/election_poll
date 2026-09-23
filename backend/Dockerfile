FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc and buffer stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install build dependencies if needed for packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app/ ./app/
COPY api/ ./api/
COPY uploads/ ./uploads/

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Start uvicorn server on 0.0.0.0:8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
