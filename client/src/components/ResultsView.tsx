import React, { useState } from 'react';
import { ResultItem, Analytics } from '../api';

type SortMode = 'loved' | 'divisive' | 'votes';

interface Props {
  results: ResultItem[];
  analytics: Analytics | null;
}

export default function ResultsView({ results, analytics }: Props) {
  const [sort, setSort] = useState<SortMode>('loved');

  const sorted = [...results].sort((a, b) => {
    if (sort === 'loved') {
      return (b.yesPercent ?? 0) - (a.yesPercent ?? 0);
    }
    if (sort === 'divisive') {
      const aDiv = Math.abs((a.yesPercent ?? 50) - 50);
      const bDiv = Math.abs((b.yesPercent ?? 50) - 50);
      return aDiv - bDiv;
    }
    return b.totalVotes - a.totalVotes;
  });

  return (
    <div className="results-view">
      {analytics && (
        <div className="analytics-bar">
          <span>🗳 {analytics.totalVotes} votes</span>
          <span>👤 {analytics.totalSessions} sessions</span>
          <span>🗺 {analytics.totalItemsVoted} rated</span>
        </div>
      )}

      <div className="sort-buttons">
        {(['loved', 'divisive', 'votes'] as SortMode[]).map(mode => (
          <button
            key={mode}
            className={`sort-btn ${sort === mode ? 'active' : ''}`}
            onClick={() => setSort(mode)}
          >
            {mode === 'loved' ? '❤️ Most Loved' : mode === 'divisive' ? '⚡ Divisive' : '🔥 Most Votes'}
          </button>
        ))}
      </div>

      <div className="results-list">
        {sorted.map((item, idx) => {
          const pct = item.yesPercent ?? 0;
          return (
            <div key={item.id} className="result-item">
              <span className="result-rank">#{idx + 1}</span>
              <img
                src={item.imageUrl}
                alt={item.name}
                className="result-thumb"
                loading="lazy"
              />
              <div className="result-info">
                <div className="result-name">{item.name}</div>
                <div className="result-bar-track">
                  <div className="result-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="result-counts">
                  <span className="yes-label">✓ {item.yesCount}</span>
                  <span className="pct-label">{pct}%</span>
                  <span className="no-label">✗ {item.noCount}</span>
                </div>
              </div>
            </div>
          );
        })}

        {results.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">📊</div>
            <p>No votes yet. Start swiping!</p>
          </div>
        )}
      </div>
    </div>
  );
}
