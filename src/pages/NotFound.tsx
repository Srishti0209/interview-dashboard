import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center p-10 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That page doesn't exist.
      </p>
      <Link to="/" className={buttonVariants({ className: 'mt-6' })}>
        Back to Dashboard
      </Link>
    </div>
  );
}
