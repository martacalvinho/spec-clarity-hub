
import { useState } from 'react';
import { useUnitToggle } from '@/hooks/useUnitToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MaterialPricingInputProps {
  material: any;
  onPricingUpdated: () => void;
  showAdvanced?: boolean;
}

const MaterialPricingInput = ({ material, onPricingUpdated, showAdvanced = false }: MaterialPricingInputProps) => {
  const { unit, convertArea, formatPrice } = useUnitToggle();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [unitType, setUnitType] = useState(material.unit_type || 'sqft');
  const [pricePerSqft, setPricePerSqft] = useState(material.price_per_sqft || 0);
  const [pricePerUnit, setPricePerUnit] = useState(material.price_per_unit || 0);
  const [totalArea, setTotalArea] = useState(material.total_area || 0);
  const [totalUnits, setTotalUnits] = useState(material.total_units || 0);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('materials')
        .update({
          unit_type: unitType,
          price_per_sqft: pricePerSqft,
          price_per_unit: pricePerUnit,
          total_area: totalArea,
          total_units: totalUnits,
        })
        .eq('id', material.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing information updated successfully"
      });

      onPricingUpdated();
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast({
        title: "Error",
        description: "Failed to update pricing information",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const displayPrice = unit === 'sqm' && unitType === 'sqft' 
    ? formatPrice(pricePerSqft / 0.092903, 'sqm')
    : unit === 'sqft' && unitType === 'sqm'
    ? formatPrice(pricePerUnit * 0.092903, 'sqft')
    : unitType === 'sqft' 
    ? formatPrice(pricePerSqft, 'sqft')
    : formatPrice(pricePerUnit, 'sqm');

  const displayArea = unit === 'sqm' && unitType === 'sqft'
    ? `${convertArea(totalArea, 'sqft')} m²`
    : unit === 'sqft' && unitType === 'sqm'
    ? `${convertArea(totalArea, 'sqm')} ft²`
    : unitType === 'sqft'
    ? `${totalArea} ft²`
    : `${totalArea} m²`;

  // Get the display unit label based on the current unit toggle
  const unitLabel = unit === 'sqm' ? 'M²' : 'Sq Ft';
  const areaUnitLabel = unit === 'sqm' ? 'm²' : 'sq ft';

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-blue-800">💰 Pricing Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {showAdvanced && (
            <div>
              <Label htmlFor="unit-type" className="text-xs font-medium text-gray-700">Unit Type</Label>
              <Select value={unitType} onValueChange={setUnitType}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Square Feet</SelectItem>
                  <SelectItem value="sqm">Square Meters</SelectItem>
                  <SelectItem value="linear_ft">Linear Feet</SelectItem>
                  <SelectItem value="piece">Per Piece</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className={showAdvanced ? "" : "md:col-start-1"}>
            <Label htmlFor="price-per-unit" className="text-xs font-medium text-gray-700">
              Price per {unitLabel}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
              <Input
                id="price-per-unit"
                type="number"
                step="0.01"
                value={unitType === 'sqft' ? pricePerSqft : pricePerUnit}
                onChange={(e) => {
                  if (unitType === 'sqft') {
                    setPricePerSqft(parseFloat(e.target.value) || 0);
                  } else {
                    setPricePerUnit(parseFloat(e.target.value) || 0);
                  }
                }}
                className="pl-8 h-8 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="total-area" className="text-xs font-medium text-gray-700">
              Total Area ({areaUnitLabel})
            </Label>
            <Input
              id="total-area"
              type="number"
              step="0.01"
              value={totalArea}
              onChange={(e) => setTotalArea(parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="total-cost" className="text-xs font-medium text-gray-700">Total Cost</Label>
            <div className="h-8 px-3 bg-green-50 border border-green-200 rounded flex items-center text-sm font-medium text-green-700">
              ${((unitType === 'sqft' ? pricePerSqft : pricePerUnit) * totalArea).toFixed(2)}
            </div>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleSave} 
              disabled={isUpdating}
              size="sm"
              className="h-8 text-xs"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialPricingInput;
