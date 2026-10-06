import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const NotificationFilters = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  priority,
  onPriorityChange,
  sort,
  onSortChange,
  status,
  onStatusChange,
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const filterTabs = [
    { id: 'all', label: isTa ? 'அனைத்தும்' : 'All' },
    { id: 'unread', label: isTa ? 'படிக்காதவை' : 'Unread' },
    { id: 'read', label: isTa ? 'படித்தவை' : 'Read' },
    { id: 'application', label: isTa ? 'விண்ணப்பங்கள்' : 'Applications' },
    { id: 'new_job', label: isTa ? 'அரசுப் பணிகள்' : 'Jobs' },
    { id: 'study_material', label: isTa ? 'படிப்பு வளங்கள்' : 'Study Materials' },
    { id: 'syllabus', label: isTa ? 'பாடத்திட்டம்' : 'Syllabus' },
    { id: 'deadline', label: isTa ? 'காலக்கெடு அறிவிப்புகள்' : 'Deadline Alerts' },
    { id: 'announcement', label: isTa ? 'பொது அறிவிப்புகள்' : 'Announcements' },
  ];

  return (
    <div className="gov-notification-filters-container">
      {/* Category Filter Tabs */}
      <div className="notification-tabs-scroll">
        <div className="notification-tabs" role="tablist">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`notification-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: Search + Priority + Status + Sort */}
      <div className="notification-controls-bar">
        {/* Search Input */}
        <div className="notification-search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={isTa ? 'அறிவிப்பு தலைப்பு அல்லது செய்தியைத் தேடுக...' : 'Search notification title or message...'}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="notification-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
              title={isTa ? 'தேடலை அழிக்கவும்' : 'Clear search'}
            >
              &times;
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="notification-select-controls">
          {/* Priority filter */}
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="gov-select-control"
            aria-label={isTa ? 'முன்னுரிமை வடிப்பான்' : 'Filter by Priority'}
          >
            <option value="">{isTa ? 'அனைத்து முன்னுரிமைகளும்' : 'All Priorities'}</option>
            <option value="urgent">{isTa ? 'அவசரம்' : 'Urgent'}</option>
            <option value="high">{isTa ? 'உயர் முன்னுரிமை' : 'High Priority'}</option>
            <option value="normal">{isTa ? 'இயல்பான முன்னுரிமை' : 'Normal Priority'}</option>
            <option value="low">{isTa ? 'குறைந்த முன்னுரிமை' : 'Low Priority'}</option>
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="gov-select-control"
            aria-label={isTa ? 'நிலை வடிப்பான்' : 'Filter by Status'}
          >
            <option value="active">{isTa ? 'செயலில் உள்ளவை' : 'Active'}</option>
            <option value="archived">{isTa ? 'காப்பகப்படுத்தப்பட்டவை' : 'Archived'}</option>
            <option value="all">{isTa ? 'அனைத்து நிலைகளும்' : 'All Statuses'}</option>
          </select>

          {/* Sort order */}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="gov-select-control"
            aria-label={isTa ? 'வரிசைப்படுத்து' : 'Sort By'}
          >
            <option value="latest">{isTa ? 'புதியவை முதலில்' : 'Latest First'}</option>
            <option value="oldest">{isTa ? 'பழையவை முதலில்' : 'Oldest First'}</option>
            <option value="priority_high">{isTa ? 'உயர் முன்னுரிமை முதலில்' : 'High Priority First'}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default NotificationFilters;
