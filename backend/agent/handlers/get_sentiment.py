"""Handler for get_news_sentiment tool.

Uses Finnhub company-news (free tier). Claude does its own sentiment analysis
by reading the headlines and summaries.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from data.finnhub import FinnhubClient
from config import settings
from store.memory import store


async def handle_get_news_sentiment(input_data: dict, strategy_id: str) -> dict:
    tickers_str = input_data["tickers"]
    tickers = [t.strip() for t in tickers_str.split(",")]
    days_back = min(input_data.get("days_back", 30), 90)

    client = FinnhubClient(settings.finnhub_api_key)

    to_date = datetime.now().strftime("%Y-%m-%d")
    from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")

    news_by_ticker = {}
    for ticker in tickers:
        raw_news = client.get_company_news(ticker, from_date, to_date)

        if isinstance(raw_news, list):
            articles = []
            for article in raw_news[:15]:  # Top 15 per ticker
                articles.append({
                    "headline": article.get("headline", ""),
                    "source": article.get("source", ""),
                    "datetime": article.get("datetime", 0),
                    "date": datetime.fromtimestamp(
                        article.get("datetime", 0)
                    ).strftime("%Y-%m-%d") if article.get("datetime") else "",
                    "summary": article.get("summary", "")[:300],
                    "url": article.get("url", ""),
                    "category": article.get("category", ""),
                })

            news_by_ticker[ticker] = {
                "articles": articles,
                "article_count": len(raw_news),
            }
        else:
            news_by_ticker[ticker] = {
                "articles": [],
                "article_count": 0,
                "error": raw_news.get("error", "Failed to fetch news") if isinstance(raw_news, dict) else "Unknown error",
            }

    store.update_session(strategy_id, {"news_data": news_by_ticker})

    return {
        "news_by_ticker": news_by_ticker,
        "period": {"from": from_date, "to": to_date},
        "note": (
            "Sentiment scores are not available on the free tier. "
            "Analyze the headlines and summaries yourself to determine "
            "the market's directional bias for each ticker."
        ),
    }
