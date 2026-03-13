import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Painel';
import { MainLayout } from '@/components/layout/MainLayout';
import { Loader2 } from 'lucide-react';

export function RootAuthHandler() {
    const { data: user, isLoading } = useCurrentUser();
    // We can also use a local loading state to avoid flash if needed, 
    // but useCurrentUser already handles it.

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    // If user is authenticated, show Dashboard wrapped in MainLayout
    // We need to render MainLayout manually here because Route element expects a component
    // But wait, MainLayout usually has an <Outlet />.
    // If we want to use MainLayout structure for Dashboard, we can't just render <Dashboard /> inside it if MainLayout relies on Outlet.
    // Converting MainLayout to accept children or using it as a wrapper.

    // Actually, in App.tsx, Dashboard is a Route inside MainLayout.
    // If we change the "/" route to use RootAuthHandler, we need to replicate the structure.

    return (
        <MainLayout>
            <Dashboard />
        </MainLayout>
    );
}
