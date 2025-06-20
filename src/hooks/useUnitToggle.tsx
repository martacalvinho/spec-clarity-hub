
import { useState, useEffect } from 'react';

export type UnitType = 'sqft' | 'sqm';

export const useUnitToggle = () => {
  const [unit, setUnit] = useState<UnitType>('sqft');

  // Load saved preference from localStorage
  useEffect(() => {
    const savedUnit = localStorage.getItem('preferred-unit') as UnitType;
    if (savedUnit && (savedUnit === 'sqft' || savedUnit === 'sqm')) {
      setUnit(savedUnit);
    }
  }, []);

  const toggleUnit = () => {
    const newUnit: UnitType = unit === 'sqft' ? 'sqm' : 'sqft';
    setUnit(newUnit);
    localStorage.setItem('preferred-unit', newUnit);
  };

  const convertArea = (area: number, fromUnit: UnitType = 'sqft'): number => {
    if (unit === fromUnit) return area;
    
    // Convert between sqft and sqm
    if (fromUnit === 'sqft' && unit === 'sqm') {
      return area * 0.092903; // sqft to sqm
    } else if (fromUnit === 'sqm' && unit === 'sqft') {
      return area * 10.7639; // sqm to sqft
    }
    
    return area;
  };

  const formatArea = (area: number, fromUnit: UnitType = 'sqft'): string => {
    const converted = convertArea(area, fromUnit);
    return `${converted.toFixed(2)} ${unit}`;
  };

  const formatPrice = (price: number, fromUnit: UnitType = 'sqft'): string => {
    const converted = fromUnit === unit ? price : 
      (fromUnit === 'sqft' && unit === 'sqm') ? price / 0.092903 :
      (fromUnit === 'sqm' && unit === 'sqft') ? price * 0.092903 : price;
    
    return `$${converted.toFixed(2)}/${unit}`;
  };

  return {
    unit,
    toggleUnit,
    convertArea,
    formatArea,
    formatPrice
  };
};
