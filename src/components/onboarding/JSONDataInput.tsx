
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Copy } from 'lucide-react';

interface JSONDataInputProps {
  studioId: string;
}

const TEMPLATE_MATERIALS = [
  {
    name: "White Oak Flooring",
    category: "Flooring",
    subcategory: "Hardwood",
    manufacturer_name: "Premium Woods Co",
    tag: "Premium",
    location: "Living room",
    notes: "Available in 3 finishes"
  },
  {
    name: "Carrara Marble",
    category: "Stone", 
    subcategory: "Marble",
    manufacturer_name: "Stone Masters",
    tag: "Luxury",
    location: "Kitchen",
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

const JSONDataInput = ({ studioId }: JSONDataInputProps) => {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [dataType, setDataType] = useState<'materials' | 'manufacturers' | 'clients'>('materials');

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

  const importData = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter JSON data to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const data = validateAndParseJSON(jsonInput);
      let importedCount = 0;

      if (dataType === 'materials') {
        // Get all manufacturers for linking
        const { data: allManufacturers } = await supabase
          .from('manufacturers')
          .select('id, name')
          .eq('studio_id', studioId);

        const materialInserts = data
          .filter((m: any) => m.name && m.name.trim() && m.category && m.category.trim())
          .map((m: any) => {
            const manufacturer = allManufacturers?.find(sm => sm.name === m.manufacturer_name);
            return {
              name: m.name,
              category: m.category,
              subcategory: m.subcategory || null,
              manufacturer_id: manufacturer?.id || null,
              tag: m.tag || null,
              location: m.location || null,
              notes: m.notes || null,
              studio_id: studioId
            };
          });

        if (materialInserts.length > 0) {
          const { data: materialData, error: materialError } = await supabase
            .from('materials')
            .insert(materialInserts)
            .select();

          if (materialError) throw materialError;
          importedCount = materialData?.length || 0;
        }
      } else if (dataType === 'manufacturers') {
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
            <p><strong>Optional fields:</strong> subcategory, manufacturer_name, tag, location, notes</p>
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

  return (
    <div className="space-y-6">
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
            setJsonInput(''); // Clear input when switching types
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
                disabled={importing || !jsonInput.trim()}
                className="w-full bg-coral hover:bg-coral-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importing...' : `Import ${dataType}`}
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
