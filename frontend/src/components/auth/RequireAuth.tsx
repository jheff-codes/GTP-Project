import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function RequireAuth() {
    const { data: user, isLoading } = useCurrentUser();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        // Redirect to root (which shows Login) if not authenticated
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
