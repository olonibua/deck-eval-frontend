'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldError, Input, Label } from '@/components/ui/form';

export function SignUpForm({ open }: { open: boolean }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters for your password');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/signup', { name, email, password });
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof ApiError ? (err.issues[0]?.message ?? err.message) : 'Could not create your account');
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <Layers className="h-5 w-5 text-primary" aria-hidden />
        Deck Eval
      </div>
      {open ? (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <h1 className="text-title font-semibold">Create an account</h1>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-1 text-meta text-fg-muted">At least 8 characters.</p>
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" className="w-full" size="lg" loading={busy} disabled={!name.trim() || !email.trim()}>
            Create account
          </Button>
        </form>
      ) : (
        <div className="space-y-2">
          <h1 className="text-title font-semibold">Invite only</h1>
          <p className="text-sm text-fg-muted">New accounts are added by an admin. Ask them to invite you, then use the link in your email.</p>
        </div>
      )}
      <p className="mt-5 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
