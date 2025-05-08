# backend/Dockerfile

# 1) Use official slim Python image
FROM python:3.11-slim

# 2) Set working directory
WORKDIR /app

# 3) Copy & install dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 4) Copy the rest of your backend code
COPY backend/ ./

# 5) Expose Flask port
EXPOSE 5000

# 6) Define default command
CMD ["python", "app.py"]
