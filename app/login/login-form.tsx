'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { FieldError, Input, Label } from '@/components/ui/form';

export function LoginForm({ linkExpired, next }: { linkExpired: boolean; next?: string }) {
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(linkExpired ? 'That sign-in link has expired. Request a new one.' : null);
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'password') {
        await api.post('/auth/login', { email, password });
        window.location.href = next && next.startsWith('/') ? next : '/';
      } else {
        await api.post('/auth/magic-link', { email });
        setLinkSent(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {linkSent ? (
        <div className="space-y-3 text-center">
          <MailCheck className="mx-auto h-8 w-8 text-fg" aria-hidden />
          <p className="font-medium">Check your inbox</p>
          <p className="text-sm text-fg-muted">If {email} has an account, a sign-in link is on its way. It expires in 15 minutes.</p>
          <Button variant="ghost" size="sm" onClick={() => setLinkSent(false)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <h1 className="text-title font-medium">Sign in</h1>
          <p className="text-[15px] text-fg-muted">Pick up your next deck where you left off.</p>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode === 'password' && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <FieldError>{error}</FieldError>
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            {mode === 'password' ? 'Sign in' : 'Email me a link'}
          </Button>
          <button
            type="button"
            className="w-full text-center text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
            onClick={() => {
              setMode(mode === 'password' ? 'link' : 'password');
              setError(null);
            }}
          >
            {mode === 'password' ? 'Send me a link instead' : 'Use my password instead'}
          </button>
          <p className="text-center text-sm text-fg-muted">
            New here?{' '}
            <Link href="/signup" className="font-medium text-fg underline decoration-orange decoration-2 underline-offset-4 hover:decoration-fg">
              Create an account
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
