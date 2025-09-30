import React, { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import { Plus, Edit, Trash2, FileText, X, Users, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profiles = () => {
  const { apiClient } = useApi();
  const [persons, setPersons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [entityType, setEntityType] = useState('person');

  // Person form data
  const [personFormData, setPersonFormData] = useState({
    name: '',
    title: '',
    company: '',
    bio: '',
    linkedin_url: '',
    industry: '',
    target_audience: '',
    key_expertise: [],
    personal_branding_notes: '',
    language: 'da'
  });

  // Company form data
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    industry: '',
    company_size: '',
    mission_statement: '',
    linkedin_url: '',
    target_audience: '',
    key_products_services: [],
    company_culture_notes: '',
    language: 'da'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [personsResponse, companiesResponse] = await Promise.all([
        apiClient.get('/persons'),
        apiClient.get('/companies')
      ]);
      setPersons(personsResponse.data.data || []);
      setCompanies(companiesResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (entityType === 'person') {
        const personData = {
          ...personFormData,
          key_expertise: personFormData.key_expertise.filter(item => item.trim() !== '')
        };

        if (editingEntity) {
          await apiClient.put(`/persons/${editingEntity.id}`, personData);
          toast.success('Person updated successfully');
        } else {
          await apiClient.post('/persons', personData);
          toast.success('Person created successfully');
        }
      } else {
        const companyData = {
          ...companyFormData,
          key_products_services: companyFormData.key_products_services.filter(item => item.trim() !== '')
        };

        if (editingEntity) {
          await apiClient.put(`/companies/${editingEntity.id}`, companyData);
          toast.success('Company updated successfully');
        } else {
          await apiClient.post('/companies', companyData);
          toast.success('Company created successfully');
        }
      }

      setShowForm(false);
      setEditingEntity(null);
      resetForms();
      fetchData();
    } catch (error) {
      console.error('Error saving entity:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/${type}s/${id}`);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
      fetchData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleEdit = (entity, type) => {
    setEditingEntity(entity);
    setEntityType(type);
    
    if (type === 'person') {
      setPersonFormData({
        name: entity.name || '',
        title: entity.title || '',
        company: entity.company || '',
        bio: entity.bio || '',
        linkedin_url: entity.linkedin_url || '',
        industry: entity.industry || '',
        target_audience: entity.target_audience || '',
        key_expertise: entity.key_expertise || [],
        personal_branding_notes: entity.personal_branding_notes || '',
        language: entity.language || 'da'
      });
    } else {
      setCompanyFormData({
        name: entity.name || '',
        industry: entity.industry || '',
        company_size: entity.company_size || '',
        mission_statement: entity.mission_statement || '',
        linkedin_url: entity.linkedin_url || '',
        target_audience: entity.target_audience || '',
        key_products_services: entity.key_products_services || [],
        company_culture_notes: entity.company_culture_notes || '',
        language: entity.language || 'da'
      });
    }
    setShowForm(true);
  };

  const resetForms = () => {
    setPersonFormData({
      name: '',
      title: '',
      company: '',
      bio: '',
      linkedin_url: '',
      industry: '',
      target_audience: '',
      key_expertise: [],
      personal_branding_notes: '',
      language: 'da'
    });
    setCompanyFormData({
      name: '',
      industry: '',
      company_size: '',
      mission_statement: '',
      linkedin_url: '',
      target_audience: '',
      key_products_services: [],
      company_culture_notes: '',
      language: 'da'
    });
  };

  const addNewEntity = (type) => {
    setEntityType(type);
    setEditingEntity(null);
    resetForms();
    setShowForm(true);
  };

  // Helper functions for dynamic arrays
  const addExpertiseField = () => {
    setPersonFormData(prev => ({
      ...prev,
      key_expertise: [...prev.key_expertise, '']
    }));
  };

  const updateExpertise = (index, value) => {
    setPersonFormData(prev => ({
      ...prev,
      key_expertise: prev.key_expertise.map((item, i) => i === index ? value : item)
    }));
  };

  const removeExpertise = (index) => {
    setPersonFormData(prev => ({
      ...prev,
      key_expertise: prev.key_expertise.filter((_, i) => i !== index)
    }));
  };

  const addProductServiceField = () => {
    setCompanyFormData(prev => ({
      ...prev,
      key_products_services: [...prev.key_products_services, '']
    }));
  };

  const updateProductService = (index, value) => {
    setCompanyFormData(prev => ({
      ...prev,
      key_products_services: prev.key_products_services.map((item, i) => i === index ? value : item)
    }));
  };

  const removeProductService = (index) => {
    setCompanyFormData(prev => ({
      ...prev,
      key_products_services: prev.key_products_services.filter((_, i) => i !== index)
    }));
  };


  const generatePosts = async (entityType, entityId) => {
    try {
      toast.loading('Generating posts...', { id: 'posts' });
      
      const response = await apiClient.post('/posts/generate', {
        entity_type: entityType,
        entity_id: entityId,
        requirements: ''
      });

      for (const post of response.data.data) {
        await apiClient.post('/posts', {
          entity_type: entityType,
          entity_id: entityId,
          content: post.content,
          hashtags: post.hashtags,
          post_type: post.post_type,
          status: 'draft'
        });
      }

      toast.success('3 posts generated successfully!', { id: 'posts' });
    } catch (error) {
      console.error('Error generating posts:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      toast.error(`Failed to generate posts: ${errorMessage}`, { id: 'posts' });
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
            Profiles
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage person and company profiles for LinkedIn post generation
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Persons Column */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-linkedin-600" />
                Persons
              </h3>
              <button
                onClick={() => addNewEntity('person')}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Person
              </button>
            </div>
            
            <div className="space-y-3">
              {persons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No persons yet</p>
                  <p className="text-sm">Add your first person profile</p>
                </div>
              ) : (
                persons.map((person) => (
                  <div key={person.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-linkedin-100 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-linkedin-800">
                              {person.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{person.name}</h4>
                            <p className="text-xs text-gray-500">
                              {person.title} {person.company && `at ${person.company}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => generatePosts('person', person.id)}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Generate Posts"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(person, 'person')}
                          className="p-1 text-gray-600 hover:text-gray-700"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id, 'person')}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Companies Column */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-green-600" />
                Companies
              </h3>
              <button
                onClick={() => addNewEntity('company')}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Company
              </button>
            </div>
            
            <div className="space-y-3">
              {companies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No companies yet</p>
                  <p className="text-sm">Add your first company profile</p>
                </div>
              ) : (
                companies.map((company) => (
                  <div key={company.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-green-800">
                              {company.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{company.name}</h4>
                            <p className="text-xs text-gray-500">
                              {company.industry} {company.company_size && `• ${company.company_size} employees`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => generatePosts('company', company.id)}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Generate Posts"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(company, 'company')}
                          className="p-1 text-gray-600 hover:text-gray-700"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id, 'company')}
                          className="p-1 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingEntity ? `Edit ${entityType === 'person' ? 'Person' : 'Company'}` : `Add New ${entityType === 'person' ? 'Person' : 'Company'}`}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEntity(null);
                  resetForms();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {entityType === 'person' ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input
                        type="text"
                        required
                        value={personFormData.name}
                        onChange={(e) => setPersonFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={personFormData.title}
                        onChange={(e) => setPersonFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <input
                        type="text"
                        value={personFormData.company}
                        onChange={(e) => setPersonFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Industry</label>
                      <input
                        type="text"
                        value={personFormData.industry}
                        onChange={(e) => setPersonFormData(prev => ({ ...prev, industry: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Language</label>
                      <select
                        value={personFormData.language}
                        onChange={(e) => setPersonFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      >
                        <option value="da">Danish (Dansk)</option>
                        <option value="en">English</option>
                        <option value="no">Norwegian (Norsk)</option>
                        <option value="sv">Swedish (Svenska)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                    <input
                      type="url"
                      value={personFormData.linkedin_url}
                      onChange={(e) => setPersonFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      rows={3}
                      value={personFormData.bio}
                      onChange={(e) => setPersonFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                    <textarea
                      rows={2}
                      value={personFormData.target_audience}
                      onChange={(e) => setPersonFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Key Expertise</label>
                    <div className="mt-1 space-y-2">
                      {personFormData.key_expertise.map((expertise, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={expertise}
                            onChange={(e) => updateExpertise(index, e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                            placeholder="Enter expertise area"
                          />
                          <button
                            type="button"
                            onClick={() => removeExpertise(index)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addExpertiseField}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Expertise
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Personal Branding Notes</label>
                    <textarea
                      rows={3}
                      value={personFormData.personal_branding_notes}
                      onChange={(e) => setPersonFormData(prev => ({ ...prev, personal_branding_notes: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={companyFormData.name}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Industry</label>
                      <input
                        type="text"
                        value={companyFormData.industry}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, industry: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Size</label>
                      <select
                        value={companyFormData.company_size}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, company_size: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      >
                        <option value="">Select size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Language</label>
                      <select
                        value={companyFormData.language}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                      >
                        <option value="da">Danish (Dansk)</option>
                        <option value="en">English</option>
                        <option value="no">Norwegian (Norsk)</option>
                        <option value="sv">Swedish (Svenska)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                    <input
                      type="url"
                      value={companyFormData.linkedin_url}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mission Statement</label>
                    <textarea
                      rows={3}
                      value={companyFormData.mission_statement}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, mission_statement: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                    <textarea
                      rows={2}
                      value={companyFormData.target_audience}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Key Products/Services</label>
                    <div className="mt-1 space-y-2">
                      {companyFormData.key_products_services.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateProductService(index, e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                            placeholder="Enter product or service"
                          />
                          <button
                            type="button"
                            onClick={() => removeProductService(index)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addProductServiceField}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Product/Service
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Culture Notes</label>
                    <textarea
                      rows={3}
                      value={companyFormData.company_culture_notes}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, company_culture_notes: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-linkedin-500 focus:border-linkedin-500 sm:text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntity(null);
                    resetForms();
                  }}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-linkedin-600 hover:bg-linkedin-700"
                >
                  {editingEntity ? 'Update' : 'Create'} {entityType === 'person' ? 'Person' : 'Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profiles;
