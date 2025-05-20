import * as React from 'react';

export function FullScreenLoader() {
  const [visible, setVisible] = React.useState(false);

  // Delayed appearance to avoid flickering for quick operations
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 400); // 400ms delay before showing the loader

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="loading-overlay animate-in fade-in duration-500">
      <div className="overlay-loader"></div>
      <div className="loading-text">Processing your payment...</div>
    </div>
  );
}
