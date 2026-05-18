import React from 'react';
import { ResultItem } from '../api';

interface Props {
  results: ResultItem[];
  votes: Record<number, 'yes' | 'no'>;
}

const MATCH_THRESHOLD = 70;

export default function MatchesView({ results, votes }: Props) {
  const hasVoted = Object.keys(votes).length > 0;

  const matches = results.filter(
    item => votes[item.id] === 'yes' && (item.yesPercent ?? 0) >= MATCH_THRESHOLD
  );

  if (!hasVoted) {
    return (
      <div className="matches-view">
        <div className="empty-state">
          <div className="empty-emoji">🌍</div>
          <h3>No votes yet</h3>
          <p>Swipe on some destinations first!</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="matches-view">
        <div className="empty-state">
          <div className="empty-emoji">🤔</div>
          <h3>No matches yet</h3>
          <p>
            Matches are destinations you swiped <strong>Yes</strong> on where{' '}
            {MATCH_THRESHOLD}%+ of all voters also love them.
          </p>
          <p>Keep swiping to find yours!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-view">
      <div className="matches-header">
        <h2>🎯 Your Matches</h2>
        <p className="matches-subtitle">
          You loved {matches.length} destination{matches.length !== 1 ? 's' : ''} that {MATCH_THRESHOLD}%+ of all voters also love!
        </p>
      </div>

      <div className="matches-grid">
        {matches.map(item => (
          <div key={item.id} className="match-card">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="match-image"
              loading="lazy"
            />
            <div className="match-info">
              <div className="match-name">{item.name}</div>
              <div className="match-pct">❤️ {item.yesPercent}% love it</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
