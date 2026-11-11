import { LoginForm } from './login-form';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <LoginForm linkExpired={error === 'link_expired'} next={next} />
    </div>
  );
}
