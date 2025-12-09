import { useState, useEffect } from 'react';
import { Plus, Share2, Users, Film, Trash2, UserPlus, X } from 'lucide-react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const SharedWatchlists = () => {
  const navigate = useNavigate();
  const [watchlists, setWatchlists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });
  const [friends, setFriends] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    fetchWatchlists();
    fetchFriends();
  }, []);

  const fetchWatchlists = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/social/watchlist/shared`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setWatchlists(data.sharedWatchlists || []);
      } else {
        console.error('Failed to fetch watchlists:', data.message);
        message.error(data.message || 'Failed to load shared watchlists');
      }
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      message.error('Failed to load shared watchlists');
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const createWatchlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!formData.name.trim()) {
      message.error('Watchlist name is required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/social/watchlist/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          members: selectedMembers,
          isPublic: formData.isPublic,
        }),
      });
      const data = await response.json();
      if (data.success) {
        message.success('Shared watchlist created!');
        setShowCreateModal(false);
        setFormData({ name: '', description: '', isPublic: false });
        setSelectedMembers([]);
        fetchWatchlists();
      } else {
        message.error(data.message || 'Failed to create watchlist');
      }
    } catch (error) {
      message.error('Error creating watchlist');
      console.error('Error:', error);
    }
  };

  const toggleMember = (friendId) => {
    setSelectedMembers(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyan-400 text-lg font-mono">Loading shared watchlists...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black mb-2 tracking-tight">Shared Watchlists</h1>
          <p className="text-gray-400 font-mono text-sm">Create and collaborate on watchlists with friends</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center gap-2 border border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Create Shared Watchlist
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-cyan-500/20 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar" style={{ boxShadow: '0 0 50px rgba(6, 182, 212, 0.3)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-2xl font-bold">Create Shared Watchlist</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm font-mono mb-2 block">Watchlist Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekend Movie Night"
                  className="w-full h-12 px-4 bg-[#0a0a0a] border border-cyan-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm font-mono mb-2 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this watchlist..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-cyan-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm font-mono mb-2 block">Add Friends</label>
                {friends.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[#0a0a0a] border border-cyan-500/10 text-center">
                    <p className="text-gray-400 text-sm">No friends yet. <button onClick={() => navigate('/dashboard/friends')} className="text-cyan-400 hover:underline">Add friends</button> to share watchlists!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {friends.map((friend) => (
                      <div
                        key={friend._id}
                        onClick={() => toggleMember(friend._id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedMembers.includes(friend._id)
                            ? 'bg-cyan-500/20 border-cyan-500/50'
                            : 'bg-[#0a0a0a] border-cyan-500/10 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {getUserInitials(friend.fullName || friend.username)}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{friend.fullName || friend.username}</div>
                          <div className="text-gray-400 text-xs font-mono">{friend.email}</div>
                        </div>
                        {selectedMembers.includes(friend._id) && (
                          <div className="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                            <X className="w-3 h-3 text-[#0a0a0a]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded border-cyan-500/30 bg-[#0a0a0a] text-cyan-500 focus:ring-cyan-500/50"
                />
                <label htmlFor="isPublic" className="text-gray-400 text-sm cursor-pointer">
                  Make this watchlist public
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={createWatchlist}
                  className="flex-1 h-12 px-6 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center justify-center gap-2 border border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Watchlist
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 h-12 rounded-lg bg-[#0a0a0a] border border-cyan-500/30 text-gray-400 hover:text-white hover:bg-cyan-500/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Watchlists Grid */}
      {watchlists.length === 0 ? (
        <div className="text-center py-16">
          <Share2 className="w-16 h-16 text-cyan-400/20 mx-auto mb-4" />
          <h4 className="text-gray-400 text-xl mb-2">No shared watchlists yet</h4>
          <p className="text-gray-500 text-sm mb-6">Create a shared watchlist to collaborate with friends!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center gap-2 mx-auto border border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Your First Watchlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {watchlists.map((watchlist) => (
            <div
              key={watchlist._id}
              className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
              style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white text-xl font-bold">{watchlist.name}</h3>
                    {watchlist.isPublic && (
                      <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-purple-400 text-xs font-mono">
                        Public
                      </span>
                    )}
                  </div>
                  {watchlist.description && (
                    <p className="text-gray-400 text-sm mb-3">{watchlist.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{watchlist.members?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Film className="w-4 h-4" />
                      <span>{watchlist.movieCount || watchlist.movies?.length || 0} movies</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-gray-400 text-xs font-mono">Owner: </div>
                <div className="text-cyan-400 text-xs font-mono">{watchlist.owner?.fullName || watchlist.owner?.username || 'Unknown'}</div>
              </div>
              {watchlist.members && watchlist.members.length > 0 && (
                <div className="mb-4">
                  <div className="text-gray-400 text-xs font-mono mb-2">Members:</div>
                  <div className="flex flex-wrap gap-2">
                    {watchlist.members.slice(0, 5).map((member, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs"
                        title={member.user?.fullName || member.user?.username}
                      >
                        {getUserInitials(member.user?.fullName || member.user?.username)}
                      </div>
                    ))}
                    {watchlist.members.length > 5 && (
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-mono">
                        +{watchlist.members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={() => navigate(`/dashboard/watchlist?shared=${watchlist._id}`)}
                className="w-full px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Film className="w-4 h-4" />
                View Watchlist
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedWatchlists;

