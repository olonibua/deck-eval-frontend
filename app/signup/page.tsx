import { AuthFrame } from '@/components/auth-frame';
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
    <AuthFrame>
      <SignUpForm open={await signupOpen()} />
    </AuthFrame>
  );
}
