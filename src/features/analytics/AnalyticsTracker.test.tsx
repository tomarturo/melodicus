import { act, render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import AnalyticsTracker from './AnalyticsTracker';
import * as analytics from '../../lib/analytics';

let mockUser: Pick<User, 'id'> | null = null;
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

let navigate: ReturnType<typeof useNavigate>;
const CaptureNavigate = () => {
  navigate = useNavigate();
  return null;
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AnalyticsTracker />
      <CaptureNavigate />
    </MemoryRouter>,
  );

describe('AnalyticsTracker', () => {
  it('identifies the visitor, then sends the first page view', () => {
    mockUser = { id: 'user-1' };
    const calls: string[] = [];
    vi.spyOn(analytics, 'identify').mockImplementation((id) => void calls.push(`identify:${id}`));
    vi.spyOn(analytics, 'trackPageView').mockImplementation((path) => void calls.push(`page:${path}`));

    renderAt('/saved-songs');
    expect(calls).toEqual(['identify:user-1', 'page:/saved-songs']);
  });

  it('sends a page view on each new path, without the query string or hash', () => {
    mockUser = null;
    vi.spyOn(analytics, 'identify').mockImplementation(() => {});
    const pageView = vi.spyOn(analytics, 'trackPageView').mockImplementation(() => {});

    renderAt('/video/abc#l=loops');
    act(() => navigate('/video/abc?t=1#other'));
    act(() => navigate('/saved-songs'));

    expect(pageView.mock.calls).toEqual([['/video/abc'], ['/saved-songs']]);
  });
});
