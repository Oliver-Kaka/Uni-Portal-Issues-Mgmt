/**
 * useSubmitIssue — encapsulates the POST /api/tickets call.
 * Demo Only: Use Fictional Data
 */
import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function useSubmitIssue() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);   // success response
  const [serverErrors, setServerErrors] = useState(null); // field-level errors from server
  const [networkError, setNetworkError] = useState(null); // generic error message

  async function submit(formData) {
    setLoading(true);
    setResult(null);
    setServerErrors(null);
    setNetworkError(null);

    try {
      const res = await axios.post(`${API_BASE}/api/tickets`, formData);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        // Structured validation errors from server
        const map = {};
        for (const e of err.response.data.errors) map[e.field] = e.message;
        setServerErrors(map);
      } else if (err.response?.status === 429) {
        setNetworkError('Too many submissions. Please wait a few minutes and try again.');
      } else {
        setNetworkError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, result, serverErrors, networkError };
}
