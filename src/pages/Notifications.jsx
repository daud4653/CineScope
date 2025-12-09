import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Film, Star, AlertCircle, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Mark all as read when visiting notifications page
    const markAllAsRead = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        await fetch(`${API_BASE_URL}/social/notifications/read-all`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    };
    
    const timer = setTimeout(() => {
      markAllAsRead();
    }, 2000); // Mark as read after 2 seconds on page
    
    return () => clearTimeout(timer);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/social/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/social/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Update local state
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIconByType = (type) => {
    const icons = {
      friend_request: UserPlus,
      friend_accepted: UserPlus,
      watchlist_shared: Film,
      watchlist_movie_added: Film,
      review: Star,
      like: Heart,
      comment: MessageCircle,
    };
    return icons[type] || Bell;
  };

  const getIconColor = (type) => {
    const colors = {
      friend_request: 'text-cyan-400',
      friend_accepted: 'text-green-400',
      watchlist_shared: 'text-purple-400',
      watchlist_movie_added: 'text-blue-400',
      review: 'text-yellow-400',
      like: 'text-pink-400',
      comment: 'text-blue-400',
    };
    return colors[type] || 'text-gray-400';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-cyan-400 text-lg font-mono">Loading notifications...</div>
      </div>
    );
  }

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch(`${API_BASE_URL}/social/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black mb-2 tracking-tight">Notifications</h1>
          <p className="text-gray-400 font-mono text-sm">Stay updated with your movie community</p>
        </div>
        {notifications.length > 0 && notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-2 font-mono uppercase text-xs sm:text-sm"
          >
            <Check className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-16 h-16 text-cyan-400/20 mx-auto mb-4" />
          <h4 className="text-gray-400 text-xl mb-2">No notifications yet</h4>
          <p className="text-gray-500 text-sm">You'll see notifications here when you have activity</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = getIconByType(notification.type);
            return (
              <div
                key={notification._id}
                onClick={() => !notification.read && markAsRead(notification._id)}
                className={`p-4 sm:p-6 rounded-xl border transition-all cursor-pointer ${
                  !notification.read
                    ? 'bg-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/50'
                    : 'bg-[#0f0f0f] border-cyan-500/20 hover:border-cyan-500/40'
                }`}
                style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)' }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1">
                      <span className="text-white font-bold text-sm sm:text-base truncate">{notification.type.replace(/_/g, ' ').toUpperCase()}</span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-gray-300 mb-2 text-xs sm:text-sm">{notification.message}</p>
                    <span className="text-gray-500 text-xs font-mono">{formatTime(notification.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;

