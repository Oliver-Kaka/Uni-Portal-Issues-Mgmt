/**
 * OutageBanner — polls the public /api/tickets/meta/outages endpoint on
 * mount and shows a sticky alert if an active outage is detected.
 * Polling is intentionally infrequent (every 5 min) to avoid hammering the API.
 * Demo Only: Use Fictional Data
 */
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const POLL_MS  = 5 * 60 * 1000; // 5 minutes

export default function OutageBanner() {
  const [outages, setOutages] = useState([]);

  async function fetchOutages() {
    try {
      const res = await axios.get(`${API_BASE}/api/tickets/meta/outages`);
      setOutages(res.data.outages || []);
    } catch {
      // Silent fail — outage banner is best-effort only
    }
  }

  useEffect(() => {
    fetchOutages();
    const interval = setInterval(fetchOutages, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (outages.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full px-4 py-2 text-sm font-medium text-center"
      style={{
        backgroundColor: '#fef3c7',
        borderBottom: '1px solid #d97706',
        color: '#92400e',
      }}
    >
      ⚠️ Possible system issue detected:{' '}
      {outages.map((o, i) => (
        <span key={i}>
          <strong>{o.category}</strong>
          {i < outages.length - 1 ? ', ' : ''}
        </span>
      ))}
      . If you are affected, please submit a ticket and we will investigate. Demo Only.
    </div>
  );
}
