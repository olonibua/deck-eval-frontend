import { SignUpForm } from './signup-form';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

async function signupOpen() {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as { open: boolean }).open : true;
  } catch {
    return true;
  }
}

export default async function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <SignUpForm open={await signupOpen()} />
    </div>
  );
}
