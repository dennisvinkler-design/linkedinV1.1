import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { Calendar, Clock, Plus, Trash2, XCircle } from 'lucide-react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import toast from 'react-hot-toast';
import LinkedInPostPreview from '../components/LinkedInPostPreview';

const localizer = momentLocalizer(moment);

const Schedules = () => {
  const { apiClient } = useApi();
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: '',
    scheduled_time: '09:00'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/posts');
      const postsData = response.data.data || [];
      setPosts(postsData);
      
      // Convert posts to calendar events
      const calendarEvents = postsData
        .filter(post => post.status === 'scheduled' && post.scheduled_date)
        .map(post => ({
          id: post.id,
          title: post.content.substring(0, 50) + '...',
          start: new Date(post.scheduled_date),
          end: new Date(post.scheduled_date),
          resource: post
        }));
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSchedulePost = (post) => {
    setSelectedPost(post);
    setScheduleForm({
      scheduled_date: '',
      scheduled_time: '09:00'
    });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!scheduleForm.scheduled_date) {
        toast.error('Please select a date');
        return;
      }

      const scheduledDateTime = new Date(`${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}`);
      
      await apiClient.put(`/posts/${selectedPost.id}`, {
        status: 'scheduled',
        scheduled_date: scheduledDateTime.toISOString()
      });

      toast.success('Post scheduled successfully!');
      setShowScheduleModal(false);
      setSelectedPost(null);
      fetchData();
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('Failed to schedule post');
    }
  };

  const handleUnschedulePost = async (post) => {
    try {
      await apiClient.put(`/posts/${post.id}`, {
        status: 'draft',
        scheduled_date: null
      });

      toast.success('Post unscheduled successfully!');
      fetchData();
    } catch (error) {
      console.error('Error unscheduling post:', error);
      toast.error('Failed to unschedule post');
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('Er du sikker på at du vil slette dette opslag?')) {
      return;
    }

    try {
      await apiClient.delete(`/posts/${post.id}`);
      toast.success('Opslag slettet succesfuldt!');
      setShowScheduleModal(false);
      setSelectedPost(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Kunne ikke slette opslag');
    }
  };

  const getDraftPosts = () => {
    return posts.filter(post => post.status === 'draft');
  };

  const getScheduledPosts = () => {
    return posts.filter(post => post.status === 'scheduled');
  };

  const eventStyleGetter = (event) => {
    const post = event.resource;
    let backgroundColor = '#0077b5'; // LinkedIn blue
    
    if (post.status === 'scheduled') {
      backgroundColor = '#0077b5';
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-linkedin-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Plan and manage your LinkedIn posts</p>
        </div>
      </div>

      {/* Top Section: Calendar and Scheduled Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section - Left Column */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Post Calendar
            </h2>
          </div>
          <div className="p-6">
            <div style={{ height: '500px' }}>
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day']}
                defaultView="month"
                popup
                onSelectEvent={(event) => {
                  // Show post details when clicking on event
                  const post = event.resource;
                  alert(`Post: ${post.content.substring(0, 100)}...`);
                }}
              />
            </div>
          </div>
        </div>

        {/* Scheduled Posts Section - Right Column */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Scheduled Posts
            </h2>
          </div>
          <div className="p-6">
            {getScheduledPosts().length === 0 ? (
              <p className="text-gray-500 text-center py-8">No posts scheduled</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {getScheduledPosts().map((post) => (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 line-clamp-3 mb-2">
                          {post.content}
                        </p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.hashtags.map((hashtag, index) => (
                              <span key={index} className="text-xs text-linkedin-600">
                                {hashtag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Scheduled
                          </span>
                          <span className="ml-2">
                            {moment(post.scheduled_date).format('MMM DD, YYYY [at] HH:mm')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => handleUnschedulePost(post)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Unschedule
                        </button>
                        <button
                          onClick={() => handleDeletePost(post)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Draft Posts with LinkedIn Preview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Draft Posts Ready to Schedule
          </h2>
        </div>
        <div className="p-6">
          {getDraftPosts().length === 0 ? (
            <p className="text-gray-500 text-center py-8">No draft posts available for scheduling</p>
          ) : (
            <div className="space-y-6">
              {getDraftPosts().map((post) => (
                <div key={post.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Draft
                      </span>
                      <span className="ml-2">
                        {post.entity_type === 'person' ? 'Person' : 'Company'} Post
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSchedulePost(post)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Schedule
                      </button>
                    </div>
                  </div>
                  
                  {/* LinkedIn Preview */}
                  <LinkedInPostPreview 
                    post={post} 
                    userProfile={{
                      name: "Dennis V",
                      title: "Entrepreneur & Business Developer", 
                      company: "Your Company",
                      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                      timeAgo: "now"
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedPost && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Post</h3>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">LinkedIn Preview:</h4>
                <LinkedInPostPreview 
                  post={selectedPost} 
                  userProfile={{
                    name: "Dennis V",
                    title: "Entrepreneur & Business Developer", 
                    company: "Your Company",
                    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                    timeAgo: "now"
                  }}
                />
              </div>
              
              <form onSubmit={handleScheduleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.scheduled_date}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-linkedin-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.scheduled_time}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-linkedin-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => handleDeletePost(selectedPost)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Post
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
