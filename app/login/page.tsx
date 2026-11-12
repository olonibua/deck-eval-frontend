import { AuthFrame } from '@/components/auth-frame';
import { LoginForm } from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <AuthFrame>
      <LoginForm linkExpired={error === 'link_expired'} next={next} />
    </AuthFrame>
  );
}
