
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Package, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const MaterialApproval = () => {
  const { studioId } = useAuth();
  const { toast } = useToast();
  const [extractedMaterials, setExtractedMaterials] = useState<any[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (studioId) {
      fetchExtractedMaterials();
    }
  }, [studioId]);

  const fetchExtractedMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('extracted_materials')
        .select(`
          *,
          pdf_submissions(file_name, status)
        `)
        .eq('studio_id', studioId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExtractedMaterials(data || []);
    } catch (error) {
      console.error('Error fetching extracted materials:', error);
      toast({
        title: "Error",
        description: "Failed to fetch extracted materials",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMaterial = (materialId: string, checked: boolean) => {
    if (checked) {
      setSelectedMaterials([...selectedMaterials, materialId]);
    } else {
      setSelectedMaterials(selectedMaterials.filter(id => id !== materialId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMaterials(extractedMaterials.map(m => m.id));
    } else {
      setSelectedMaterials([]);
    }
  };

  const handleApprove = async (materialIds: string[]) => {
    setApproving(true);
    try {
      // First, approve the extracted materials
      const { error: approveError } = await supabase
        .from('extracted_materials')
        .update({
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .in('id', materialIds);

      if (approveError) throw approveError;

      // Then, create actual materials from the approved extracted materials
      const materialsToCreate = extractedMaterials
        .filter(m => materialIds.includes(m.id))
        .map(m => ({
          studio_id: studioId,
          name: m.name,
          category: m.category,
          subcategory: m.subcategory,
          notes: m.notes,
          reference_sku: m.reference_sku,
          dimensions: m.dimensions,
          location: m.location,
          tag: m.tag,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }));

      const { error: createError } = await supabase
        .from('materials')
        .insert(materialsToCreate);

      if (createError) throw createError;

      // Update PDF submission status to completed
      const submissionIds = extractedMaterials
        .filter(m => materialIds.includes(m.id))
        .map(m => m.submission_id)
        .filter((id, index, self) => self.indexOf(id) === index);

      if (submissionIds.length > 0) {
        const { error: updateError } = await supabase
          .from('pdf_submissions')
          .update({ status: 'completed' })
          .in('id', submissionIds);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: `${materialIds.length} material(s) approved and added to your library`
      });

      // Refresh the list
      fetchExtractedMaterials();
      setSelectedMaterials([]);
    } catch (error) {
      console.error('Error approving materials:', error);
      toast({
        title: "Error",
        description: "Failed to approve materials",
        variant: "destructive"
      });
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          Loading materials for approval...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Material Approval
        </CardTitle>
        <CardDescription>
          Review and approve materials extracted from your PDF submissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {extractedMaterials.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No materials pending approval</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedMaterials.length === extractedMaterials.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Select All ({extractedMaterials.length} materials)
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(selectedMaterials)}
                  disabled={selectedMaterials.length === 0 || approving}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {approving ? 'Approving...' : `Approve Selected (${selectedMaterials.length})`}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {extractedMaterials.map((material) => (
                <div key={material.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={material.id}
                      checked={selectedMaterials.includes(material.id)}
                      onCheckedChange={(checked) => handleSelectMaterial(material.id, checked)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{material.name}</h3>
                          <p className="text-sm text-gray-600">
                            {material.category} {material.subcategory && `• ${material.subcategory}`}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          From: {material.pdf_submissions?.file_name || 'Unknown PDF'}
                        </Badge>
                      </div>
                      
                      {material.manufacturer_name && (
                        <p className="text-sm"><strong>Manufacturer:</strong> {material.manufacturer_name}</p>
                      )}
                      
                      {material.reference_sku && (
                        <p className="text-sm"><strong>SKU:</strong> {material.reference_sku}</p>
                      )}
                      
                      {material.dimensions && (
                        <p className="text-sm"><strong>Dimensions:</strong> {material.dimensions}</p>
                      )}
                      
                      {material.location && (
                        <p className="text-sm"><strong>Location:</strong> {material.location}</p>
                      )}
                      
                      {material.notes && (
                        <p className="text-sm"><strong>Notes:</strong> {material.notes}</p>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove([material.id])}
                          disabled={approving}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialApproval;
