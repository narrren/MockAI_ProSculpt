import React, { useEffect, useState } from 'react';
import './AlertFlash.css';

const AlertFlash = ({ alerts, onDismiss }) => {
  const [visibleAlerts, setVisibleAlerts] = useState([]);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      // Add new alerts
      const newAlerts = alerts.map((alert, index) => ({
        id: Date.now() + index,
        text: alert,
        show: true
      }));
      
      setVisibleAlerts(prev => [...prev, ...newAlerts]);

      // Auto-dismiss after 5 seconds
      const timers = newAlerts.map(alert => {
        return setTimeout(() => {
          setVisibleAlerts(prev => prev.filter(a => a.id !== alert.id));
          if (onDismiss) {
            onDismiss(alert.id);
          }
        }, 5000);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [alerts, onDismiss]);

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <>
      {visibleAlerts.map((alert, index) => (
        <div
          key={alert.id}
          className="flash"
          style={{
            zIndex: 70 + index,
            animationDelay: `${index * 0.1}s`
          }}
        >
          <div className="flash__panel">
            <div className="flash__message flash__message--warning">
              ⚠️ {alert.text}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default AlertFlash;

