'use client';

import { NotificationCenter } from './NotificationCenter';

/**
 * Notification Demo Component
 * 
 * Simple demo to test the responsive behavior of the notification components.
 * This can be used for testing or removed in production.
 */
export function NotificationDemo() {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Notification Demo</h2>
        <p className="text-muted-foreground">
          Test the notification bell on different screen sizes
        </p>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <h3 className="text-lg font-semibold mb-4">Desktop Layout</h3>
        <div className="flex items-center justify-center gap-4 p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Other controls...</div>
          <NotificationCenter />
          <div className="text-sm text-muted-foreground">User menu...</div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <h3 className="text-lg font-semibold mb-4">Mobile Layout</h3>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="text-sm text-muted-foreground">Logo</div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <div className="text-sm text-muted-foreground">Menu</div>
          </div>
        </div>
      </div>

      {/* Responsive Header Simulation */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Header Simulation</h3>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="text-sm font-medium">Dashboard</div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
              U
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <h4 className="font-semibold mb-2">Testing Instructions:</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Click the notification bell to open the dropdown</li>
          <li>• Resize your browser to test mobile responsiveness</li>
          <li>• The badge should show unread count (if any)</li>
          <li>• Dropdown should position correctly on all screen sizes</li>
        </ul>
      </div>
    </div>
  );
}