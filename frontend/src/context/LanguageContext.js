import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  da: {
    // Navigation
    dashboard: 'Dashboard',
    profiles: 'Profiler',
    posts: 'Opslag',
    schedules: 'Tidsplaner',
    
    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Oversigt over dit LinkedIn opslag genereringssystem',
    addPerson: 'Tilføj Person',
    persons: 'Personer',
    companies: 'Virksomheder',
    activeSchedules: 'Aktive Tidsplaner',
    recentPosts: 'Seneste Opslag',
    noPostsYet: 'Ingen opslag endnu',
    getStartedText: 'Kom i gang ved at oprette en person- eller virksomhedsprofil.',
    
    // Common
    loading: 'Indlæser...',
    error: 'Fejl',
    success: 'Succes',
    save: 'Gem',
    cancel: 'Annuller',
    delete: 'Slet',
    edit: 'Rediger',
    create: 'Opret',
    update: 'Opdater',
    close: 'Luk',
    back: 'Tilbage',
    next: 'Næste',
    previous: 'Forrige',
    search: 'Søg',
    filter: 'Filtrer',
    sort: 'Sorter',
    actions: 'Handlinger',
    status: 'Status',
    name: 'Navn',
    title: 'Titel',
    company: 'Virksomhed',
    bio: 'Bio',
    industry: 'Branche',
    targetAudience: 'Målgruppe',
    expertise: 'Ekspertise',
    language: 'Sprog',
    content: 'Indhold',
    hashtags: 'Hashtags',
    date: 'Dato',
    time: 'Tid',
    frequency: 'Frekvens',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    draft: 'Kladde',
    scheduled: 'Planlagt',
    posted: 'Offentliggjort',
    failed: 'Fejlet',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    profiles: 'Profiles',
    posts: 'Posts',
    schedules: 'Schedules',
    
    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Overview of your LinkedIn post generation system',
    addPerson: 'Add Person',
    persons: 'Persons',
    companies: 'Companies',
    activeSchedules: 'Active Schedules',
    recentPosts: 'Recent Posts',
    noPostsYet: 'No posts yet',
    getStartedText: 'Get started by creating a person or company profile.',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    actions: 'Actions',
    status: 'Status',
    name: 'Name',
    title: 'Title',
    company: 'Company',
    bio: 'Bio',
    industry: 'Industry',
    targetAudience: 'Target Audience',
    expertise: 'Expertise',
    language: 'Language',
    content: 'Content',
    hashtags: 'Hashtags',
    date: 'Date',
    time: 'Time',
    frequency: 'Frequency',
    active: 'Active',
    inactive: 'Inactive',
    draft: 'Draft',
    scheduled: 'Scheduled',
    posted: 'Posted',
    failed: 'Failed',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Default to Danish
    return localStorage.getItem('language') || 'da';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
