import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Package, Building } from 'lucide-react';
import DuplicateMaterialDetector from './DuplicateMaterialDetector';
import DuplicateManufacturerDetector from './DuplicateManufacturerDetector';

interface MaterialToImport {
  name: string;
  category: string;
  subcategory?: string;
  notes?: string;
  reference_sku?: string;
  dimensions?: string;
  location?: string;
  manufacturer_id?: string;
  manufacturer_name?: string;
  tag?: string;
}

interface ManufacturerToImport {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
}

interface ExistingMaterial {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  notes?: string;
  reference_sku?: string;
  dimensions?: string;
  location?: string;
  manufacturer_id?: string;
  manufacturer_name?: string;
  tag?: string;
  similarity_score: number;
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

interface MaterialDuplicateResult {
  materialToImport: MaterialToImport;
  existingMaterials: ExistingMaterial[];
  action: 'create' | 'link';
  selectedExistingId?: string;
}

interface ManufacturerResolution {
  manufacturerToImport: ManufacturerToImport;
  existingManufacturers: ExistingManufacturer[];
  action: 'create' | 'link' | 'replace';
  selectedExistingId?: string;
}

interface JSONDataInputProps {
  studioId: string;
  projectId?: string;
  pdfSubmissionId?: string;
}

interface Manufacturer {
  id: string;
  name: string;
}

const JSONDataInput = ({ studioId, projectId, pdfSubmissionId }: JSONDataInputProps) => {
  const { toast } = useToast();
  const [materialsJsonInput, setMaterialsJsonInput] = useState('');
  const [manufacturersJsonInput, setManufacturersJsonInput] = useState('');
  const [materialsData, setMaterialsData] = useState<MaterialToImport[]>([]);
  const [manufacturersData, setManufacturersData] = useState<ManufacturerToImport[]>([]);
  const [showMaterialDuplicateDetector, setShowMaterialDuplicateDetector] = useState(false);
  const [showManufacturerDuplicateDetector, setShowManufacturerDuplicateDetector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>('');

  useEffect(() => {
    fetchManufacturers();
  }, [studioId]);

  const fetchManufacturers = async () => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (error) throw error;
      setManufacturers(data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const parseMaterialsJson = () => {
    try {
      const parsed = JSON.parse(materialsJsonInput);
      const materials = Array.isArray(parsed) ? parsed : [parsed];
      
      const validMaterials = materials.filter(material => 
        material.name && material.category
      );
      
      if (validMaterials.length === 0) {
        toast({
          title: "Invalid Data",
          description: "No valid materials found. Each material must have at least 'name' and 'category'.",
          variant: "destructive"
        });
        return;
      }
      
      const materialsWithManufacturer = validMaterials.map(material => ({
        ...material,
        manufacturer_id: selectedManufacturerId || material.manufacturer_id
      }));
      
      setMaterialsData(materialsWithManufacturer);
      setMaterialsJsonInput('');
      
      toast({
        title: "Success",
        description: `Parsed ${validMaterials.length} materials from JSON`,
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format and try again.",
        variant: "destructive"
      });
    }
  };

  const parseManufacturersJson = () => {
    try {
      const parsed = JSON.parse(manufacturersJsonInput);
      const manufacturers = Array.isArray(parsed) ? parsed : [parsed];
      
      const validManufacturers = manufacturers.filter(manufacturer => 
        manufacturer.name
      );
      
      if (validManufacturers.length === 0) {
        toast({
          title: "Invalid Data",
          description: "No valid manufacturers found. Each manufacturer must have at least 'name'.",
          variant: "destructive"
        });
        return;
      }
      
      setManufacturersData(validManufacturers);
      setManufacturersJsonInput('');
      
      toast({
        title: "Success",
        description: `Parsed ${validManufacturers.length} manufacturers from JSON`,
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format and try again.",
        variant: "destructive"
      });
    }
  };

  const processMaterials = async (materialsToProcess: MaterialToImport[], materialResolutions?: MaterialDuplicateResult[]) => {
    console.log('Processing materials:', materialsToProcess.length);
    
    try {
      const materialsToCreate = materialResolutions 
        ? materialResolutions
            .filter(resolution => resolution.action === 'create')
            .map(resolution => resolution.materialToImport)
        : materialsToProcess;

      console.log('Materials to create:', materialsToCreate.length);

      if (materialsToCreate.length === 0) {
        console.log('No materials to create');
        return { success: true, created: 0, errors: [] };
      }

      const errors: string[] = [];
      let created = 0;

      if (pdfSubmissionId) {
        for (const material of materialsToCreate) {
          try {
            const { error } = await supabase
              .from('extracted_materials')
              .insert({
                submission_id: pdfSubmissionId,
                studio_id: studioId,
                name: material.name,
                category: material.category,
                subcategory: material.subcategory || null,
                notes: material.notes || null,
                reference_sku: material.reference_sku || null,
                dimensions: material.dimensions || null,
                location: material.location || null,
                manufacturer_name: material.manufacturer_name || null,
                tag: material.tag || null
              });

            if (error) {
              console.error(`Error creating extracted material "${material.name}":`, error);
              errors.push(`${material.name}: ${error.message}`);
            } else {
              created++;
              console.log(`Successfully created extracted material: ${material.name}`);
            }
          } catch (error) {
            console.error(`Unexpected error processing material "${material.name}":`, error);
            errors.push(`${material.name}: Unexpected error`);
          }
        }
      } else {
        for (const material of materialsToCreate) {
          try {
            const { data: existingMaterial } = await supabase
              .from('materials')
              .select('id, name')
              .eq('studio_id', studioId)
              .eq('name', material.name)
              .maybeSingle();

            if (existingMaterial) {
              console.log(`Material "${material.name}" already exists, skipping...`);
              continue;
            }

            const materialData = {
              studio_id: studioId,
              name: material.name,
              category: material.category,
              subcategory: material.subcategory || null,
              notes: material.notes || null,
              reference_sku: material.reference_sku || null,
              dimensions: material.dimensions || null,
              location: material.location || null,
              manufacturer_id: material.manufacturer_id || null,
              tag: material.tag || null
            };

            const { error } = await supabase
              .from('materials')
              .insert(materialData);

            if (error) {
              console.error(`Error creating material "${material.name}":`, error);
              errors.push(`${material.name}: ${error.message}`);
            } else {
              created++;
              console.log(`Successfully created material: ${material.name}`);
            }
          } catch (error) {
            console.error(`Unexpected error processing material "${material.name}":`, error);
            errors.push(`${material.name}: Unexpected error`);
          }
        }
      }

      return { success: errors.length === 0, created, errors };
    } catch (error) {
      console.error('Error in processMaterials:', error);
      return { success: false, created: 0, errors: [error.message || 'Unknown error'] };
    }
  };

  const processManufacturers = async (manufacturersToProcess: ManufacturerToImport[], manufacturerResolutions?: ManufacturerResolution[]) => {
    console.log('Processing manufacturers:', manufacturersToProcess.length);
    
    try {
      if (!manufacturerResolutions) {
        const manufacturerPromises = manufacturersToProcess.map(async (manufacturer) => {
          const { data, error } = await supabase
            .from('manufacturers')
            .insert({
              studio_id: studioId,
              name: manufacturer.name,
              contact_name: manufacturer.contact_name || null,
              email: manufacturer.email || null,
              phone: manufacturer.phone || null,
              website: manufacturer.website || null,
              notes: manufacturer.notes || null
            })
            .select('id, name')
            .single();

          if (error) throw error;
          return { name: manufacturer.name, id: data.id };
        });

        const results = await Promise.all(manufacturerPromises);
        console.log('Created manufacturers:', results);
        return results;
      }

      const results: { name: string; id: string }[] = [];

      for (const resolution of manufacturerResolutions) {
        if (resolution.action === 'create') {
          const { data, error } = await supabase
            .from('manufacturers')
            .insert({
              studio_id: studioId,
              name: resolution.manufacturerToImport.name,
              contact_name: resolution.manufacturerToImport.contact_name || null,
              email: resolution.manufacturerToImport.email || null,
              phone: resolution.manufacturerToImport.phone || null,
              website: resolution.manufacturerToImport.website || null,
              notes: resolution.manufacturerToImport.notes || null
            })
            .select('id, name')
            .single();

          if (error) throw error;
          results.push({ name: resolution.manufacturerToImport.name, id: data.id });
        } else if (resolution.action === 'replace' && resolution.selectedExistingId) {
          const { error } = await supabase
            .from('manufacturers')
            .update({
              name: resolution.manufacturerToImport.name,
              contact_name: resolution.manufacturerToImport.contact_name || null,
              email: resolution.manufacturerToImport.email || null,
              phone: resolution.manufacturerToImport.phone || null,
              website: resolution.manufacturerToImport.website || null,
              notes: resolution.manufacturerToImport.notes || null
            })
            .eq('id', resolution.selectedExistingId)
            .eq('studio_id', studioId);

          if (error) throw error;
          results.push({ name: resolution.manufacturerToImport.name, id: resolution.selectedExistingId });
        } else if (resolution.action === 'link' && resolution.selectedExistingId) {
          results.push({ name: resolution.manufacturerToImport.name, id: resolution.selectedExistingId });
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing manufacturers:', error);
      throw error;
    }
  };

  const checkForMaterialDuplicates = async () => {
    if (materialsData.length === 0) return;
    
    setLoading(true);
    try {
      const duplicateChecks = await Promise.all(
        materialsData.map(async (material) => {
          const { data: similarMaterials } = await supabase
            .rpc('find_similar_materials', {
              studio_id_param: studioId,
              material_name_param: material.name,
              category_param: material.category,
              similarity_threshold: 0.7
            });
          
          return {
            material,
            duplicates: similarMaterials || []
          };
        })
      );

      const materialsWithDuplicates = duplicateChecks.filter(check => check.duplicates.length > 0);
      
      if (materialsWithDuplicates.length === 0) {
        toast({
          title: "No Duplicates Found",
          description: `All ${materialsData.length} materials appear to be new. They will all be added to your library.`,
        });
        
        const result = await processMaterials(materialsData);
        if (result.success) {
          const destination = pdfSubmissionId ? "material approval section" : "your library";
          toast({
            title: "Materials Added",
            description: `Successfully added ${result.created} materials to ${destination}.`,
          });
          setMaterialsData([]);
        } else {
          toast({
            title: "Import Completed with Issues",
            description: `Added ${result.created} materials. ${result.errors.length} had issues.`,
            variant: "destructive"
          });
        }
      } else {
        setShowMaterialDuplicateDetector(true);
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicates. Proceeding with import.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForManufacturerDuplicates = async () => {
    if (manufacturersData.length === 0) return;
    
    setLoading(true);
    try {
      const duplicateChecks = await Promise.all(
        manufacturersData.map(async (manufacturer) => {
          const { data: similarManufacturers } = await supabase
            .rpc('find_similar_manufacturers', {
              studio_id_param: studioId,
              manufacturer_name_param: manufacturer.name,
              similarity_threshold: 0.6
            });
          
          return {
            manufacturer,
            duplicates: similarManufacturers || []
          };
        })
      );

      const manufacturersWithDuplicates = duplicateChecks.filter(check => check.duplicates.length > 0);
      
      if (manufacturersWithDuplicates.length === 0) {
        toast({
          title: "No Duplicates Found",
          description: `All ${manufacturersData.length} manufacturers appear to be new. They will all be added.`,
        });
        
        const results = await processManufacturers(manufacturersData);
        toast({
          title: "Manufacturers Added",
          description: `Successfully added ${results.length} manufacturers.`,
        });
        setManufacturersData([]);
        fetchManufacturers();
      } else {
        setShowManufacturerDuplicateDetector(true);
      }
    } catch (error) {
      console.error('Error checking for manufacturer duplicates:', error);
      toast({
        title: "Error",
        description: "Failed to check for duplicates. Proceeding with import.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMaterialResolution = async (resolutions: MaterialDuplicateResult[]) => {
    setLoading(true);
    try {
      const result = await processMaterials(materialsData, resolutions);
      
      if (result.success) {
        const destination = pdfSubmissionId ? "material approval section" : "your library";
        toast({
          title: "Materials Processed",
          description: `Successfully processed ${result.created} materials and added them to ${destination}.`,
        });
      } else {
        toast({
          title: "Import Completed with Issues",
          description: `Added ${result.created} materials. ${result.errors.length} had issues: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`,
          variant: "destructive"
        });
      }

      setShowMaterialDuplicateDetector(false);
      setMaterialsData([]);
    } catch (error) {
      console.error('Error processing material resolutions:', error);
      toast({
        title: "Error",
        description: "Failed to process materials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManufacturerResolution = async (resolutions: ManufacturerResolution[]) => {
    setLoading(true);
    try {
      const results = await processManufacturers(manufacturersData, resolutions);
      
      toast({
        title: "Manufacturers Processed",
        description: `Successfully processed ${results.length} manufacturers.`,
      });

      setShowManufacturerDuplicateDetector(false);
      setManufacturersData([]);
      fetchManufacturers();
    } catch (error) {
      console.error('Error processing manufacturer resolutions:', error);
      toast({
        title: "Error",
        description: "Failed to process manufacturers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (showMaterialDuplicateDetector) {
    return (
      <DuplicateMaterialDetector
        materialsToImport={materialsData}
        studioId={studioId}
        onResolutionComplete={(results) => {
          // Convert results to the expected format
          const materialResolutions: MaterialDuplicateResult[] = results.map(result => ({
            materialToImport: result.materialToImport,
            existingMaterials: result.existingMaterials || [],
            action: result.action as 'create' | 'link',
            selectedExistingId: result.selectedExistingId
          }));
          handleMaterialResolution(materialResolutions);
        }}
        onCancel={() => {
          setShowMaterialDuplicateDetector(false);
          setMaterialsData([]);
        }}
      />
    );
  }

  if (showManufacturerDuplicateDetector) {
    return (
      <DuplicateManufacturerDetector
        manufacturersToImport={manufacturersData}
        studioId={studioId}
        onResolutionComplete={(results) => {
          // Convert results to the expected format
          const manufacturerResolutions: ManufacturerResolution[] = results.map(result => ({
            manufacturerToImport: result.manufacturerToImport,
            existingManufacturers: result.existingManufacturers || [],
            action: result.action as 'create' | 'link' | 'replace',
            selectedExistingId: result.selectedExistingId
          }));
          handleManufacturerResolution(manufacturerResolutions);
        }}
        onCancel={() => {
          setShowManufacturerDuplicateDetector(false);
          setManufacturersData([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {pdfSubmissionId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <p className="text-blue-800 font-medium">
              Materials from PDF submission will be sent to approval first
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materials Import
          </CardTitle>
          <CardDescription>
            Add your materials data in JSON format. Each material should include name, category, and any additional details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {materialsData.length > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">
                    {materialsData.length} materials ready for import
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {materialsData.slice(0, 5).map((material, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {material.name}
                      </Badge>
                    ))}
                    {materialsData.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{materialsData.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={checkForMaterialDuplicates}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Checking...' : 'Import Materials'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Manufacturer (Optional)</label>
                <Select value={selectedManufacturerId} onValueChange={setSelectedManufacturerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manufacturer to apply to all materials" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((manufacturer) => (
                      <SelectItem key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder='Example: [{"name": "Oak Flooring", "category": "Flooring", "subcategory": "Hardwood", "notes": "Premium quality"}, {"name": "Ceramic Tiles", "category": "Flooring", "subcategory": "Ceramic"}]'
                value={materialsJsonInput}
                onChange={(e) => setMaterialsJsonInput(e.target.value)}
                rows={6}
              />
              <Button
                onClick={parseMaterialsJson}
                disabled={!materialsJsonInput.trim()}
                className="w-full"
              >
                Parse Materials JSON
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Manufacturers Import
          </CardTitle>
          <CardDescription>
            Add your manufacturers data in JSON format. Each manufacturer should include name and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {manufacturersData.length > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 font-medium">
                    {manufacturersData.length} manufacturers ready for import
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {manufacturersData.slice(0, 5).map((manufacturer, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {manufacturer.name}
                      </Badge>
                    ))}
                    {manufacturersData.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{manufacturersData.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={checkForManufacturerDuplicates}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Checking...' : 'Import Manufacturers'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                placeholder='Example: [{"name": "ABC Company", "contact_name": "John Doe", "email": "john@abc.com", "phone": "+1234567890", "website": "https://abc.com"}, {"name": "XYZ Corp", "contact_name": "Jane Smith", "email": "jane@xyz.com"}]'
                value={manufacturersJsonInput}
                onChange={(e) => setManufacturersJsonInput(e.target.value)}
                rows={6}
              />
              <Button
                onClick={parseManufacturersJson}
                disabled={!manufacturersJsonInput.trim()}
                className="w-full"
              >
                Parse Manufacturers JSON
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JSONDataInput;
