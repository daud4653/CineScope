import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, TrendingUp, Clock, Film, Star } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [genreData, setGenreData] = useState([
    { name: 'Action', value: 35, color: '#06b6d4' },
    { name: 'Drama', value: 25, color: '#9333ea' },
    { name: 'Comedy', value: 20, color: '#ec4899' },
    { name: 'Sci-Fi', value: 15, color: '#3b82f6' },
    { name: 'Horror', value: 5, color: '#ef4444' },
  ]);
  const [watchTimeData, setWatchTimeData] = useState([
    { day: 'Mon', hours: 3.5 },
    { day: 'Tue', hours: 2.8 },
    { day: 'Wed', hours: 4.2 },
    { day: 'Thu', hours: 3.1 },
    { day: 'Fri', hours: 5.0 },
    { day: 'Sat', hours: 6.5 },
    { day: 'Sun', hours: 4.8 },
  ]);
  const [stats, setStats] = useState([
    { icon: Clock, label: 'Total Watch Time', value: '0h', color: 'cyan' },
    { icon: Film, label: 'Movies Watched', value: '0', color: 'purple' },
    { icon: Star, label: 'Avg Rating', value: '0', color: 'pink' },
    { icon: TrendingUp, label: 'AI Accuracy', value: '0%', color: 'blue' },
  ]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.analytics) {
        const analytics = data.analytics;
        setStats([
          { icon: Clock, label: 'Total Watch Time', value: `${analytics.totalWatchTime}h`, color: 'cyan' },
          { icon: Film, label: 'Movies Watched', value: `${analytics.moviesWatched}`, color: 'purple' },
          { icon: Star, label: 'Avg Rating', value: `${analytics.averageRating}`, color: 'pink' },
          { icon: TrendingUp, label: 'AI Accuracy', value: `${analytics.aiAccuracy}%`, color: 'blue' },
        ]);
        if (analytics.genreFrequency) {
          setGenreData(analytics.genreFrequency);
        }
        if (analytics.weeklyWatchTime) {
          setWatchTimeData(analytics.weeklyWatchTime);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export
    alert('Exporting analytics report as PDF...');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-black mb-2 tracking-tight">Analytics</h1>
          <p className="text-gray-400 font-mono text-xs sm:text-sm">Your viewing insights & AI performance</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white flex items-center gap-2 border border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all"
        >
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colorClasses = {
            cyan: 'from-cyan-500/20 to-cyan-500/10 border-cyan-500/30 text-cyan-400',
            purple: 'from-purple-500/20 to-purple-500/10 border-purple-500/30 text-purple-400',
            pink: 'from-pink-500/20 to-pink-500/10 border-pink-500/30 text-pink-400',
            blue: 'from-blue-500/20 to-blue-500/10 border-blue-500/30 text-blue-400',
          };
          return (
            <div
              key={idx}
              className={`p-6 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} border backdrop-blur-sm`}
              style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)' }}
            >
              <Icon className="w-8 h-8 mb-4" />
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400 font-mono">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Frequency Pie Chart */}
        <div className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20" style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}>
          <h2 className="text-white text-xl font-bold mb-6">Genre Frequency</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genreData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {genreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Watch Time Bar Chart */}
        <div className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20" style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}>
          <h2 className="text-white text-xl font-bold mb-6">Weekly Watch Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={watchTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.1)" />
              <XAxis dataKey="day" stroke="#6b7280" style={{ fontFamily: 'monospace' }} />
              <YAxis stroke="#6b7280" style={{ fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f0f',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="hours" fill="url(#colorGradient)">
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendation Accuracy */}
      <div className="p-6 rounded-xl bg-[#0f0f0f] border border-cyan-500/20" style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.1)' }}>
        <h2 className="text-white text-xl font-bold mb-6">AI Recommendation Accuracy</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-mono">Overall Score</span>
              <span className="text-cyan-400 font-bold">87%</span>
            </div>
            <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden border border-cyan-500/20">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                style={{ width: '87%', boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-[#0a0a0a] border border-cyan-500/10">
              <div className="text-gray-400 text-xs font-mono mb-1">Precision</div>
              <div className="text-cyan-400 text-2xl font-black">92%</div>
            </div>
            <div className="p-4 rounded-lg bg-[#0a0a0a] border border-purple-500/10">
              <div className="text-gray-400 text-xs font-mono mb-1">Recall</div>
              <div className="text-purple-400 text-2xl font-black">84%</div>
            </div>
            <div className="p-4 rounded-lg bg-[#0a0a0a] border border-pink-500/10">
              <div className="text-gray-400 text-xs font-mono mb-1">F1 Score</div>
              <div className="text-pink-400 text-2xl font-black">88%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

