import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Copy, Plus } from 'lucide-react';
import DuplicateMaterialDetector from './DuplicateMaterialDetector';

interface JSONDataInputProps {
  studioId: string;
  projectId?: string;
}

const TEMPLATE_MATERIALS = [
  {
    name: "White Oak Flooring",
    model: "NATURAL",
    category: "Flooring",
    subcategory: "Hardwood",
    tag: "Premium",
    location: "Living room",
    reference_sku: "WO-3-NAT",
    dimensions: "5\" x 3/4\" x RL",
    notes: "Available in 3 finishes"
  },
  {
    name: "Carrara Marble",
    model: "CLASSIC",
    category: "Stone", 
    subcategory: "Marble",
    tag: "Luxury",
    location: "Kitchen",
    reference_sku: "CAR-12-POL",
    dimensions: "12\" x 24\" x 3/4\"",
    notes: "Bookmatched slabs available"
  }
];

const TEMPLATE_MANUFACTURERS = [
  {
    name: "Premium Woods Co",
    contact_name: "John Smith",
    email: "john@premiumwoods.com",
    phone: "+1-555-0123",
    website: "premiumwoods.com",
    notes: "Lead time 4-6 weeks"
  },
  {
    name: "Stone Masters",
    contact_name: "Sarah Johnson", 
    email: "sarah@stonemasters.com",
    phone: "+1-555-0456",
    website: "stonemasters.com",
    notes: "Custom fabrication available"
  }
];

const TEMPLATE_CLIENTS = [
  {
    name: "Smith Residence",
    notes: "High-end residential project"
  },
  {
    name: "Downtown Office Building",
    notes: "Commercial office space renovation"
  }
];

