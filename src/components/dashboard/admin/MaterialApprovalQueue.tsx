import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { FileText, CheckCircle, XCircle, Edit, Clock } from 'lucide-react';

interface PDFStatus {
  id: string;
  submission_id: string;
  total_materials_extracted: number;
  materials_approved: number;
  materials_rejected: number;
  materials_edited: number;
  all_materials_processed: boolean;
  created_at: string;
  pdf_submissions: {
    file_name: string;
    status: string;
    created_at: string;
    studios: {
      name: string;
    };
  };
}

interface PendingMaterial {
  id: string;
  name: string;
  category: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  pdf_submissions: {
    file_name: string;
  } | null;
  studios: {
    name: string;
  } | null;
}

const MaterialApprovalQueue = () => {
  const { toast } = useToast();
  const [pdfStatuses, setPdfStatuses] = useState<PDFStatus[]>([]);
  const [pendingMaterials, setPendingMaterials] = useState<PendingMaterial[]>([]);
  const [approvedMaterials, setApprovedMaterials] = useState<PendingMaterial[]>([]);
  const [rejectedMaterials, setRejectedMaterials] = useState<PendingMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('=== FETCHING MATERIAL APPROVAL DATA ===');
      
      // Fetch PDF statuses
      const { data: pdfStatusData, error: pdfError } = await supabase
        .from('pdf_material_status')
        .select(`
          *,
          pdf_submissions (
            file_name,
            status,
            created_at,
            studios (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (pdfError) {
        console.error('PDF Status Error:', pdfError);
        throw pdfError;
      }
      
      console.log('PDF Status Data:', pdfStatusData);
      setPdfStatuses(pdfStatusData || []);

      // Fetch pending materials - simplified query first
      console.log('Fetching pending materials...');
      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_materials')
        .select(`
          id,
          name,
          category,
          status,
          created_at,
          approved_at,
          rejected_at,
          rejection_reason,
          submission_id,
          pdf_submissions!pending_materials_submission_id_fkey (
            file_name
          ),
          studios!pending_materials_studio_id_fkey (
            name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Pending materials query result:', { pendingData, pendingError });

      if (pendingError) {
        console.error('Pending Error:', pendingError);
        throw pendingError;
      }
      
      // Process and validate pending data
      const validPendingData = (pendingData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        status: item.status,
        created_at: item.created_at,
        approved_at: item.approved_at,
        rejected_at: item.rejected_at,
        rejection_reason: item.rejection_reason,
        pdf_submissions: item.pdf_submissions,
        studios: item.studios
      })).filter(item => item.studios && item.studios.name);

      console.log('Valid pending materials:', validPendingData);
      setPendingMaterials(validPendingData);

      // Fetch approved materials
      const { data: approvedData, error: approvedError } = await supabase
        .from('pending_materials')
        .select(`
          id,
          name,
          category,
          status,
          created_at,
          approved_at,
          rejected_at,
          rejection_reason,
          submission_id,
          pdf_submissions!pending_materials_submission_id_fkey (
            file_name
          ),
          studios!pending_materials_studio_id_fkey (
            name
          )
        `)
        .eq('status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(50);

      if (approvedError) {
        console.error('Approved Error:', approvedError);
        throw approvedError;
      }
      
      const validApprovedData = (approvedData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        status: item.status,
        created_at: item.created_at,
        approved_at: item.approved_at,
        rejected_at: item.rejected_at,
        rejection_reason: item.rejection_reason,
        pdf_submissions: item.pdf_submissions,
        studios: item.studios
      })).filter(item => item.studios && item.studios.name);

      setApprovedMaterials(validApprovedData);

      // Fetch rejected materials
      const { data: rejectedData, error: rejectedError } = await supabase
        .from('pending_materials')
        .select(`
          id,
          name,
          category,
          status,
          created_at,
          approved_at,
          rejected_at,
          rejection_reason,
          submission_id,
          pdf_submissions!pending_materials_submission_id_fkey (
            file_name
          ),
          studios!pending_materials_studio_id_fkey (
            name
          )
        `)
        .eq('status', 'rejected')
        .order('rejected_at', { ascending: false })
        .limit(50);

      if (rejectedError) {
        console.error('Rejected Error:', rejectedError);
        throw rejectedError;
      }
      
      const validRejectedData = (rejectedData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        status: item.status,
        created_at: item.created_at,
        approved_at: item.approved_at,
        rejected_at: item.rejected_at,
        rejection_reason: item.rejection_reason,
        pdf_submissions: item.pdf_submissions,
        studios: item.studios
      })).filter(item => item.studios && item.studios.name);

      setRejectedMaterials(validRejectedData);

      console.log('=== FINAL COUNTS ===');
      console.log('Pending:', validPendingData.length);
      console.log('Approved:', validApprovedData.length);
      console.log('Rejected:', validRejectedData.length);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch material approval data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markPDFComplete = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('pdf_submissions')
        .update({ status: 'completed' })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "PDF marked as complete"
      });

      fetchData();
    } catch (error) {
      console.error('Error marking PDF complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark PDF as complete",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Complete' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-6">Loading material approval queue...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF Processing Status</CardTitle>
          <CardDescription>Overview of PDF submissions and their material processing status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pdfStatuses.map((status) => (
              <div key={status.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{status.pdf_submissions.file_name}</h3>
                    <p className="text-sm text-gray-600">
                      Studio: {status.pdf_submissions.studios.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Uploaded: {format(new Date(status.pdf_submissions.created_at), 'PPP')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {status.materials_approved} approved, {status.materials_rejected} rejected
                    </div>
                    <div className="text-sm text-gray-600">
                      {status.materials_edited} edited of {status.total_materials_extracted} total
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(status.pdf_submissions.status)}
                    {status.all_materials_processed && status.pdf_submissions.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => markPDFComplete(status.submission_id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {pdfStatuses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No PDF submissions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingMaterials.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedMaterials.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedMaterials.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Materials Pending Review</CardTitle>
              <CardDescription>Materials waiting for admin approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingMaterials.map((material) => (
                  <div key={material.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{material.name}</h3>
                        <p className="text-sm text-gray-600">Category: {material.category}</p>
                        <p className="text-sm text-gray-600">
                          From: {material.pdf_submissions?.file_name || 'Unknown PDF'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Studio: {material.studios?.name || 'Unknown Studio'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted: {format(new Date(material.created_at), 'PPP')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(material.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {pendingMaterials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No materials pending review.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Recently Approved Materials</CardTitle>
              <CardDescription>Materials that have been approved and moved to the materials library</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvedMaterials.map((material) => (
                  <div key={material.id} className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{material.name}</h3>
                        <p className="text-sm text-gray-600">Category: {material.category}</p>
                        <p className="text-sm text-gray-600">
                          From: {material.pdf_submissions?.file_name || 'Unknown PDF'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Studio: {material.studios?.name || 'Unknown Studio'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Approved: {material.approved_at ? format(new Date(material.approved_at), 'PPP') : 'N/A'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(material.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {approvedMaterials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No approved materials found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Materials</CardTitle>
              <CardDescription>Materials that have been rejected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rejectedMaterials.map((material) => (
                  <div key={material.id} className="p-4 border rounded-lg bg-red-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{material.name}</h3>
                        <p className="text-sm text-gray-600">Category: {material.category}</p>
                        <p className="text-sm text-gray-600">
                          From: {material.pdf_submissions?.file_name || 'Unknown PDF'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Studio: {material.studios?.name || 'Unknown Studio'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Rejected: {material.rejected_at ? format(new Date(material.rejected_at), 'PPP') : 'N/A'}
                        </p>
                        {material.rejection_reason && (
                          <p className="text-sm text-red-600 mt-1">
                            Reason: {material.rejection_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(material.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {rejectedMaterials.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No rejected materials found.
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

export default MaterialApprovalQueue;
