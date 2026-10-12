
import React, { useState, useEffect } from 'react';
import { DashboardSection, Category, Opportunity, AnalysisResult } from '../types';
import { findBestOpportunityMatch } from '../constants';

interface HierarchyTreeProps {
  sections: DashboardSection[];
  onItemClick: (opp: Opportunity, categoryName: string) => void;
  analysisResult?: AnalysisResult | null;
  selectedOpportunity?: { opp: Opportunity, category: string } | null;
}

const TreeRow: React.FC<{
  level: number;
  label: string;
  icon: string;
  count?: string;
  isExpanded?: boolean;
  hasChildren?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  isBold?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
}> = ({ level, label, icon, count, isExpanded, hasChildren, onToggle, onClick, isBold, isSelected, isDisabled }) => {
  return (
    <div 
      className={`tree-row relative group ${isBold ? 'font-semibold' : 'font-normal'} ${isSelected ? 'bg-primary/10 text-primary' : ''} ${isDisabled ? 'opacity-30 pointer-events-none grayscale' : 'cursor-pointer'}`}
      style={{ paddingLeft: `${level * 16}px` }}
      onClick={isDisabled ? undefined : (hasChildren ? onToggle : onClick)}
    >
      <div className="flex items-center gap-2 w-full">
        {hasChildren ? (
          <span className={`material-icons-round text-[16px] text-slate-400 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
            expand_more
          </span>
        ) : (
          <span className="w-[16px]"></span>
        )}
        <span className={`material-icons-round text-[18px] ${hasChildren ? 'text-amber-500' : 'text-primary/70'}`}>
          {icon}
        </span>
        <span className={`text-[13px] truncate flex-1 ${isSelected ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
          {label}
          {count && <span className="ml-1 text-[11px] text-slate-700 dark:text-slate-200 font-black">({count})</span>}
        </span>
      </div>
    </div>
  );
};

const HierarchyTree: React.FC<HierarchyTreeProps> = ({ sections = [], onItemClick, analysisResult, selectedOpportunity }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => 
    Object.fromEntries(sections?.map(s => [s.id, true]) || [])
  );
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  // Auto-expand and select based on selectedOpportunity or analysisResult
  useEffect(() => {
    if (selectedOpportunity) {
      const { opp, category: categoryName } = selectedOpportunity;
      setActiveId(opp.id);
      
      const section = sections.find(s => 
        s.categories.some(c => c.name === categoryName && c.opportunities.some(o => o.id === opp.id))
      );
      if (section) {
        setExpandedSections(prev => ({ ...prev, [section.id]: true }));
        const category = section.categories.find(c => c.name === categoryName);
        if (category) {
          setExpandedCategories(prev => ({ ...prev, [category.id]: true }));
        }
      }
    } else if (analysisResult) {
      const { l1, l2, l3 } = analysisResult.process_classification;
      
      const section = sections.find(s => s.title.toLowerCase().includes(l1.toLowerCase()) || l1.toLowerCase().includes(s.title.toLowerCase()));
      if (section) {
        setExpandedSections(prev => ({ ...prev, [section.id]: true }));
        
        const category = section.categories.find(c => c.name.toLowerCase().includes(l2.toLowerCase()) || l2.toLowerCase().includes(c.name.toLowerCase()));
        if (category) {
          setExpandedCategories(prev => ({ ...prev, [category.id]: true }));
          
          const opportunity = findBestOpportunityMatch(l3, category.opportunities) || category.opportunities[0];
          if (opportunity) {
            setActiveId(opportunity.id);
          }
        }
      }
    } else {
      setActiveId(null);
    }
  }, [selectedOpportunity, analysisResult, sections]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleItemSelect = (opp: Opportunity, catName: string) => {
    setActiveId(opp.id);
    onItemClick(opp, catName);
  };

  const isItemDisabled = (sectionTitle: string, categoryName?: string, oppName?: string) => {
    if (!analysisResult) return false;
    
    // If this is the selected opportunity, or if it contains the selected opportunity, do NOT disable it!
    if (selectedOpportunity) {
      if (oppName && selectedOpportunity.opp.name === oppName) {
        return false;
      }
      if (!categoryName && !oppName) {
        const containsSelected = sections.some(s => 
          s.title === sectionTitle && 
          s.categories.some(c => c.name === selectedOpportunity.category)
        );
        if (containsSelected) return false;
      }
      if (categoryName && !oppName) {
        if (categoryName === selectedOpportunity.category) return false;
      }
    }

    const { l1, l2, l3 } = analysisResult.process_classification;
    
    // If it's a section
    if (!categoryName && !oppName) {
      return !(sectionTitle.toLowerCase().includes(l1.toLowerCase()) || l1.toLowerCase().includes(sectionTitle.toLowerCase()));
    }
    
    // If it's a category
    if (categoryName && !oppName) {
      const sectionMatch = sectionTitle.toLowerCase().includes(l1.toLowerCase()) || l1.toLowerCase().includes(sectionTitle.toLowerCase());
      const categoryMatch = categoryName.toLowerCase().includes(l2.toLowerCase()) || l2.toLowerCase().includes(categoryName.toLowerCase());
      return !(sectionMatch && categoryMatch);
    }
    
    // If it's an opportunity
    if (oppName) {
      const sectionMatch = sectionTitle.toLowerCase().includes(l1.toLowerCase()) || l1.toLowerCase().includes(sectionTitle.toLowerCase());
      const categoryMatch = categoryName?.toLowerCase().includes(l2.toLowerCase()) || l2.toLowerCase().includes(categoryName?.toLowerCase() || '');
      
      const section = sections.find(s => s.title === sectionTitle);
      const category = section?.categories.find(c => c.name === categoryName);
      if (category) {
        const matchedOpp = findBestOpportunityMatch(l3, category.opportunities) || category.opportunities[0];
        if (matchedOpp) {
          const oppMatch = oppName === matchedOpp.name;
          return !(sectionMatch && categoryMatch && oppMatch);
        }
      }
      return true;
    }
    
    return false;
  };

  return (
    <div className="space-y-0.5">
      {sections?.map(section => (
        <div key={section.id} className="relative">
          <TreeRow 
            level={0}
            label={section.title}
            icon={expandedSections[section.id] ? "folder_open" : "folder"}
            count={section.count.toString()}
            hasChildren
            isExpanded={expandedSections[section.id]}
            onToggle={() => toggleSection(section.id)}
            isBold
            isDisabled={isItemDisabled(section.title)}
          />
          
          {expandedSections[section.id] && (
            <div className="relative">
              <div className="tree-guide ml-[7px]"></div>
              {section.categories?.map(category => (
                <div key={category.id}>
                  <TreeRow 
                    level={1}
                    label={category.name}
                    icon={expandedCategories[category.id] ? "folder_open" : "folder"}
                    count={category.count.toString()}
                    hasChildren
                    isExpanded={expandedCategories[category.id]}
                    onToggle={() => toggleCategory(category.id)}
                    isDisabled={isItemDisabled(section.title, category.name)}
                  />

                  {expandedCategories[category.id] && (
                    <div className="relative">
                      <div className="tree-guide ml-[23px]"></div>
                      {category.opportunities?.map(opp => (
                        <TreeRow 
                          key={opp.id}
                          level={2}
                          label={opp.name}
                          icon="description"
                          isSelected={activeId === opp.id}
                          onClick={() => handleItemSelect(opp, category.name)}
                          isDisabled={isItemDisabled(section.title, category.name, opp.name)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HierarchyTree;
