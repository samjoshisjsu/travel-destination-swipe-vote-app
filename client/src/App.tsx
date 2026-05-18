import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchItems, fetchResults, fetchAnalytics, postVote, deleteVote, fetchUserVotes,
  Item, ResultItem, Analytics,
} from './api';
import SwipeCard from './components/SwipeCard';
import ResultsView from './components/ResultsView';
import MatchesView from './components/MatchesView';

type Tab = 'vote' | 'results' | 'matches';

function getOrCreateSession(): string {
  const key = 'swipe_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export default function App() {
  const [tab, setTab]                   = useState<Tab>('vote');
  const [items, setItems]               = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes]               = useState<Record<number, 'yes' | 'no'>>({});
  const [history, setHistory]           = useState<Array<{ itemId: number; choice: 'yes' | 'no' }>>([]);
  const [results, setResults]           = useState<ResultItem[]>([]);
  const [analytics, setAnalytics]       = useState<Analytics | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [deck, setDeck]                 = useState<'active' | 'done'>('active');
  const [sessionId]                     = useState(getOrCreateSession);

  // Load items + restore prior session votes on mount
  useEffect(() => {
    Promise.all([fetchItems(), fetchUserVotes(sessionId)])
      .then(([itemData, priorVotes]) => {
        setItems(itemData);

        if (priorVotes.length > 0) {
          const voteMap: Record<number, 'yes' | 'no'> = {};
          const hist: Array<{ itemId: number; choice: 'yes' | 'no' }> = [];
          const votedIds = new Set<number>();

          for (const v of priorVotes) {
            voteMap[v.itemId] = v.choice;
            hist.push({ itemId: v.itemId, choice: v.choice });
            votedIds.add(v.itemId);
          }

          setVotes(voteMap);
          setHistory(hist);

          // Jump to first unvoted card
          const firstUnvoted = itemData.findIndex(it => !votedIds.has(it.id));
          if (firstUnvoted === -1) {
            setCurrentIndex(itemData.length);
            setDeck('done');
          } else {
            setCurrentIndex(firstUnvoted);
          }
        }

        setLoading(false);
      })
      .catch(() => { setError('Could not reach server. Is it running?'); setLoading(false); });
  }, [sessionId]);

  const loadResults = useCallback(async () => {
    try {
      const [res, stats] = await Promise.all([fetchResults(), fetchAnalytics()]);
      setResults(res);
      setAnalytics(stats);
    } catch {
      // silent — user will see stale data
    }
  }, []);

  useEffect(() => {
    if (tab === 'results' || tab === 'matches') loadResults();
  }, [tab, loadResults]);

  const handleVote = useCallback(async (choice: 'yes' | 'no') => {
    const item = items[currentIndex];
    if (!item) return;

    try {
      await postVote(item.id, choice, sessionId);
    } catch {
      // optimistic — still advance UI
    }

    setVotes(prev  => ({ ...prev, [item.id]: choice }));
    setHistory(prev => [...prev, { itemId: item.id, choice }]);

    if (currentIndex + 1 >= items.length) {
      setDeck('done');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, items, sessionId]);

  const handleUndo = useCallback(async () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    try {
      await deleteVote(last.itemId, sessionId);
    } catch {
      // optimistic
    }

    setVotes(prev => {
      const next = { ...prev };
      delete next[last.itemId];
      return next;
    });
    setHistory(prev => prev.slice(0, -1));
    setDeck('active');
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : 0));
  }, [history, sessionId]);

  const goToResults = useCallback(() => {
    setTab('results');
    loadResults();
  }, [loadResults]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="splash">
        <div className="splash-icon">✈️</div>
        <div className="splash-text">Loading destinations…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="splash">
        <div className="splash-icon">⚠️</div>
        <div className="splash-text">{error}</div>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const canUndo     = history.length > 0;

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-top">
          <span className="app-title">✈️ DestinationSwipe</span>
        </div>
        <nav className="tabs">
          {(['vote', 'results', 'matches'] as Tab[]).map(t => (
            <button
              key={t}
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'vote' ? '🗳 Vote' : t === 'results' ? '📊 Results' : '🎯 Matches'}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="main-content">

        {/* VOTE tab */}
        {tab === 'vote' && (
          <div className="vote-view">
            {deck === 'done' ? (
              <div className="end-state">
                <div className="end-icon">🎉</div>
                <h2>All {items.length} destinations voted!</h2>
                <p>Ready to see the rankings?</p>
                <div className="end-actions">
                  <button className="btn btn-primary" onClick={goToResults}>
                    View Results
                  </button>
                  <button className="btn btn-secondary" onClick={handleUndo} disabled={!canUndo}>
                    ↩ Undo Last
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Progress */}
                <div className="progress-wrap">
                  <div className="progress-text">{currentIndex} / {items.length}</div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${(currentIndex / items.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Card */}
                {currentItem && (
                  <SwipeCard
                    key={currentItem.id}
                    item={currentItem}
                    onVote={handleVote}
                  />
                )}

                {/* Buttons */}
                <div className="action-row">
                  <button
                    className="btn btn-circle btn-no"
                    aria-label="Vote No"
                    onClick={() => handleVote('no')}
                  >✗</button>

                  <button
                    className="btn btn-circle btn-undo"
                    aria-label="Undo"
                    onClick={handleUndo}
                    disabled={!canUndo}
                  >↩</button>

                  <button
                    className="btn btn-circle btn-yes"
                    aria-label="Vote Yes"
                    onClick={() => handleVote('yes')}
                  >✓</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* RESULTS tab */}
        {tab === 'results' && (
          <ResultsView results={results} analytics={analytics} />
        )}

        {/* MATCHES tab */}
        {tab === 'matches' && (
          <MatchesView results={results} votes={votes} />
        )}
      </main>
    </div>
  );
}
