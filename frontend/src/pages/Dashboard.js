import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { useLanguage } from '../context/LanguageContext';
import { Users, Building2, FileText, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import LinkedInPostPreview from '../components/LinkedInPostPreview';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { apiClient } = useApi();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    persons: 0,
    companies: 0,
    posts: 0
  });
  const [recentPosts, setRecentPosts] = useState([]);
  const [persons, setPersons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats and data with retry logic for initial load
      const [personsRes, companiesRes, postsRes] = await Promise.all([
        apiClient.get('/persons', { allowEmptyCache: true }),
        apiClient.get('/companies', { allowEmptyCache: true }),
        apiClient.get('/posts', { allowEmptyCache: true })
      ]);

      setPersons(personsRes.data.data || []);
      setCompanies(companiesRes.data.data || []);
      
      setStats({
        persons: personsRes.data.data?.length || 0,
        companies: companiesRes.data.data?.length || 0,
        posts: postsRes.data.data?.length || 0
      });

      // Fetch recent posts
      const recentPostsRes = await apiClient.get('/posts?limit=5', { allowEmptyCache: true });
      setRecentPosts(recentPostsRes.data.data?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error);
      
      // Check if it's a connection error (backend not ready)
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        toast.error('Backend server is not ready. Please wait a moment and refresh the page.');
        
        // Retry after 3 seconds
        setTimeout(() => {
          fetchDashboardData();
        }, 3000);
      } else {
        toast.error('Failed to load dashboard data: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const getEntityName = (entityType, entityId) => {
    if (entityType === 'person') {
      const person = persons.find(p => p.id === entityId);
      return person ? person.name : 'Unknown Person';
    } else {
      const company = companies.find(c => c.id === entityId);
      return company ? company.name : 'Unknown Company';
    }
  };

  const getEntityProfile = (entityType, entityId) => {
    if (entityType === 'person') {
      const person = persons.find(p => p.id === entityId);
      return {
        name: person ? person.name : 'Unknown Person',
        title: person ? person.title : 'Professional',
        company: person ? person.company : 'Your Company',
        avatar: person ? person.avatar : null
      };
    } else {
      const company = companies.find(c => c.id === entityId);
      return {
        name: company ? company.name : 'Unknown Company',
        title: 'Company Page',
        company: company ? company.industry : 'Business',
        avatar: company ? company.logo : null
      };
    }
  };

  const statCards = [
    {
      name: t('persons'),
      value: stats.persons,
      icon: Users,
      href: '/profiles',
      color: 'bg-blue-500'
    },
    {
      name: t('companies'),
      value: stats.companies,
      icon: Building2,
      href: '/profiles',
      color: 'bg-green-500'
    },
    {
      name: t('posts'),
      value: stats.posts,
      icon: FileText,
      href: '/posts',
      color: 'bg-purple-500'
    },
    {
      name: t('activeSchedules'),
      value: stats.schedules,
      icon: Clock,
      href: '/schedules',
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('dashboardTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboardSubtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-linkedin-500 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-500">Loading dashboard data...</p>
            <p className="mt-1 text-xs text-gray-400">This may take a moment on first startup</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('dashboardTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboardSubtitle')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="rounded-full bg-red-100 p-3 mx-auto w-16 h-16 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Failed to load dashboard</h3>
            <p className="mt-2 text-sm text-gray-500">
              {error.code === 'ECONNREFUSED' || error.message.includes('Network Error') 
                ? 'Backend server is not ready. Please wait a moment and try again.'
                : 'There was an error loading the dashboard data.'}
            </p>
            <div className="mt-6">
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('dashboardTitle')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('dashboardSubtitle')}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/profiles"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linkedin-600 hover:bg-linkedin-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addPerson')}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.href}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <dt>
                <div className={`absolute ${stat.color} rounded-md p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </dd>
            </Link>
          );
        })}
      </div>

      {/* Recent Posts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {t('recentPosts')}
          </h3>
          {recentPosts.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noPostsYet')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('getStartedText')}
              </p>
              <div className="mt-6">
                <Link
                  to="/profiles"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addPerson')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {recentPosts.map((post) => {
                const entityProfile = getEntityProfile(post.entity_type, post.entity_id);
                const userProfile = {
                  name: entityProfile.name,
                  title: entityProfile.title,
                  company: entityProfile.company,
                  avatar: entityProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entityProfile.name)}&background=0077b5&color=fff&size=48`,
                  timeAgo: "now"
                };
                
                return (
                  <div key={post.id} className="relative">
                    {/* Status badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'posted' ? 'bg-green-100 text-green-800' :
                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    
                    {/* LinkedIn Preview */}
                    <LinkedInPostPreview 
                      post={post} 
                      userProfile={userProfile}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
