export interface Item {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
}

export interface ResultItem extends Item {
  yesCount: number;
  noCount: number;
  totalVotes: number;
  yesPercent: number | null;
}

export interface Analytics {
  totalVotes: number;
  totalSessions: number;
  totalItemsVoted: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const fetchItems = (): Promise<Item[]> =>
  request('/api/items');

export const fetchResults = (): Promise<ResultItem[]> =>
  request('/api/results');

export const fetchAnalytics = (): Promise<Analytics> =>
  request('/api/analytics');

export const postVote = (itemId: number, choice: 'yes' | 'no', sessionId: string): Promise<{ success: boolean }> =>
  request('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, choice, sessionId }),
  });

export const deleteVote = (itemId: number, sessionId: string): Promise<{ success: boolean }> =>
  request(`/api/vote/${itemId}?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });

export const fetchUserVotes = (sessionId: string): Promise<Array<{ itemId: number; choice: 'yes' | 'no' }>> =>
  request(`/api/votes?sessionId=${encodeURIComponent(sessionId)}`);
