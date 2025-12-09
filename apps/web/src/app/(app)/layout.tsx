
import React from 'react';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl aspect-video bg-card text-card-foreground rounded-xl shadow-lg flex flex-col">
                {children}
            </div>
        </main>
    );
}
