
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Calculator, Package, Settings, X } from 'lucide-react';

interface PricingAnalyticsProps {
  type: 'manufacturer' | 'client' | 'project';
  entityId: string;
  entityName: string;
  onClose: () => void;
}

interface PricingData {
  averagePrice: number;
  totalMaterials: number;
  totalSpend: number;
  pricePerSqft: number;
  categoryBreakdown: Array<{
    category: string;
    averagePrice: number;
    totalSpend: number;
    materialCount: number;
  }>;
  hasPricingData: boolean;
}

const PricingAnalytics = ({ type, entityId, entityName, onClose }: PricingAnalyticsProps) => {
  const { studioId } = useAuth();
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entityId && studioId) {
      fetchPricingData();
    }
  }, [entityId, studioId, type]);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      let pricingInsights: PricingData = {
        averagePrice: 0,
        totalMaterials: 0,
        totalSpend: 0,
        pricePerSqft: 0,
        categoryBreakdown: [],
        hasPricingData: false
      };

      if (type === 'manufacturer') {
        pricingInsights = await fetchManufacturerPricing();
      } else if (type === 'client') {
        pricingInsights = await fetchClientPricing();
      } else if (type === 'project') {
        pricingInsights = await fetchProjectPricing();
      }

      setPricingData(pricingInsights);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturerPricing = async (): Promise<PricingData> => {
    // Fetch materials from this manufacturer with pricing
    const { data: materials, error } = await supabase
      .from('materials')
      .select(`
        id, name, category, price_per_sqft, price_per_unit, unit_type, total_area, total_units
      `)
      .eq('manufacturer_id', entityId)
      .eq('studio_id', studioId);

    if (error) throw error;

    const materialsWithPricing = materials?.filter(m => 
      (m.price_per_sqft && m.price_per_sqft > 0) || (m.price_per_unit && m.price_per_unit > 0)
    ) || [];

    if (materialsWithPricing.length === 0) {
      return {
        averagePrice: 0,
        totalMaterials: 0,
        totalSpend: 0,
        pricePerSqft: 0,
        categoryBreakdown: [],
        hasPricingData: false
      };
    }

    const totalMaterials = materialsWithPricing.length;
    let totalPriceSum = 0;
    const categoryMap = new Map();

    materialsWithPricing.forEach(material => {
      let materialPrice = 0;

      if (material.unit_type === 'sqft' && material.price_per_sqft && material.total_area) {
        materialPrice = material.price_per_sqft * material.total_area;
      } else if (material.unit_type === 'unit' && material.price_per_unit && material.total_units) {
        materialPrice = material.price_per_unit * material.total_units;
      } else if (material.price_per_sqft) {
        materialPrice = material.price_per_sqft; // Use price per sqft as base price
      } else if (material.price_per_unit) {
        materialPrice = material.price_per_unit; // Use price per unit as base price
      }

      totalPriceSum += materialPrice;

      if (!categoryMap.has(material.category)) {
        categoryMap.set(material.category, {
          category: material.category,
          totalPrice: 0,
          count: 0
        });
      }
      const categoryData = categoryMap.get(material.category);
      categoryData.totalPrice += materialPrice;
      categoryData.count += 1;
    });

    const categoryBreakdown = Array.from(categoryMap.values()).map(cat => ({
      category: cat.category,
      averagePrice: cat.count > 0 ? cat.totalPrice / cat.count : 0,
      totalSpend: cat.totalPrice,
      materialCount: cat.count
    }));

    return {
      averagePrice: totalMaterials > 0 ? totalPriceSum / totalMaterials : 0,
      totalMaterials,
      totalSpend: totalPriceSum,
      pricePerSqft: 0, // Not applicable for manufacturer view
      categoryBreakdown,
      hasPricingData: true
    };
  };

  const fetchClientPricing = async (): Promise<PricingData> => {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id, name,
        proj_materials(
          quantity, cost_per_sqft, cost_per_unit, total_cost, square_feet,
          materials(id, category, price_per_sqft, price_per_unit, unit_type)
        )
      `)
      .eq('client_id', entityId)
      .eq('studio_id', studioId);

    if (error) throw error;

    let totalSpend = 0;
    let totalMaterials = 0;
    let totalSqft = 0;
    const categoryMap = new Map();
    let hasPricingData = false;

    projects?.forEach(project => {
      project.proj_materials?.forEach((pm: any) => {
        const material = pm.materials;
        if (!material) return;

        let materialCost = 0;
        
        // Priority: saved project cost > calculated from material pricing
        if (pm.total_cost && pm.total_cost > 0) {
          materialCost = pm.total_cost;
          hasPricingData = true;
        } else if (pm.cost_per_sqft && pm.square_feet) {
          materialCost = pm.cost_per_sqft * pm.square_feet;
          hasPricingData = true;
        } else if (pm.cost_per_unit && pm.quantity) {
          materialCost = pm.cost_per_unit * pm.quantity;
          hasPricingData = true;
        } else if (material.price_per_sqft && pm.square_feet) {
          materialCost = material.price_per_sqft * pm.square_feet;
          hasPricingData = true;
        } else if (material.price_per_unit && pm.quantity) {
          materialCost = material.price_per_unit * pm.quantity;
          hasPricingData = true;
        }

        if (materialCost > 0) {
          totalSpend += materialCost;
          totalMaterials += 1;
          totalSqft += pm.square_feet || 0;

          const category = material.category || 'Unknown';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              category,
              totalSpend: 0,
              materialCount: 0
            });
          }
          const categoryData = categoryMap.get(category);
          categoryData.totalSpend += materialCost;
          categoryData.materialCount += 1;
        }
      });
    });

    if (!hasPricingData) {
      return {
        averagePrice: 0,
        totalMaterials: 0,
        totalSpend: 0,
        pricePerSqft: 0,
        categoryBreakdown: [],
        hasPricingData: false
      };
    }

    const categoryBreakdown = Array.from(categoryMap.values()).map(cat => ({
      ...cat,
      averagePrice: cat.materialCount > 0 ? cat.totalSpend / cat.materialCount : 0
    }));

    return {
      averagePrice: totalMaterials > 0 ? totalSpend / totalMaterials : 0,
      totalMaterials,
      totalSpend,
      pricePerSqft: totalSqft > 0 ? totalSpend / totalSqft : 0,
      categoryBreakdown,
      hasPricingData: true
    };
  };

  const fetchProjectPricing = async (): Promise<PricingData> => {
    const { data: projMaterials, error } = await supabase
      .from('proj_materials')
      .select(`
        quantity, cost_per_sqft, cost_per_unit, total_cost, square_feet,
        materials(id, category, name, price_per_sqft, price_per_unit, unit_type)
      `)
      .eq('project_id', entityId)
      .eq('studio_id', studioId);

    if (error) throw error;

    let totalSpend = 0;
    let totalSqft = 0;
    const categoryMap = new Map();
    let hasPricingData = false;

    projMaterials?.forEach(pm => {
      const material = pm.materials;
      if (!material) return;

      let materialCost = 0;
      
      // Priority: saved project cost > calculated from material pricing
      if (pm.total_cost && pm.total_cost > 0) {
        materialCost = pm.total_cost;
        hasPricingData = true;
      } else if (pm.cost_per_sqft && pm.square_feet) {
        materialCost = pm.cost_per_sqft * pm.square_feet;
        hasPricingData = true;
      } else if (pm.cost_per_unit && pm.quantity) {
        materialCost = pm.cost_per_unit * pm.quantity;
        hasPricingData = true;
      } else if (material.price_per_sqft && pm.square_feet) {
        materialCost = material.price_per_sqft * pm.square_feet;
        hasPricingData = true;
      } else if (material.price_per_unit && pm.quantity) {
        materialCost = material.price_per_unit * pm.quantity;
        hasPricingData = true;
      }

      if (materialCost > 0) {
        totalSpend += materialCost;
        totalSqft += pm.square_feet || 0;

        const category = material.category || 'Unknown';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            totalSpend: 0,
            materialCount: 0
          });
        }
        const categoryData = categoryMap.get(category);
        categoryData.totalSpend += materialCost;
        categoryData.materialCount += 1;
      }
    });

    if (!hasPricingData) {
      return {
        averagePrice: 0,
        totalMaterials: 0,
        totalSpend: 0,
        pricePerSqft: 0,
        categoryBreakdown: [],
        hasPricingData: false
      };
    }

    const categoryBreakdown = Array.from(categoryMap.values()).map(cat => ({
      ...cat,
      averagePrice: cat.materialCount > 0 ? cat.totalSpend / cat.materialCount : 0
    }));

    return {
      averagePrice: projMaterials?.length > 0 ? totalSpend / projMaterials.length : 0,
      totalMaterials: projMaterials?.length || 0,
      totalSpend,
      pricePerSqft: totalSqft > 0 ? totalSpend / totalSqft : 0,
      categoryBreakdown,
      hasPricingData: true
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading pricing analytics...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pricingData?.hasPricingData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Pricing Analytics</CardTitle>
            <p className="text-sm text-gray-500">No pricing data available</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 border border-dashed border-gray-300 rounded-lg">
            <Settings className="h-5 w-5 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-700">No Pricing Data</div>
              <div className="text-xs text-gray-500">
                Add material pricing to unlock cost insights and analytics
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Pricing Analytics</CardTitle>
          <p className="text-sm text-gray-500">Material cost breakdown for {entityName}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {type === 'manufacturer' ? 'Avg Material Price' : 
                 type === 'client' ? 'Avg Cost per Material' : 'Avg Material Cost'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pricingData.averagePrice)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pricingData.totalMaterials}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {type === 'manufacturer' ? 'Total Material Value' : 'Total Spend'}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pricingData.totalSpend)}</div>
            </CardContent>
          </Card>

          {(type === 'client' || type === 'project') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Sq Ft</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(pricingData.pricePerSqft)}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Category Breakdown */}
        {pricingData.categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pricingData.categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{category.category}</div>
                      <div className="text-sm text-gray-500">
                        {category.materialCount} material{category.materialCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(category.totalSpend)}</div>
                      <div className="text-sm text-gray-500">
                        Avg: {formatCurrency(category.averagePrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingAnalytics;
