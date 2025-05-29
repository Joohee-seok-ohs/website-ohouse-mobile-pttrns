import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';
import { BiSolidDownArrow } from 'react-icons/bi';

interface FilterBarProps {
  total: number;
  tags: { screenType: string[]; uiComponents: string[] };
  selectedScreenTypes: string[];
  selectedUIComponents: string[];
  onChangeScreenTypes: (v: string[]) => void;
  onChangeUIComponents: (v: string[]) => void;
}

const FilterBar = ({
  total,
  tags,
  selectedScreenTypes,
  selectedUIComponents,
  onChangeScreenTypes,
  onChangeUIComponents,
}: FilterBarProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 드롭다운 토글
  const handleDropdownToggle = (type: string) => {
    setOpenDropdown(prev => (prev === type ? null : type));
  };

  // 필터 선택/해제
  const handleCheckboxChange = (type: 'screen' | 'ui', value: string) => {
    if (type === 'screen') {
      onChangeScreenTypes(
        selectedScreenTypes.includes(value)
          ? selectedScreenTypes.filter(v => v !== value)
          : [...selectedScreenTypes, value]
      );
    } else {
      onChangeUIComponents(
        selectedUIComponents.includes(value)
          ? selectedUIComponents.filter(v => v !== value)
          : [...selectedUIComponents, value]
      );
    }
  };

  // 초기화 버튼
  const handleClear = (type: 'screen' | 'ui') => {
    if (type === 'screen') onChangeScreenTypes([]);
    else onChangeUIComponents([]);
  };

  return (
    <FilterBarContainer ref={wrapperRef}>
      <div
        className="filter-bar"
        onClick={openDropdown ? () => setOpenDropdown(null) : undefined}
        style={{ cursor: openDropdown ? 'pointer' : undefined }}
      >
        <div className="filter-left-area">
          {/* Screen Type Dropdown */}
          <div className={`dropdown${openDropdown === 'screen' ? ' open' : ''}${selectedScreenTypes.length > 0 ? ' selected' : ''}`}>
            <button
              className="dropdown-button"
              onClick={() => handleDropdownToggle('screen')}
            >
              Screen{selectedScreenTypes.length > 0 && ` (${selectedScreenTypes.length})`}
              {selectedScreenTypes.length > 0 ? (
                <span
                  className="clear-btn"
                  onClick={e => { e.stopPropagation(); handleClear('screen'); }}
                  style={{ marginLeft: 8, cursor: 'pointer' }}
                >✕</span>
              ) : (
                <span className="dropdown-arrow">
                  <BiSolidDownArrow size={10} />
                </span>
              )}
            </button>
            {openDropdown === 'screen' && (
              <div className="dropdown-list" onClick={e => e.stopPropagation()}>
                <div className="dropdown-list-inner">
                  {tags.screenType.map(type => (
                    <DropdownLabel key={type}>
                      <CustomCheckbox
                        type="checkbox"
                        checked={selectedScreenTypes.includes(type)}
                        onChange={() => handleCheckboxChange('screen', type)}
                      />
                      <span className="checkbox__label">{type}</span>
                    </DropdownLabel>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* UI Components Dropdown */}
          <div className={`dropdown${openDropdown === 'ui' ? ' open' : ''}${selectedUIComponents.length > 0 ? ' selected' : ''}`}>
            <button
              className="dropdown-button"
              onClick={() => handleDropdownToggle('ui')}
            >
              UI Components{selectedUIComponents.length > 0 && ` (${selectedUIComponents.length})`}
              {selectedUIComponents.length > 0 ? (
                <span
                  className="clear-btn"
                  onClick={e => { e.stopPropagation(); handleClear('ui'); }}
                  style={{ marginLeft: 8, cursor: 'pointer' }}
                >✕</span>
              ) : (
                <span className="dropdown-arrow">
                  <BiSolidDownArrow size={10} />
                </span>
              )}
            </button>
            {openDropdown === 'ui' && (
              <div className="dropdown-list" onClick={e => e.stopPropagation()}>
                <div className="dropdown-list-inner">
                  {tags.uiComponents.map(type => (
                    <DropdownLabel key={type}>
                      <CustomCheckbox
                        type="checkbox"
                        checked={selectedUIComponents.includes(type)}
                        onChange={() => handleCheckboxChange('ui', type)}
                      />
                      <span className="checkbox__label">{type}</span>
                    </DropdownLabel>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="filter-right-area">
          <span className="status-text">{total} screens</span>
        </div>
      </div>
    </FilterBarContainer>
  );
};

const FilterBarContainer = styled.div`
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  padding: 0 40px;
  border-bottom: 0;

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
  }

  .filter-left-area {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dropdown {
    position: relative;
  }
  .dropdown-button {
    font-size: 16px;
    padding: 12px 16px;
    border: 1px solid #ccc;
    border-radius: 25rem;
    background: #fff;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    max-height: 40px;
    transition: background 0.2s;
    justify-content: center;
    box-sizing: border-box;
    margin-right: 0;
  }
  .dropdown-button:hover {
    background: #eee;
  }
  .dropdown-arrow {
    margin-left: 6px;
    font-size: 13px;
  }
  .dropdown-list {
    position: absolute;
    top: 48px;
    left: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 16px;
    box-shadow: 0px 16px 32px -4px rgba(12, 12, 13, 0.10);
    z-index: 10;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    width: 250px;
    min-width: 220px;
    overflow: hidden;
  }
  .dropdown-list-inner {
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0;
    max-height: 400px;
  }
  .filter-right-area {
    font-size: 14px;
    color: #888;
    white-space: nowrap;
    display: flex;
    align-items: center;
    font-weight: 500;
    padding-left: 16px;
  }
  .status-text {
    font-size: 14px;
    color: #888;
    font-weight: 500;
  }
  .dropdown.selected .dropdown-button {
    background-color: #222;
    border-color: #222;
    color: #fff;
  }
`;

// 커스텀 체크박스와 label 스타일
const DropdownLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
  &:hover {
    background: #f7f7f7;
  }
`;

const CustomCheckbox = styled.input`
  appearance: none;
  width: 20px;
  height: 20px;
  border: 1.5px solid #ddd;
  border-radius: 6px;
  background: #fff;
  margin: 0 8px 0 0;
  position: relative;
  cursor: pointer;
  transition: border 0.15s, box-shadow 0.15s;
  flex-shrink: 0;
  &:checked {
    background: #222;
    border-color: #222;
  }
  &:checked:after {
    content: '';
    display: block;
    position: absolute;
    left: 5px;
    top: 1.5px;
    width: 5px;
    height: 9px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    border-radius: 1px;
    transform: rotate(45deg);
  }
`;

export default FilterBar; 