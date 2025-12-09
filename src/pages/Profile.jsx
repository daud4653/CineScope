import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Camera, Save, Film } from 'lucide-react';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

const Profile = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bio: '',
    favoriteGenres: [],
  });
  const [stats, setStats] = useState({
    moviesWatched: 0,
    reviewsWritten: 0,
    friends: 0,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const profileUserId = userId || currentUser._id;
    setIsOwnProfile(!userId || userId === currentUser._id);

    // Fetch user profile
    const endpoint = userId && userId !== currentUser._id 
      ? `${API_BASE_URL}/users/${userId}`
      : `${API_BASE_URL}/users/profile`;
    
    fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          setFormData({
            fullName: data.user.fullName || '',
            email: data.user.email || '',
            bio: data.user.bio || '',
            favoriteGenres: data.user.favoriteGenres || [],
          });
          if (data.stats) {
            setStats(data.stats);
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching profile:', error);
        // Use cached user as fallback
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          setFormData({
            fullName: userData.fullName || '',
            email: userData.email || '',
            bio: userData.bio || '',
            favoriteGenres: userData.favoriteGenres || [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          bio: formData.bio,
          favoriteGenres: formData.favoriteGenres,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        message.success('Profile updated successfully!');
      } else {
        message.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      message.error('Error updating profile');
      console.error('Update error:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        message.success('Profile photo updated!');
      } else {
        message.error(data.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      message.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyan-400 text-lg font-mono">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black mb-2 tracking-tight">Profile</h1>
        <p className="text-gray-400 font-mono text-sm">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20 text-center" style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}>
            <div className="relative inline-block mb-4">
              {user?.photo ? (
                <img 
                  src={`http://localhost:5000${user.photo}`} 
                  alt={user.fullName} 
                  className="w-32 h-32 rounded-xl object-cover border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-32 h-32 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-black text-4xl shadow-[0_0_30px_rgba(6,182,212,0.5)] ${user?.photo ? 'hidden' : ''}`}>
                {getUserInitials()}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 rounded-lg bg-[#0a0a0a] border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex items-center justify-center cursor-pointer">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            <h2 className="text-white text-2xl font-bold mb-1">{formData.fullName || 'User'}</h2>
            <p className="text-gray-400 text-sm font-mono mb-4">{formData.email}</p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {formData.favoriteGenres.map((genre, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-mono"
                >
                  {genre}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-cyan-500/10">
                <div className="flex items-center gap-3">
                  <Film className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-400 text-sm">Movies Watched</span>
                </div>
                <span className="text-white font-bold">{stats.moviesWatched}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-cyan-500/10">
                <div className="flex items-center gap-3">
                  <Film className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm">Reviews Written</span>
                </div>
                <span className="text-white font-bold">{stats.reviewsWritten}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-cyan-500/10">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-pink-400" />
                  <span className="text-gray-400 text-sm">Friends</span>
                </div>
                <span className="text-white font-bold">{stats.friends}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form - Only show if own profile */}
        {isOwnProfile && (
          <div className="lg:col-span-2">
            <div className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20" style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}>
              <h2 className="text-white text-xl font-bold mb-6">Edit Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm font-mono mb-2 block">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full h-12 px-4 bg-[#0a0a0a] border border-cyan-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm font-mono mb-2 block">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 px-4 bg-[#0a0a0a] border border-cyan-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm font-mono mb-2 block">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-cyan-500/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="w-full h-12 px-6 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center justify-center gap-2 border border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* View Only - For other users' profiles */}
        {!isOwnProfile && (
          <div className="lg:col-span-2">
            <div className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20" style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}>
              <h2 className="text-white text-xl font-bold mb-6">About</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm font-mono mb-2 block">Bio</label>
                  <p className="text-white">{formData.bio || 'No bio available'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
