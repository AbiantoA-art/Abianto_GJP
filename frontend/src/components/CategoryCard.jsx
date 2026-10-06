import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const CategoryCard = ({ category }) => {
  const { tCategory, isTamil } = useLanguage();
  if (!category) return null;

  const displayCategoryName = tCategory(category.name);

  return (
    <Link
      to={`/jobs?cat=${encodeURIComponent(category.name)}`}
      className="gov-category-card"
      title={`${displayCategoryName} ${isTamil ? 'அரசுப் பணிகள்' : 'Government Jobs'}`}
    >
      <div className="category-icon-box">
        <span className="category-emoji" role="img" aria-label={displayCategoryName}>
          {category.icon}
        </span>
      </div>
      <div className="category-info-box">
        <h4 className="category-card-title">{displayCategoryName}</h4>
        <span className="category-vacancies-count">
          {category.count}+ {isTamil ? 'காலிப்பணியிடங்கள்' : 'Vacancies'}
        </span>
      </div>
      <svg className="category-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
};

export default CategoryCard;
