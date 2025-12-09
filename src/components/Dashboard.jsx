import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Bookmark,
  BarChart3,
  User,
  Settings,
  Search,
  Filter,
  Bell,
  ChevronDown,
  Play,
  ChevronsLeft,
  ChevronsRight,
  Film,
  Users,
  Share2,
  X,
  Menu,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'Movies');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [yearRange, setYearRange] = useState({ min: '', max: '' });
  const [ratingRange, setRatingRange] = useState({ min: '', max: '' });
  const [user, setUser] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchDebounce, setSearchDebounce] = useState(null);

  useEffect(() => {
    // Read tab from URL params
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    // Close user menu when clicking outside
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user data
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      })
      .catch((error) => {
        console.error('Error fetching user:', error);
        // Try to use cached user
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      });

    // Fetch notifications count
    fetch(`${API_BASE_URL}/social/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUnreadNotifications(data.unreadCount || 0);
        }
      })
      .catch((error) => {
        console.error('Error fetching notifications:', error);
      });
  }, [navigate]);

  const menuItems = [
    { key: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { key: '/dashboard/watchlist', icon: Bookmark, label: 'Watchlist' },
    { key: '/dashboard/friends', icon: Users, label: 'Friends' },
    { key: '/dashboard/shared-watchlists', icon: Share2, label: 'Shared Watchlists' },
    { key: '/dashboard/movie-details', icon: Film, label: 'Movie Details' },
    { key: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Adventure'];

  const handleMenuClick = (key) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const handleFilterToggle = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenres([]);
    setYearRange({ min: '', max: '' });
    setRatingRange({ min: '', max: '' });
  };

  // Get user initials and name
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const getUserName = () => {
    return user?.fullName || user?.username || 'User';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 15, 15, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 4px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex h-screen overflow-hidden">
        {/* Mobile Overlay */}
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Left Sidebar */}
        <aside
          className={`${
            leftCollapsed ? 'w-20' : 'w-64'
          } bg-[#0f0f0f] border-r border-cyan-500/10 flex flex-col flex-shrink-0 fixed left-0 top-0 bottom-0 z-50 transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Collapse Button */}
          <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between lg:justify-end">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-cyan-500/10"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setLeftCollapsed(!leftCollapsed)}
              className="hidden lg:block text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-cyan-500/10 border border-gray-700/50 hover:border-cyan-500/50"
              title={leftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {leftCollapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => handleMenuClick(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={leftCollapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!leftCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="p-4 border-t border-cyan-500/10 space-y-1">
            <button
              onClick={() => handleMenuClick('/dashboard/profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive('/dashboard/profile')
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={leftCollapsed ? 'Profile' : ''}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {!leftCollapsed && <span className="text-sm font-medium">Profile</span>}
            </button>
            <button
              onClick={() => handleMenuClick('/dashboard/settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive('/dashboard/settings')
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={leftCollapsed ? 'Settings' : ''}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!leftCollapsed && <span className="text-sm font-medium">Settings</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col w-full ${
            leftCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {/* Top Navigation */}
          <header className="sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-cyan-500/10">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Top Row: Mobile Menu + Tabs, Search, User */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between gap-3">
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-cyan-500/10"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  
                  {/* Tabs */}
                  <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-hide flex-1">
                    <button
                      onClick={() => {
                        setActiveTab('Movies');
                        if (location.pathname === '/dashboard') {
                          navigate('/dashboard?tab=Movies');
                        }
                      }}
                      className={`pb-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'Movies'
                          ? 'text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Movies
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('TV Shows');
                        if (location.pathname === '/dashboard') {
                          navigate('/dashboard?tab=TV Shows');
                        }
                      }}
                      className={`pb-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'TV Shows'
                          ? 'text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      TV Shows
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('Anime');
                        if (location.pathname === '/dashboard') {
                          navigate('/dashboard?tab=Anime');
                        }
                      }}
                      className={`pb-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === 'Anime'
                          ? 'text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Anime
                    </button>
                  </div>

                  {/* Right: Notifications & User */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => navigate('/dashboard/notifications')}
                      className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                      {unreadNotifications > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]"></span>
                      )}
                    </button>
                    <div className="relative user-menu-container">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-all"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                          {getUserInitials()}
                        </div>
                      </button>
                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#0f0f0f] border border-cyan-500/20 rounded-lg shadow-xl overflow-hidden z-50 animate-fadeIn">
                          <div className="px-4 py-2 border-b border-cyan-500/10">
                            <div className="text-white font-semibold text-sm truncate">{getUserName()}</div>
                            <div className="text-gray-400 text-xs font-mono truncate">{getUserEmail()}</div>
                          </div>
                          <button
                            onClick={() => {
                              navigate('/dashboard/profile');
                              setShowUserMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left text-gray-300 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                          >
                            Profile
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 z-10" />
                  <input
                    type="text"
                    placeholder="Search movies, actors..."
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      
                      // Clear previous debounce
                      if (searchDebounce) {
                        clearTimeout(searchDebounce);
                      }
                      
                      // Navigate to search results after 500ms delay
                      if (value.trim().length >= 2) {
                        const timeout = setTimeout(() => {
                          navigate(`/dashboard/search?q=${encodeURIComponent(value)}&type=multi`);
                        }, 500);
                        setSearchDebounce(timeout);
                      } else if (value.trim().length === 0 && location.pathname.includes('/search')) {
                        navigate('/dashboard');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                        if (searchDebounce) {
                          clearTimeout(searchDebounce);
                        }
                        navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=multi`);
                      }
                    }}
                    className="w-full h-9 sm:h-10 pl-9 sm:pl-12 pr-16 sm:pr-20 bg-[#0f0f0f] border border-cyan-500/20 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-xs sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        if (searchDebounce) {
                          clearTimeout(searchDebounce);
                        }
                        if (location.pathname.includes('/search')) {
                          navigate('/dashboard');
                        }
                      }}
                      className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="p-3 sm:p-4 rounded-lg bg-[#0f0f0f] border border-cyan-500/20 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-xs sm:text-sm">Filters</h3>
                    <button
                      onClick={clearFilters}
                      className="text-cyan-400 text-xs hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {/* Genres */}
                  <div>
                    <label className="text-gray-400 text-xs mb-2 block">Genres</label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {genres.map((genre) => (
                        <button
                          key={genre}
                          onClick={() => handleFilterToggle(genre)}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedGenres.includes(genre)
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-[#0a0a0a] text-gray-400 border border-cyan-500/10 hover:border-cyan-500/30'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year Range */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-gray-400 text-xs mb-1.5 sm:mb-2 block">Year From</label>
                      <input
                        type="number"
                        placeholder="1990"
                        value={yearRange.min}
                        onChange={(e) => setYearRange({ ...yearRange, min: e.target.value })}
                        className="w-full h-8 sm:h-9 px-2 sm:px-3 bg-[#0a0a0a] border border-cyan-500/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1.5 sm:mb-2 block">Year To</label>
                      <input
                        type="number"
                        placeholder="2024"
                        value={yearRange.max}
                        onChange={(e) => setYearRange({ ...yearRange, max: e.target.value })}
                        className="w-full h-8 sm:h-9 px-2 sm:px-3 bg-[#0a0a0a] border border-cyan-500/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Rating Range */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-gray-400 text-xs mb-1.5 sm:mb-2 block">Rating From</label>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="10"
                        step="0.1"
                        value={ratingRange.min}
                        onChange={(e) => setRatingRange({ ...ratingRange, min: e.target.value })}
                        className="w-full h-8 sm:h-9 px-2 sm:px-3 bg-[#0a0a0a] border border-cyan-500/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1.5 sm:mb-2 block">Rating To</label>
                      <input
                        type="number"
                        placeholder="10"
                        min="0"
                        max="10"
                        step="0.1"
                        value={ratingRange.max}
                        onChange={(e) => setRatingRange({ ...ratingRange, max: e.target.value })}
                        className="w-full h-8 sm:h-9 px-2 sm:px-3 bg-[#0a0a0a] border border-cyan-500/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
