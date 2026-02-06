import AuthLayout from '@/components/auth/AuthLayout';

export default function ErrorPage({ searchParams }: { searchParams?: Record<string,string> }) {
  const error = (searchParams && searchParams.error) || 'OAuthSignin';
  const human = {
    OAuthSignin: 'There was a problem signing in with the selected provider. Try again or use email.',
    OAuthCallback: 'OAuth callback error. Try again.',
    OAuthCreateAccount: 'Unable to create account from provider info.',
    EmailCreateAccount: 'Unable to create account with that email.',
    CredentialsSignin: 'Invalid email or password.',
    default: 'Authentication error. Please try again.'
  } as Record<string,string>;

  return (
    <AuthLayout title="Authentication error" subtitle={human[error] || human.default} helperText="Need help?" helperAction={{ label: 'Contact support', href: '/contact' }}>
      <div className="prose">
        <p>If this keeps happening, please check your connection and try again. If it persists contact support.</p>
      </div>
    </AuthLayout>
  );
}
