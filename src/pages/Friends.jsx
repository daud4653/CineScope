import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Film, MessageCircle, Search, X, Check, XCircle } from 'lucide-react';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

const Friends = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, []);

  const fetchFriends = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/social/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/social/friends/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/social/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const sendFriendRequest = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/social/friends/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (data.success) {
        message.success('Friend request sent!');
        fetchPendingRequests();
        setSearchResults(searchResults.filter(u => u._id !== userId));
      } else {
        message.error(data.message || 'Failed to send request');
      }
    } catch (error) {
      message.error('Error sending friend request');
      console.error('Error:', error);
    }
  };

  const acceptRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/social/friends/accept/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        message.success('Friend request accepted!');
        fetchFriends();
        fetchPendingRequests();
      } else {
        message.error(data.message || 'Failed to accept request');
      }
    } catch (error) {
      message.error('Error accepting request');
      console.error('Error:', error);
    }
  };

  const rejectRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/social/friends/reject/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        message.success('Friend request rejected');
        fetchPendingRequests();
      } else {
        message.error(data.message || 'Failed to reject request');
      }
    } catch (error) {
      message.error('Error rejecting request');
      console.error('Error:', error);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyan-400 text-lg font-mono">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black mb-2 tracking-tight">Friends & Collaboration</h1>
          <p className="text-gray-400 font-mono text-sm">Connect and share with your movie community</p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-2 font-mono uppercase text-sm sm:text-base"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          {showSearch ? 'CANCEL' : 'ADD FRIEND'}
        </button>
      </div>

      {/* Search Users */}
      {showSearch && (
        <div className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20" style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="w-full h-12 pl-10 pr-4 bg-[#0a0a0a] border border-cyan-500/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-cyan-500/10 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {user.photo ? (
                      <img
                        src={`http://localhost:5000/${user.photo}`}
                        alt={user.fullName || user.username}
                        className="w-10 h-10 rounded-lg object-cover border-2 border-cyan-500/30"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm ${user.photo ? 'hidden' : ''}`}
                    >
                      {getUserInitials(user.fullName || user.username)}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{user.fullName || user.username}</div>
                      <div className="text-gray-400 text-xs font-mono">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(user._id)}
                    className="px-4 py-2 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center gap-2 text-sm font-mono uppercase"
                  >
                    <UserPlus className="w-4 h-4" />
                    ADD
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-white text-xl font-bold mb-4">Pending Friend Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              const otherUser = request.requester._id === currentUser._id || request.requester._id?.toString() === currentUser._id?.toString()
                ? request.recipient 
                : request.requester;
              return (
                <div
                  key={request._id}
                  className="p-4 rounded-lg bg-[#0f0f0f] border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {otherUser.photo ? (
                        <img
                          src={`http://localhost:5000/${otherUser.photo}`}
                          alt={otherUser.fullName || otherUser.username}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-cyan-500/30"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold ${otherUser.photo ? 'hidden' : ''}`}
                      >
                        {getUserInitials(otherUser.fullName || otherUser.username)}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{otherUser.fullName || otherUser.username}</div>
                        <div className="text-gray-400 text-xs font-mono">{otherUser.email}</div>
                      </div>
                    </div>
                    {(() => {
                      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                      return request.requester._id?.toString() !== currentUser._id?.toString();
                    })() && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => acceptRequest(request._id)}
                          className="px-4 py-2 rounded-lg bg-[#0f0f0f] border-2 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400 transition-all flex items-center gap-2 font-mono uppercase text-sm"
                        >
                          <Check className="w-4 h-4" />
                          ACCEPT
                        </button>
                        <button
                          onClick={() => rejectRequest(request._id)}
                          className="px-4 py-2 rounded-lg bg-[#0f0f0f] border-2 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 transition-all flex items-center gap-2 font-mono uppercase text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          REJECT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends Grid */}
      <div>
        <h2 className="text-white text-xl font-bold mb-4">Your Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-cyan-400/20 mx-auto mb-4" />
            <h4 className="text-gray-400 text-xl mb-2">No friends yet</h4>
            <p className="text-gray-500 text-sm">Start by searching and adding friends!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)' }}
              >
                <div className="flex items-center gap-4 mb-4">
                  {friend.photo ? (
                    <img
                      src={`http://localhost:5000/${friend.photo}`}
                      alt={friend.fullName || friend.username}
                      className="w-14 h-14 rounded-lg object-cover border-2 border-cyan-500/30"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-14 h-14 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold ${friend.photo ? 'hidden' : ''}`}
                  >
                    {getUserInitials(friend.fullName || friend.username)}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold">{friend.fullName || friend.username}</div>
                    <div className="text-gray-400 text-xs font-mono">{friend.email}</div>
                  </div>
                </div>
                {friend.favoriteGenres && friend.favoriteGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {friend.favoriteGenres.slice(0, 3).map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 text-xs font-mono"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                <button 
                  onClick={() => navigate(`/dashboard/profile?userId=${friend._id}`)}
                  className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center justify-center gap-2 font-mono uppercase text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  VIEW PROFILE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
