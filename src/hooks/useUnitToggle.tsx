
import { useState, useContext, createContext, ReactNode } from 'react';

type UnitType = 'metric' | 'imperial';

interface UnitContextType {
  unit: UnitType;
  toggleUnit: () => void;
  convertArea: (value: number) => number;
  getAreaUnit: () => string;
  formatArea: (value: number) => string;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const UnitProvider = ({ children }: { children: ReactNode }) => {
  const [unit, setUnit] = useState<UnitType>('imperial'); // Default to square feet

  const toggleUnit = () => {
    setUnit(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  const convertArea = (value: number) => {
    if (unit === 'metric') {
      // Convert from sq ft to sq meters (1 sq ft = 0.092903 sq m)
      return value * 0.092903;
    }
    return value; // Return as sq ft
  };

  const getAreaUnit = () => {
    return unit === 'metric' ? 'sq m' : 'sq ft';
  };

  const formatArea = (value: number) => {
    const converted = convertArea(value);
    return `${converted.toFixed(2)} ${getAreaUnit()}`;
  };

  return (
    <UnitContext.Provider value={{
      unit,
      toggleUnit,
      convertArea,
      getAreaUnit,
      formatArea
    }}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnitToggle = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnitToggle must be used within a UnitProvider');
  }
  return context;
};
