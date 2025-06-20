
import { Toggle } from '@/components/ui/toggle';
import { useUnitToggle } from '@/hooks/useUnitToggle';

interface UnitToggleProps {
  className?: string;
}

const UnitToggle = ({ className }: UnitToggleProps) => {
  const { unit, toggleUnit } = useUnitToggle();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">ft²</span>
      <Toggle
        pressed={unit === 'sqm'}
        onPressedChange={toggleUnit}
        aria-label="Toggle between square feet and square meters"
        className="h-6 w-11 data-[state=on]:bg-blue-600"
      >
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
          unit === 'sqm' ? 'translate-x-2' : '-translate-x-2'
        }`} />
      </Toggle>
      <span className="text-sm text-gray-600">m²</span>
    </div>
  );
};

export default UnitToggle;
