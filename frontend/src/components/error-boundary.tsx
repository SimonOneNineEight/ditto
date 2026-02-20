'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="flex items-center justify-center min-h-[400px] p-4"
                    data-testid="error-boundary-fallback"
                >
                    <Card className="max-w-md w-full">
                        <CardContent className="flex flex-col items-center text-center pt-6 gap-4">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold">Something went wrong</h2>
                                <p className="text-sm text-muted-foreground">
                                    An unexpected error occurred. Try refreshing the page.
                                </p>
                            </div>
                            <Button
                                onClick={() => window.location.reload()}
                                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                data-testid="error-boundary-refresh"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
