# Cron-friendly worker image: install deps, copy scripts, default Amazon run.
FROM python:3.12-slim

WORKDIR /worker

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY base_scraper.py amazon_paapi.py walmart_affiliate.py ebay_partner.py ./
COPY networks ./networks

ENV PYTHONUNBUFFERED=1

# Override with e.g. `["python","walmart_affiliate.py"]` or a shell loop.
CMD ["python", "amazon_paapi.py"]