const JSONDataInput = ({ studioId, projectId }: JSONDataInputProps) => {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [dataType, setDataType] = useState<'materials' | 'manufacturers' | 'clients'>('materials');
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>('');
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [showDuplicateDetector, setShowDuplicateDetector] = useState(false);
  const [materialsToCheck, setMaterialsToCheck] = useState<any[]>([]);

  useEffect(() => {
    if (studioId && dataType === 'materials') {
      fetchManufacturers();
    }
  }, [studioId, dataType]);

  const fetchManufacturers = async () => {
    try {
      const { data } = await supabase
        .from('manufacturers')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');
      
      setManufacturers(data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  const checkForExistingMaterials = async (materialNames: string[]) => {
    try {
      const { data: existingMaterials } = await supabase
        .from('materials')
        .select('name')
        .eq('studio_id', studioId)
        .in('name', materialNames);

      return existingMaterials?.map(m => m.name) || [];
    } catch (error) {
      console.error('Error checking existing materials:', error);
      return [];
    }
  };

  const getTemplate = () => {
    switch (dataType) {
      case 'materials':
        return TEMPLATE_MATERIALS;
      case 'manufacturers':
        return TEMPLATE_MANUFACTURERS;
      case 'clients':
        return TEMPLATE_CLIENTS;
    }
  };

  const copyTemplate = () => {
    const templateString = JSON.stringify(getTemplate(), null, 2);
    setJsonInput(templateString);
    navigator.clipboard.writeText(templateString);
    toast({
      title: "Template copied",
      description: `${dataType} template has been copied to the input field and clipboard`,
    });
  };

  const validateAndParseJSON = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array');
      }

      // Validate based on data type
      if (dataType === 'materials') {
        data.forEach((item: any, index: number) => {
          if (!item.name || !item.category) {
            throw new Error(`Material at index ${index} must have name and category`);
          }
        });
      } else if (dataType === 'manufacturers') {
        data.forEach((item: any, index: number) => {
          if (!item.name) {
            throw new Error(`Manufacturer at index ${index} must have name`);
          }
        });
      } else if (dataType === 'clients') {
        data.forEach((item: any, index: number) => {
          if (!item.name) {
            throw new Error(`Client at index ${index} must have name`);
          }
        });
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleDuplicateResolution = async (results: any[]) => {
    setImporting(true);
    let importedCount = 0;
    let linkedCount = 0;

    try {
      for (const result of results) {
        if (result.action === 'create') {
          // Create new material
          const materialInsert = {
            name: result.materialToImport.name,
            model: result.materialToImport.model || null,
            category: result.materialToImport.category,
            subcategory: result.materialToImport.subcategory || null,
            manufacturer_id: selectedManufacturerId === 'none' ? null : selectedManufacturerId,
            tag: result.materialToImport.tag || null,
            location: result.materialToImport.location || null,
            reference_sku: result.materialToImport.reference_sku || null,
            dimensions: result.materialToImport.dimensions || null,
            notes: result.materialToImport.notes || null,
            studio_id: studioId
          };

          const { data: materialData, error: materialError } = await supabase
            .from('materials')
            .insert([materialInsert])
            .select();

          if (materialError) throw materialError;

          if (projectId && materialData && materialData.length > 0) {
            const { error: projMaterialError } = await supabase
              .from('proj_materials')
              .insert([{
                project_id: projectId,
                material_id: materialData[0].id,
                studio_id: studioId
              }]);

            if (projMaterialError) throw projMaterialError;
          }

          importedCount++;
        } else if (result.action === 'link' && result.selectedExistingId) {
          // Link existing material to project
          if (projectId) {
            const { error: projMaterialError } = await supabase
              .from('proj_materials')
              .insert([{
                project_id: projectId,
                material_id: result.selectedExistingId,
                studio_id: studioId
              }]);

            if (projMaterialError) throw projMaterialError;
          }

          linkedCount++;
        }
      }

      toast({
        title: "Import successful",
        description: `Created ${importedCount} new materials and linked ${linkedCount} existing materials${projectId ? ' to project' : ''}`,
      });

      setJsonInput('');
      setSelectedManufacturerId('');
      setShowDuplicateDetector(false);
      setMaterialsToCheck([]);

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import materials",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const importData = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter JSON data to import",
        variant: "destructive",
      });
      return;
    }

    if (dataType === 'materials' && !selectedManufacturerId) {
      toast({
        title: "Error",
        description: "Please select a manufacturer for these materials",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = validateAndParseJSON(jsonInput);

      if (dataType === 'materials') {
        // For materials, start duplicate detection process
        const validMaterials = data.filter((m: any) => m.name && m.name.trim() && m.category && m.category.trim());
        
        if (validMaterials.length === 0) {
          toast({
            title: "Error",
            description: "No valid materials found in the JSON data",
            variant: "destructive",
          });
          return;
        }

        setMaterialsToCheck(validMaterials);
        setShowDuplicateDetector(true);
        return;
      }

      // For non-materials, proceed with original import logic
      setImporting(true);
      let importedCount = 0;

      if (dataType === 'manufacturers') {
        const manufacturerInserts = data
          .filter((m: any) => m.name && m.name.trim())
          .map((m: any) => ({
            name: m.name,
            contact_name: m.contact_name || null,
            email: m.email || null,
            phone: m.phone || null,
            website: m.website || null,
            notes: m.notes || null,
            studio_id: studioId
          }));

        if (manufacturerInserts.length > 0) {
          const { data: manufacturerData, error: manufacturerError } = await supabase
            .from('manufacturers')
            .insert(manufacturerInserts)
            .select();

          if (manufacturerError) throw manufacturerError;
          importedCount = manufacturerData?.length || 0;
          
          fetchManufacturers();
        }
      } else if (dataType === 'clients') {
        const clientInserts = data
          .filter((c: any) => c.name && c.name.trim())
          .map((c: any) => ({
            name: c.name,
            notes: c.notes || null,
            studio_id: studioId
          }));

        if (clientInserts.length > 0) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert(clientInserts)
            .select();

          if (clientError) throw clientError;
          importedCount = clientData?.length || 0;
        }
      }

      toast({
        title: "Import successful",
        description: `Imported ${importedCount} ${dataType}`,
      });

      setJsonInput('');

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data. Please check your JSON format.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const getInstructions = () => {
    switch (dataType) {
      case 'materials':
        return (
          <div className="space-y-2 text-sm">
            <p><strong>Required fields:</strong> name and category</p>
            <p><strong>Optional fields:</strong> model, subcategory, tag, location, reference_sku, dimensions, notes</p>
            <p className="text-orange-600 font-medium">Note: Manufacturer will be set to the selected manufacturer above. No need to include manufacturer_name in JSON.</p>
            <p className="mt-4"><strong>Available categories:</strong></p>
            <p className="text-gray-600">Flooring, Surface, Tile, Stone, Wood, Metal, Glass, Fabric, Lighting, Hardware, Other</p>
            <p className="mt-4"><strong>Common tags:</strong></p>
            <p className="text-gray-600">Sustainable, Premium, Fire-rated, Water-resistant, Low-maintenance, Custom, Standard, Luxury, Budget-friendly, Eco-friendly</p>
            <p className="mt-4"><strong>Common locations:</strong></p>
            <p className="text-gray-600">Kitchen, Bathroom, Living room, Bedroom, Exterior, Commercial, Office, Hallway, Entrance, Outdoor</p>
          </div>
        );
      case 'manufacturers':
        return (
          <div className="space-y-2 text-sm">
            <p><strong>Required fields:</strong> name</p>
            <p><strong>Optional fields:</strong> contact_name, email, phone, website, notes</p>
          </div>
        );
      case 'clients':
        return (
          <div className="space-y-2 text-sm">
            <p><strong>Required fields:</strong> name</p>
            <p><strong>Optional fields:</strong> notes</p>
          </div>
        );
    }
  };

  if (showDuplicateDetector) {
    return (
      <DuplicateMaterialDetector
        materialsToImport={materialsToCheck}
        studioId={studioId}
        onResolutionComplete={handleDuplicateResolution}
        onCancel={() => {
          setShowDuplicateDetector(false);
          setMaterialsToCheck([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {projectId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">
              <strong>Project Selected:</strong> Materials imported will be automatically linked to the selected project.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Data Type</CardTitle>
          <CardDescription>
            Choose what type of data you want to import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={dataType} onValueChange={(value: 'materials' | 'manufacturers' | 'clients') => {
            setDataType(value);
            setJsonInput('');
            setSelectedManufacturerId('');
          }}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="materials">Materials</SelectItem>
              <SelectItem value="manufacturers">Manufacturers</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Manufacturer Selection for Materials */}
      {dataType === 'materials' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Manufacturer</CardTitle>
            <CardDescription>
              Choose which manufacturer these materials belong to, or select "NONE" if no manufacturer is specified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedManufacturerId} onValueChange={setSelectedManufacturerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a manufacturer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">*NONE*</SelectItem>
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {manufacturers.length === 0 && (
                <p className="text-sm text-gray-500">
                  No manufacturers found. Add manufacturers first, or import manufacturers using the dropdown above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              JSON Template for {dataType}
            </CardTitle>
            <CardDescription>
              Use this template format for your {dataType} data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(getTemplate(), null, 2)}
              </pre>
              <Button onClick={copyTemplate} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Template to Input
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>JSON Data Input</CardTitle>
            <CardDescription>
              Paste your {dataType} JSON data here following the template format
              {dataType === 'materials' && (
                <span className="block mt-2 text-sm font-medium text-orange-600">
                  ⚠️ Smart duplicate detection enabled - we'll check for similar materials before importing
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`Paste your ${dataType} JSON data here...`}
                className="min-h-96 font-mono text-sm"
              />
              <Button 
                onClick={importData} 
                disabled={importing || !jsonInput.trim() || (dataType === 'materials' && !selectedManufacturerId)}
                className="w-full bg-coral hover:bg-coral-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Processing...' : `Import ${dataType}${dataType === 'materials' ? ' (with duplicate check)' : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions for {dataType}</CardTitle>
        </CardHeader>
        <CardContent>
          {getInstructions()}
        </CardContent>
      </Card>
    </div>
  );
};

export default JSONDataInput;
