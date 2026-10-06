import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const JobStatsCards = ({ stats, selectedStatus, onSelectStatus }) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  const cards = [
    {
      key: '',
      title: isTa ? 'மொத்த பணிகள்' : 'Total Jobs',
      value: stats?.total || 0,
      foot: isTa ? 'அனைத்து காலிப்பணியிடங்கள்' : 'All vacancies',
      boxClass: 'blue-box',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      key: 'draft',
      title: isTa ? 'வரைவு' : 'Draft',
      value: stats?.draft || 0,
      foot: isTa ? 'தயாரிப்பில் உள்ளவை' : 'In preparation',
      boxClass: 'gold-box',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    {
      key: 'published',
      title: isTa ? 'வெளியிடப்பட்டது' : 'Published',
      value: stats?.published || 0,
      foot: isTa ? 'பொது பார்வைக்கு உள்ளவை' : 'Live & public',
      boxClass: 'green-box',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 14 14" />
        </svg>
      ),
    },
    {
      key: 'closed',
      title: isTa ? 'முடிவடைந்தது' : 'Closed',
      value: stats?.closed || 0,
      foot: isTa ? 'விண்ணப்பங்கள் முடிவடைந்தவை' : 'Applications closed',
      boxClass: 'orange-box',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      key: 'expired',
      title: isTa ? 'காலாவதியானது' : 'Expired',
      value: stats?.expired || 0,
      foot: isTa ? 'காலக்கெடு முடிந்தவை' : 'Deadline passed',
      boxClass: 'gray-box',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      key: 'archived',
      title: isTa ? 'காப்பகப்படுத்தப்பட்டது' : 'Archived',
      value: stats?.archived || 0,
      foot: isTa ? 'காப்பகத்தில் உள்ளவை' : 'Stored in archives',
      boxClass: 'cyan-box',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-metrics-grid">
      {cards.map((card) => {
        const isSelected = selectedStatus === card.key;
        return (
          <button
            key={card.key || 'all'}
            type="button"
            onClick={() => onSelectStatus(card.key)}
            className={`gov-card admin-metric-card stat-clickable-card ${
              isSelected ? 'stat-card-active' : ''
            }`}
            title={isTa ? `${card.title} அடிப்படையில் வடிகட்டுக` : `Filter by ${card.title}`}
          >
            <div className="admin-metric-header">
              <span className="metric-title">{card.title}</span>
              <span className={`metric-icon-box ${card.boxClass}`}>
                {card.icon}
              </span>
            </div>
            <span className="admin-metric-value">{card.value}</span>
            <span className="admin-metric-foot">{card.foot}</span>
          </button>
        );
      })}
    </div>
  );
};

export default JobStatsCards;
