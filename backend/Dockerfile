FROM python:3.12-slim-trixie

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install dependencies
RUN apt update
RUN apt install -y gettext git gcc libpq-dev
RUN pip install gunicorn

# Copy requirements file
COPY requirements.txt /
RUN pip install --no-cache-dir -r /requirements.txt

# Set working directory
WORKDIR /src

COPY . /src/

# Create a directory for Gunicorn logs (production).
RUN mkdir -p /logs

# Copy and set permissions for entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
