import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { Plus, RefreshCw, Calendar, Hash, User, Building2, Sparkles, Edit, X, Loader2 } from 'lucide-react';
import LinkedInPostPreview from '../components/LinkedInPostPreview';
import toast from 'react-hot-toast';

const Posts = () => {
  const { apiClient } = useApi();
  const [posts, setPosts] = useState([]);
  const [persons, setPersons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({
    content: '',
    hashtags: [],
    status: 'draft'
  });
  const [generateForm, setGenerateForm] = useState({
    entity_type: 'person',
    entity_id: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: '',
    scheduled_time: '09:00'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, personsRes, companiesRes] = await Promise.all([
        apiClient.get('/posts'),
        apiClient.get('/persons'),
        apiClient.get('/companies')
      ]);
      
      setPosts(postsRes.data.data || []);
      setPersons(personsRes.data.data || []);
      setCompanies(companiesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/posts');
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const generatePosts = async () => {
    try {
      if (!generateForm.entity_id) {
        toast.error('Please select a person or company');
        return;
      }

      setIsGenerating(true);
      toast.loading('Generating 3 posts with AI... This may take 1-2 minutes', { 
        id: 'posts',
        duration: 0 // Don't auto-dismiss
      });
      
      console.log('Generating posts for:', generateForm);
      const response = await apiClient.post('/posts/generate', {
        entity_type: generateForm.entity_type,
        entity_id: generateForm.entity_id,
        count: 3
      });

      console.log('Generated posts response:', response.data);
      
      // Update progress message
      toast.loading('Saving generated posts...', { 
        id: 'posts',
        duration: 0
      });
      
      // Save generated posts
      for (let i = 0; i < response.data.data.length; i++) {
        const post = response.data.data[i];
        console.log(`Saving post ${i + 1}:`, {
          entity_type: generateForm.entity_type,
          entity_id: generateForm.entity_id,
          content: post.content?.substring(0, 100) + '...',
          hashtags: post.hashtags,
          status: 'draft'
        });
        
        await apiClient.post('/posts', {
          entity_type: generateForm.entity_type,
          entity_id: generateForm.entity_id,
          content: post.content,
          hashtags: post.hashtags,
          status: 'draft'
        });
      }

      toast.success('3 posts generated successfully!', { id: 'posts' });
      setShowGenerateModal(false);
      setGenerateForm({
        entity_type: 'person',
        entity_id: ''
      });
      // Automatically refresh posts after generation
      await fetchPosts();
    } catch (error) {
      console.error('Error generating posts:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      toast.error(`Failed to generate posts: ${errorMessage}`, { id: 'posts' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditForm({
      content: post.content,
      hashtags: post.hashtags || [],
      status: post.status
    });
    setShowEditModal(true);
  };

  const handleCopyText = async (post) => {
    try {
      const textToCopy = `${post.content}\n\n${post.hashtags ? post.hashtags.join(' ') : ''}`;
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Text copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast.error('Failed to copy text');
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/posts/${post.id}`);
      toast.success('Post deleted successfully!');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleSchedulePost = (post) => {
    // Show image upload modal for scheduling
    setSelectedPost(post);
    setShowImageModal(true);
  };

  const handlePublishNow = (post) => {
    // Show image upload modal for immediate publishing
    setSelectedPost(post);
    setShowImageModal(true);
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

  const handlePublishWithImage = async () => {
    if (!selectedPost) return;

    try {
      setIsPublishing(true);
      toast.loading('Publishing post...', { id: 'publish-post' });

      const formData = new FormData();
      formData.append('postId', selectedPost.id);
      formData.append('action', 'publish');
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await apiClient.post('/posts/publish', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Post published successfully!', { id: 'publish-post' });
      setShowImageModal(false);
      setSelectedPost(null);
      setSelectedImage(null);
      setImagePreview(null);
      fetchPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Failed to publish post', { id: 'publish-post' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleScheduleWithImage = async () => {
    if (!selectedPost) return;

    // Validate schedule form
    if (!scheduleForm.scheduled_date) {
      toast.error('Vælg venligst en dato for planlægning');
      return;
    }

    try {
      setIsPublishing(true);
      toast.loading('Planlægger opslag...', { id: 'schedule-post' });

      const scheduledDateTime = new Date(`${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}`);

      const formData = new FormData();
      formData.append('postId', selectedPost.id);
      formData.append('scheduledDate', scheduledDateTime.toISOString());
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await apiClient.post('/posts/schedule', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Opslag planlagt succesfuldt!', { id: 'schedule-post' });
      setShowImageModal(false);
      setSelectedPost(null);
      setSelectedImage(null);
      setImagePreview(null);
      setScheduleForm({ scheduled_date: '', scheduled_time: '09:00' });
      fetchPosts();
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('Kunne ikke planlægge opslag', { id: 'schedule-post' });
    } finally {
      setIsPublishing(false);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedPost(null);
    setSelectedImage(null);
    setImagePreview(null);
    setScheduleForm({ scheduled_date: '', scheduled_time: '09:00' });
  };

  const handleSavePost = async () => {
    try {
      if (!editingPost) return;

      toast.loading('Saving post...', { id: 'save-post' });

      await apiClient.put(`/posts/${editingPost.id}`, {
        content: editForm.content,
        hashtags: editForm.hashtags.filter(tag => tag.trim() !== ''),
        status: editForm.status
      });

      toast.success('Post updated successfully!', { id: 'save-post' });
      setShowEditModal(false);
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post', { id: 'save-post' });
    }
  };

  const addHashtag = () => {
    setEditForm(prev => ({
      ...prev,
      hashtags: [...prev.hashtags, '']
    }));
  };

  const updateHashtag = (index, value) => {
    setEditForm(prev => ({
      ...prev,
      hashtags: prev.hashtags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const removeHashtag = (index) => {
    setEditForm(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'posted':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPosts = posts.filter(post => {
    const statusMatch = filter === 'all' || post.status === filter;
    const entityMatch = entityFilter === 'all' || post.entity_type === entityFilter;
    return statusMatch && entityMatch;
  });

  const getEntityName = (entityType, entityId) => {
    if (entityType === 'person') {
      const person = persons.find(p => p.id === entityId);
      return person ? person.name : 'Unknown Person';
    } else {
      const company = companies.find(c => c.id === entityId);
      return company ? company.name : 'Unknown Company';
    }
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
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Posts
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view generated LinkedIn posts
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linkedin-600 hover:bg-linkedin-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate Posts
          </button>
          <button
            onClick={fetchPosts}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Generate Posts Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            {isGenerating && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-md z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-linkedin-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Generating your posts...</p>
                </div>
              </div>
            )}
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate LinkedIn Posts</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type
                  </label>
                  <select
                    value={generateForm.entity_type}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, entity_type: e.target.value, entity_id: '' }))}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                  >
                    <option value="person">Person</option>
                    <option value="company">Company</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {generateForm.entity_type === 'person' ? 'Person' : 'Company'}
                  </label>
                  <select
                    value={generateForm.entity_id}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, entity_id: e.target.value }))}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                  >
                    <option value="">Select {generateForm.entity_type === 'person' ? 'Person' : 'Company'}</option>
                    {(generateForm.entity_type === 'person' ? persons : companies).map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Generation
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <p className="font-medium">3 Different Post Styles</p>
                    <p className="text-xs mt-1">We'll generate 3 high-quality posts with different approaches so you can choose your favorite.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePosts}
                  disabled={isGenerating}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    isGenerating 
                      ? 'bg-linkedin-400 cursor-not-allowed' 
                      : 'bg-linkedin-600 hover:bg-linkedin-700'
                  }`}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Posts'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Post</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPost(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="posted">Posted</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  rows={8}
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                  placeholder="Enter post content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashtags
                </label>
                <div className="space-y-2">
                  {editForm.hashtags.map((hashtag, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={hashtag}
                        onChange={(e) => updateHashtag(index, e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                        placeholder="Enter hashtag (without #)"
                      />
                      <button
                        type="button"
                        onClick={() => removeHashtag(index)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addHashtag}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Hashtag
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPost(null);
                }}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePost}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedPost?.status === 'draft' ? 'Publish or Schedule Post' : 'Schedule Post'}
              </h3>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Image (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-linkedin-600 hover:text-linkedin-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-linkedin-500"
                      >
                        <span>Upload an image</span>
                        <input
                          id="image-upload"
                          name="image-upload"
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
                
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded-md border"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-500"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              <div>
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

              {/* Schedule Date/Time Selection */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Planlæg opslag:</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dato
                    </label>
                    <input
                      type="date"
                      value={scheduleForm.scheduled_date}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-linkedin-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tidspunkt
                    </label>
                    <input
                      type="time"
                      value={scheduleForm.scheduled_time}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-linkedin-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeImageModal}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {selectedPost?.status === 'draft' && (
                <button
                  onClick={handlePublishWithImage}
                  disabled={isPublishing}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    isPublishing 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                  {isPublishing ? 'Publishing...' : 'Publish Now'}
                </button>
              )}
              <button
                onClick={handleScheduleWithImage}
                disabled={isPublishing}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  isPublishing 
                    ? 'bg-linkedin-400 cursor-not-allowed' 
                    : 'bg-linkedin-600 hover:bg-linkedin-700'
                }`}
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                {isPublishing ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="posted">Posted</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="person">Person</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredPosts.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <p className="text-lg">No posts found</p>
                <p className="text-sm">
                  {posts.length === 0 
                    ? 'Generate posts by creating profiles first.'
                    : 'No posts match your current filters.'
                  }
                </p>
                {posts.length === 0 && (
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-linkedin-600 hover:bg-linkedin-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Your First Posts
                  </button>
                )}
              </div>
            </li>
          ) : (
            filteredPosts.map((post) => (
              <li key={post.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* LinkedIn Preview - Left Column */}
                    <div className="lg:col-span-2">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-linkedin-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-semibold">
                              {getEntityName(post.entity_type, post.entity_id).charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900">
                              {getEntityName(post.entity_type, post.entity_id)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {post.entity_type === 'person' ? 'Professional' : 'Company Page'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-900 mb-3 whitespace-pre-line leading-relaxed">
                          {post.content}
                        </div>
                        
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {post.hashtags.map((hashtag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-linkedin-50 text-linkedin-700">
                                <Hash className="h-3 w-3 mr-1" />
                                {hashtag.replace('#', '')}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <span>Like</span>
                          <span>Comment</span>
                          <span>Share</span>
                        </div>
                      </div>
                    </div>

                    {/* Post Details - Right Column */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                              {post.entity_type === 'person' ? (
                                <>
                                  <User className="h-3 w-3 mr-1" />
                                  Person
                                </>
                              ) : (
                                <>
                                  <Building2 className="h-3 w-3 mr-1" />
                                  Company
                                </>
                              )}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                              {getEntityName(post.entity_type, post.entity_id)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                              {post.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Created: {formatDate(post.created_at)}
                            </div>
                            {post.scheduled_date && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Scheduled: {formatDate(post.scheduled_date)}
                              </div>
                            )}
                            {post.posted_date && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Posted: {formatDate(post.posted_date)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 flex flex-col space-y-2">
                          {post.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handlePublishNow(post)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Publish Now
                              </button>
                              <button
                                onClick={() => handleSchedulePost(post)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700"
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Schedule
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleCopyText(post)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Text
                          </button>
                          <button
                            onClick={() => handleEditPost(post)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(post)}
                            className="inline-flex items-center px-3 py-1 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default Posts;
