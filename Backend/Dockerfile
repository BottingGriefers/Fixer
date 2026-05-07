FROM python:3.14-slim
WORKDIR /app
COPY . .
RUN pip install fastapi uvicorn websockets
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]