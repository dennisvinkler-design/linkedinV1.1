import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { Calendar, Clock, Plus, Trash2, XCircle, User, Building2, Eye, Upload, Image, X } from 'lucide-react';
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
  const [persons, setPersons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: '',
    scheduled_time: '09:00'
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, personsRes, companiesRes] = await Promise.all([
        apiClient.get('/posts'),
        apiClient.get('/persons'),
        apiClient.get('/companies')
      ]);
      
      const postsData = postsRes.data.data || [];
      
      // Debug: Log scheduled posts with image info
      const scheduledWithImages = postsData.filter(p => p.status === 'scheduled');
      console.log('📅 Scheduled posts:', scheduledWithImages.map(p => ({
        id: p.id.substring(0, 8),
        content: p.content?.substring(0, 30) + '...',
        image_url: p.image_url,
        has_image: !!p.image_url
      })));
      
      const personsData = personsRes.data.data || [];
      const companiesData = companiesRes.data.data || [];
      
      setPosts(postsData);
      setPersons(personsData);
      setCompanies(companiesData);
      
      // Helper function to get entity name from local data
      const getEntityNameLocal = (entityType, entityId) => {
        if (entityType === 'person') {
          const person = personsData.find(p => p.id === entityId);
          return person ? person.name : 'Unknown Person';
        } else {
          const company = companiesData.find(c => c.id === entityId);
          return company ? company.name : 'Unknown Company';
        }
      };
      
      // Convert posts to calendar events
      const calendarEvents = postsData
        .filter(post => post.status === 'scheduled' && post.scheduled_date)
        .map(post => ({
          id: post.id,
          title: getEntityNameLocal(post.entity_type, post.entity_id),
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

  const handleSchedulePost = (post) => {
    setSelectedPost(post);
    setScheduleForm({
      scheduled_date: '',
      scheduled_time: '09:00'
    });
    setSelectedImage(null);
    setImagePreview(null);
    setShowScheduleModal(true);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!scheduleForm.scheduled_date) {
        toast.error('Please select a date');
        return;
      }

      setIsScheduling(true);
      const scheduledDateTime = new Date(`${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}`);
      
      // If image is selected, use FormData and the schedule endpoint with image support
      if (selectedImage) {
        const formData = new FormData();
        formData.append('postId', selectedPost.id);
        formData.append('scheduledDate', scheduledDateTime.toISOString());
        formData.append('image', selectedImage);

        await apiClient.post('/posts/schedule', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // No image, use simple PUT request
        await apiClient.put(`/posts/${selectedPost.id}`, {
          status: 'scheduled',
          scheduled_date: scheduledDateTime.toISOString()
        });
      }

      toast.success('Post scheduled successfully!');
      setShowScheduleModal(false);
      setSelectedPost(null);
      setSelectedImage(null);
      setImagePreview(null);
      fetchData();
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('Failed to schedule post');
    } finally {
      setIsScheduling(false);
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
      // Update UI immediately by removing the post from state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Kunne ikke slette opslag');
    }
  };

  const handleViewPost = (post) => {
    console.log('👁️ View post clicked:', {
      id: post.id.substring(0, 8),
      image_url: post.image_url,
      has_image_url: !!post.image_url,
      all_keys: Object.keys(post)
    });
    setPreviewPost(post);
    setShowPreviewModal(true);
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
                  const post = event.resource;
                  handleViewPost(post);
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
                {getScheduledPosts().map((post) => {
                  const entityName = getEntityName(post.entity_type, post.entity_id);
                  const entityProfile = getEntityProfile(post.entity_type, post.entity_id);
                  
                  return (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Entity Information */}
                          <div className="flex items-center mb-2">
                            {post.entity_type === 'person' ? (
                              <User className="h-4 w-4 mr-2 text-blue-600" />
                            ) : (
                              <Building2 className="h-4 w-4 mr-2 text-green-600" />
                            )}
                            <span className="font-medium text-gray-900">{entityName}</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
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
                        <div className="ml-4 flex flex-col space-y-2">
                          <button
                            onClick={() => handleViewPost(post)}
                            className="inline-flex items-center px-3 py-1 border border-linkedin-300 text-sm leading-4 font-medium rounded-md text-linkedin-700 bg-white hover:bg-linkedin-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
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
                  );
                })}
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
              {getDraftPosts().map((post) => {
                const entityProfile = getEntityProfile(post.entity_type, post.entity_id);
                const userProfile = {
                  name: entityProfile.name,
                  title: entityProfile.title,
                  company: entityProfile.company,
                  avatar: entityProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entityProfile.name)}&background=0077b5&color=fff&size=48`,
                  timeAgo: "now"
                };
                
                return (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Draft
                        </span>
                        <span className="ml-2 flex items-center">
                          {post.entity_type === 'person' ? (
                            <User className="h-3 w-3 mr-1" />
                          ) : (
                            <Building2 className="h-3 w-3 mr-1" />
                          )}
                          {entityProfile.name}
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
                      userProfile={userProfile}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewPost && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Post Preview</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <LinkedInPostPreview 
                  post={previewPost} 
                  userProfile={{
                    name: getEntityProfile(previewPost.entity_type, previewPost.entity_id).name,
                    title: getEntityProfile(previewPost.entity_type, previewPost.entity_id).title,
                    company: getEntityProfile(previewPost.entity_type, previewPost.entity_id).company,
                    avatar: getEntityProfile(previewPost.entity_type, previewPost.entity_id).avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getEntityProfile(previewPost.entity_type, previewPost.entity_id).name)}&background=0077b5&color=fff&size=48`,
                    timeAgo: "now"
                  }}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleSchedulePost(previewPost);
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Edit Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedPost && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Post</h3>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">LinkedIn Preview:</h4>
                <LinkedInPostPreview 
                  post={{
                    ...selectedPost,
                    image_url: imagePreview || selectedPost.image_url
                  }} 
                  userProfile={{
                    name: getEntityProfile(selectedPost.entity_type, selectedPost.entity_id).name,
                    title: getEntityProfile(selectedPost.entity_type, selectedPost.entity_id).title,
                    company: getEntityProfile(selectedPost.entity_type, selectedPost.entity_id).company,
                    avatar: getEntityProfile(selectedPost.entity_type, selectedPost.entity_id).avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getEntityProfile(selectedPost.entity_type, selectedPost.entity_id).name)}&background=0077b5&color=fff&size=48`,
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

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Image className="inline h-4 w-4 mr-1" />
                      Image (Optional)
                    </label>
                    
                    {!imagePreview ? (
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-linkedin-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="schedule-image-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-linkedin-600 hover:text-linkedin-500"
                            >
                              <span>Upload an image</span>
                              <input
                                id="schedule-image-upload"
                                name="schedule-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-auto rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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
                      disabled={isScheduling}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {isScheduling ? 'Scheduling...' : 'Schedule Post'}
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
