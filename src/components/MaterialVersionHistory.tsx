
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, User } from 'lucide-react';
import UserInitials from './UserInitials';

interface MaterialVersionHistoryProps {
  materialId: string;
}

const MaterialVersionHistory = ({ materialId }: MaterialVersionHistoryProps) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (materialId) {
      fetchVersionHistory();
    }
  }, [materialId]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('material_versions')
        .select(`
          *,
          manufacturers(name)
        `)
        .eq('material_id', materialId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching version history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading version history...</div>;
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No version history available for this material.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((version) => (
        <Card key={version.id} className="border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Version {version.version_number}
              </CardTitle>
              <div className="flex items-center gap-2">
                <UserInitials userId={version.changed_by} size="sm" />
                <span className="text-sm text-gray-500">
                  {new Date(version.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Name:</strong> {version.name}
                </div>
                <div>
                  <strong>Category:</strong> {version.category}
                </div>
                {version.subcategory && (
                  <div>
                    <strong>Subcategory:</strong> {version.subcategory}
                  </div>
                )}
                {version.manufacturers?.name && (
                  <div>
                    <strong>Manufacturer:</strong> {version.manufacturers.name}
                  </div>
                )}
                {version.reference_sku && (
                  <div>
                    <strong>SKU:</strong> {version.reference_sku}
                  </div>
                )}
                {version.dimensions && (
                  <div>
                    <strong>Dimensions:</strong> {version.dimensions}
                  </div>
                )}
                {version.price_per_sqft && (
                  <div>
                    <strong>Price/sqft:</strong> ${version.price_per_sqft}
                  </div>
                )}
                {version.price_per_unit && (
                  <div>
                    <strong>Price/unit:</strong> ${version.price_per_unit}
                  </div>
                )}
              </div>
              {version.change_reason && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <strong>Change reason:</strong> {version.change_reason}
                </div>
              )}
              {version.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Notes:</strong> {version.notes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MaterialVersionHistory;
