
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Building, Phone, Mail, Globe } from 'lucide-react';

interface ManufacturerToImport {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

interface ExistingManufacturer {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
  similarity_score: number;
}

interface ManufacturerResolution {
  manufacturerToImport: ManufacturerToImport;
  existingManufacturers: ExistingManufacturer[];
  action: 'create' | 'link';
  selectedExistingId?: string;
}

interface DuplicateManufacturerDetectorProps {
  manufacturersToImport: ManufacturerToImport[];
  studioId: string;
  onResolutionComplete: (results: ManufacturerResolution[]) => void;
  onCancel: () => void;
}

const DuplicateManufacturerDetector = ({
  manufacturersToImport,
  studioId,
  onResolutionComplete,
  onCancel
}: DuplicateManufacturerDetectorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resolutions, setResolutions] = useState<ManufacturerResolution[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    checkForDuplicates();
  }, []);

  const checkForDuplicates = async () => {
    try {
      const results: ManufacturerResolution[] = [];

      for (const manufacturer of manufacturersToImport) {
        console.log('Checking manufacturer:', manufacturer.name);
        
        // Use the find_similar_manufacturers function
        const { data: similarManufacturers, error } = await supabase
          .rpc('find_similar_manufacturers', {
            studio_id_param: studioId,
            manufacturer_name_param: manufacturer.name,
            similarity_threshold: 0.6
          });

        if (error) {
          console.error('Error checking similar manufacturers:', error);
          // If there's an error, just create the manufacturer
          results.push({
            manufacturerToImport: manufacturer,
            existingManufacturers: [],
            action: 'create'
          });
          continue;
        }

        const existingManufacturers = (similarManufacturers as ExistingManufacturer[]) || [];

        results.push({
          manufacturerToImport: manufacturer,
          existingManufacturers,
          action: existingManufacturers.length > 0 ? 'link' : 'create'
        });
      }

      setResolutions(results);
    } catch (error) {
      console.error('Error in duplicate detection:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicates. Proceeding with import.",
        variant: "destructive",
      });
      
      // Fallback: create all manufacturers
      const fallbackResults = manufacturersToImport.map(manufacturer => ({
        manufacturerToImport: manufacturer,
        existingManufacturers: [],
        action: 'create' as const
      }));
      setResolutions(fallbackResults);
    } finally {
      setLoading(false);
    }
  };

  const handleResolution = (index: number, action: 'create' | 'link', selectedExistingId?: string) => {
    const updatedResolutions = [...resolutions];
    updatedResolutions[index] = {
      ...updatedResolutions[index],
      action,
      selectedExistingId
    };
    setResolutions(updatedResolutions);
  };

  const handleComplete = () => {
    onResolutionComplete(resolutions);
  };

  const currentResolution = resolutions[currentIndex];
  const hasNext = currentIndex < resolutions.length - 1;
  const hasPrevious = currentIndex > 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Checking for duplicate manufacturers...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentResolution) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600">No manufacturers to process.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Duplicate Manufacturer Detection
          </CardTitle>
          <CardDescription>
            We found {resolutions.filter(r => r.existingManufacturers.length > 0).length} potential duplicate(s) out of {resolutions.length} manufacturers.
            Please review each one. ({currentIndex + 1} of {resolutions.length})
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* New Manufacturer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              New Manufacturer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{currentResolution.manufacturerToImport.name}</h3>
              {currentResolution.manufacturerToImport.contact_name && (
                <p className="text-sm text-gray-600">{currentResolution.manufacturerToImport.contact_name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              {currentResolution.manufacturerToImport.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{currentResolution.manufacturerToImport.email}</span>
                </div>
              )}
              {currentResolution.manufacturerToImport.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{currentResolution.manufacturerToImport.phone}</span>
                </div>
              )}
              {currentResolution.manufacturerToImport.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{currentResolution.manufacturerToImport.website}</span>
                </div>
              )}
              {currentResolution.manufacturerToImport.notes && (
                <p className="text-sm text-gray-600">{currentResolution.manufacturerToImport.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Existing Manufacturers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-500" />
              Existing Manufacturers
              {currentResolution.existingManufacturers.length > 0 && (
                <Badge variant="outline">{currentResolution.existingManufacturers.length} found</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentResolution.existingManufacturers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No similar manufacturers found. This will be created as a new manufacturer.</p>
            ) : (
              <div className="space-y-4">
                {currentResolution.existingManufacturers.map((existing) => (
                  <div key={existing.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{existing.name}</h4>
                        {existing.contact_name && (
                          <p className="text-sm text-gray-600">{existing.contact_name}</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {Math.round(existing.similarity_score * 100)}% match
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      {existing.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{existing.email}</span>
                        </div>
                      )}
                      {existing.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{existing.phone}</span>
                        </div>
                      )}
                      {existing.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{existing.website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">What would you like to do?</h3>
            
            <div className="space-y-3">
              <Button
                onClick={() => handleResolution(currentIndex, 'create')}
                variant={currentResolution.action === 'create' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Create as New Manufacturer
                {currentResolution.existingManufacturers.length > 0 && (
                  <span className="ml-2 text-sm opacity-70">(This is a different manufacturer)</span>
                )}
              </Button>

              {currentResolution.existingManufacturers.length > 0 && (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleResolution(currentIndex, 'link', currentResolution.existingManufacturers[0].id)}
                    variant={currentResolution.action === 'link' ? 'default' : 'outline'}
                    className="w-full justify-start"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Skip Import - It's the Same Manufacturer
                    <span className="ml-2 text-sm opacity-70">
                      (Use existing: {currentResolution.existingManufacturers[0].name})
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setCurrentIndex(currentIndex - 1)}
          disabled={!hasPrevious}
          variant="outline"
        >
          Previous
        </Button>
        
        <span className="text-sm text-gray-500">
          {currentIndex + 1} of {resolutions.length}
        </span>
        
        {hasNext ? (
          <Button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            disabled={!currentResolution.action}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={!currentResolution.action}
            className="bg-coral hover:bg-coral-600"
          >
            Complete Import
          </Button>
        )}
      </div>

      <div className="flex justify-center">
        <Button onClick={onCancel} variant="ghost">
          Cancel Import
        </Button>
      </div>
    </div>
  );
};

export default DuplicateManufacturerDetector;
