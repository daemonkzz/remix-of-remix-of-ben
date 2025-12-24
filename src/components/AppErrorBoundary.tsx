import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("AppErrorBoundary caught an error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4">
          <header className="space-y-1">
            <h1 className="font-display text-xl">Sayfa yüklenemedi</h1>
            <p className="text-sm text-muted-foreground">
              Beklenmeyen bir hata oluştu. Sayfayı yenileyip tekrar deneyin.
            </p>
          </header>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Yeniden dene
            </Button>
            <Button variant="secondary" onClick={() => (window.location.href = "/")} className="w-full">
              Ana sayfa
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
