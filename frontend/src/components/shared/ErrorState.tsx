import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <Card className="border-rose-500/30 bg-rose-950/20 p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-base font-semibold text-rose-200">{title}</h4>
          <p className="text-xs text-rose-300/80 leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="border-rose-500/40 text-rose-200 hover:bg-rose-500/20 shrink-0"
          >
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
};
