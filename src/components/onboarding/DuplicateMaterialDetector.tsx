
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Check, X, Link, Plus } from 'lucide-react';

interface MaterialToImport {
  name: string;
  category: string;
  subcategory?: string;
  manufacturer_id?: string;
  reference_sku?: string;
  dimensions?: string;
  notes?: string;
  tag?: string;
  location?: string;
  model?: string;
}

interface SimilarMaterial {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  manufacturer_name: string;
  manufacturer_id?: string;
  reference_sku?: string;
  dimensions?: string;
  similarity_score: number;
}

interface DuplicateDetectionResult {
  materialToImport: MaterialToImport;
  similarMaterials: SimilarMaterial[];
  action: 'create' | 'link' | null;
  selectedExistingId?: string;
}

interface DuplicateMaterialDetectorProps {
  materialsToImport: MaterialToImport[];
  studioId: string;
  onResolutionComplete: (results: DuplicateDetectionResult[]) => void;
  onCancel: () => void;
}

const DuplicateMaterialDetector = ({ 
  materialsToImport, 
  studioId, 
  onResolutionComplete, 
  onCancel 
}: DuplicateMaterialDetectorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<DuplicateDetectionResult[]>([]);
  const [similarMaterials, setSimilarMaterials] = useState<SimilarMaterial[]>([]);
  const [loading, setLoading] = useState(false);

  const currentMaterial = materialsToImport[currentIndex];

  useEffect(() => {
    if (currentMaterial) {
      findSimilarMaterials();
    }
  }, [currentIndex, currentMaterial]);

  const findSimilarMaterials = async () => {
    if (!currentMaterial) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('find_similar_materials', {
        studio_id_param: studioId,
        material_name_param: currentMaterial.name,
        category_param: currentMaterial.category,
        manufacturer_id_param: currentMaterial.manufacturer_id || null,
        similarity_threshold: 0.6
      });

      if (error) throw error;
      setSimilarMaterials(data || []);
    } catch (error) {
      console.error('Error finding similar materials:', error);
      setSimilarMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: 'create' | 'link', existingId?: string) => {
    const newResult: DuplicateDetectionResult = {
      materialToImport: currentMaterial,
      similarMaterials,
      action,
      selectedExistingId: existingId
    };

    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    if (currentIndex < materialsToImport.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onResolutionComplete(updatedResults);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'bg-red-100 text-red-800';
    if (score >= 0.8) return 'bg-orange-100 text-orange-800';
    if (score >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.9) return 'Very High';
    if (score >= 0.8) return 'High';
    if (score >= 0.7) return 'Medium';
    return 'Low';
  };

  if (!currentMaterial) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Duplicate Detection</h3>
          <p className="text-sm text-gray-600">
            Reviewing material {currentIndex + 1} of {materialsToImport.length}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel Import
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Material to Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>Name:</strong> {currentMaterial.name}</div>
            <div><strong>Category:</strong> {currentMaterial.category}</div>
            {currentMaterial.subcategory && (
              <div><strong>Subcategory:</strong> {currentMaterial.subcategory}</div>
            )}
            {currentMaterial.reference_sku && (
              <div><strong>SKU:</strong> {currentMaterial.reference_sku}</div>
            )}
            {currentMaterial.dimensions && (
              <div><strong>Dimensions:</strong> {currentMaterial.dimensions}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Searching for similar materials...</p>
          </CardContent>
        </Card>
      ) : similarMaterials.length > 0 ? (
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Found {similarMaterials.length} similar material(s) in your database. 
              Choose to link to an existing material or create a new one.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {similarMaterials.map((similar) => (
              <Card key={similar.id} className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <strong>{similar.name}</strong>
                        <Badge className={getSimilarityColor(similar.similarity_score)}>
                          {getSimilarityLabel(similar.similarity_score)} Match ({Math.round(similar.similarity_score * 100)}%)
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Manufacturer:</strong> {similar.manufacturer_name}</div>
                        {similar.subcategory && (
                          <div><strong>Subcategory:</strong> {similar.subcategory}</div>
                        )}
                        {similar.reference_sku && (
                          <div><strong>SKU:</strong> {similar.reference_sku}</div>
                        )}
                        {similar.dimensions && (
                          <div><strong>Dimensions:</strong> {similar.dimensions}</div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAction('link', similar.id)}
                      className="ml-4"
                      size="sm"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Use This Material
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={() => handleAction('create')}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Material (Not a Duplicate)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              No similar materials found. This appears to be a new material.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={() => handleAction('create')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Material
          </Button>
        </div>
      )}
    </div>
  );
};

export default DuplicateMaterialDetector;
