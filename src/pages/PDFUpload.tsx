
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Clock, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import PDFMaterialExtractorForm from '@/components/forms/PDFMaterialExtractorForm';
import { useToast } from '@/hooks/use-toast';

const PDFUpload = () => {
  const { studioId, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [extractedMaterials, setExtractedMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && studioId) {
      fetchSubmissions();
      fetchExtractedMaterials();
    } else if (!authLoading && !studioId) {
      setError('No studio ID available');
      setLoading(false);
    }
  }, [studioId, authLoading]);

  const fetchSubmissions = async () => {
    if (!studioId) {
      setError('No studio ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('pdf_submissions' as any)
        .select('*')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        setError(error.message);
      } else {
        setSubmissions(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  const fetchExtractedMaterials = async () => {
    if (!studioId) {
      setError('No studio ID available');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('extracted_materials' as any)
        .select(`
          *,
          pdf_submissions!inner(*)
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching extracted materials:', error);
        setError(error.message);
      } else {
        setExtractedMaterials(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching extracted materials:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('extracted_materials' as any)
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: studioId 
        })
        .eq('id', materialId);

      if (error) throw error;

      toast({
        title: "Material Approved",
        description: "The material has been approved and will be added to your library.",
      });

      fetchExtractedMaterials();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve material",
        variant: "destructive",
      });
    }
  };

  const handleApproveAll = async () => {
    try {
      const pendingMaterials = extractedMaterials.filter(m => m.status === 'pending');
      
      const { error } = await supabase
        .from('extracted_materials' as any)
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: studioId 
        })
        .in('id', pendingMaterials.map(m => m.id));

      if (error) throw error;

      toast({
        title: "All Materials Approved",
        description: `${pendingMaterials.length} materials have been approved and will be added to your library.`,
      });

      fetchExtractedMaterials();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve materials",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'ready_for_review':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'ready_for_review':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading PDF submissions: {error}</p>
          <Button onClick={() => {
            fetchSubmissions();
            fetchExtractedMaterials();
          }} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading PDF submissions...</div>;
  }

  const pendingMaterials = extractedMaterials.filter(m => m.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">PDF Material Extraction</h1>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload PDF</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="review">
            Review Materials
            {pendingMaterials.length > 0 && (
              <Badge className="ml-2 bg-orange-500">{pendingMaterials.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Material Schedule PDF
              </CardTitle>
              <CardDescription>
                Upload a PDF material schedule for processing by the Treqy team. Materials will be extracted and require your approval before being added to your library.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Material Schedule Extraction</h3>
                <p className="text-gray-600 mb-4">
                  Upload a PDF material schedule and our team will extract all materials, 
                  manufacturers, and specifications. You'll be able to review and approve 
                  each material before it's added to your library.
                </p>
                <div className="max-w-md mx-auto">
                  <PDFMaterialExtractorForm onMaterialsAdded={() => {
                    fetchSubmissions();
                    fetchExtractedMaterials();
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>PDF Submissions</CardTitle>
              <CardDescription>
                Track the status of your PDF submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">{submission.file_name}</h3>
                        <p className="text-sm text-gray-500">
                          Submitted {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                        {submission.notes && (
                          <p className="text-sm text-gray-600 mt-1">{submission.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No PDF submissions yet. Upload your first PDF to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Review Extracted Materials</CardTitle>
                  <CardDescription>
                    Review and approve materials extracted from your PDFs
                  </CardDescription>
                </div>
                {pendingMaterials.length > 0 && (
                  <Button onClick={handleApproveAll} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All ({pendingMaterials.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extractedMaterials.map((material) => (
                  <div key={material.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{material.name}</h3>
                          <Badge className={getStatusColor(material.status)}>
                            {material.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Category:</span> {material.category}
                          </div>
                          {material.subcategory && (
                            <div>
                              <span className="font-medium">Subcategory:</span> {material.subcategory}
                            </div>
                          )}
                          {material.manufacturer_name && (
                            <div>
                              <span className="font-medium">Manufacturer:</span> {material.manufacturer_name}
                            </div>
                          )}
                          {material.reference_sku && (
                            <div>
                              <span className="font-medium">SKU:</span> {material.reference_sku}
                            </div>
                          )}
                          {material.dimensions && (
                            <div>
                              <span className="font-medium">Dimensions:</span> {material.dimensions}
                            </div>
                          )}
                          {material.location && (
                            <div>
                              <span className="font-medium">Location:</span> {material.location}
                            </div>
                          )}
                        </div>
                        {material.notes && (
                          <div className="mt-2">
                            <span className="font-medium">Notes:</span> {material.notes}
                          </div>
                        )}
                      </div>
                      {material.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApproveMaterial(material.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {extractedMaterials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No extracted materials yet. Upload a PDF to get started!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFUpload;
