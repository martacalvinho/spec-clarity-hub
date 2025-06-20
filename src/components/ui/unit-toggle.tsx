
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUnitToggle } from '@/hooks/useUnitToggle';

const UnitToggle = () => {
  const { unit, toggleUnit } = useUnitToggle();

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="unit-toggle" className="text-sm">
        sq ft
      </Label>
      <Switch
        id="unit-toggle"
        checked={unit === 'metric'}
        onCheckedChange={toggleUnit}
      />
      <Label htmlFor="unit-toggle" className="text-sm">
        sq m
      </Label>
    </div>
  );
};

export { UnitToggle };
