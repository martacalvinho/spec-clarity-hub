import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Eye, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PdfJSONDataInput from '@/components/onboarding/PdfJSONDataInput';
import MaterialApprovalQueue from '@/components/dashboard/admin/MaterialApprovalQueue';

const PdfSubmissions = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_submissions')
        .select(`
          *,
          projects(name),
          clients(name),
          studios(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch PDF submissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (submission: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('pdfs')
        .download(submission.object_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download failed",
        description: "Failed to download PDF",
        variant: "destructive"
      });
    }
  };

  const handleMaterialOnboarding = (submission: any) => {
    setSelectedSubmission(submission);
    setActiveTab('material-onboarding');
  };

  const handleImportComplete = () => {
    toast({
      title: "Import completed",
      description: "Materials have been added to the approval queue"
    });
    // Optionally switch back to submissions tab
    setActiveTab('submissions');
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      ready_for_review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading PDF submissions...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PDF Submissions</h1>
        <p className="text-gray-600 mt-1">
          View and download PDF documents uploaded by studios, extract materials for onboarding, and manage material approvals
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions">PDF Submissions</TabsTrigger>
          <TabsTrigger value="material-onboarding" disabled={!selectedSubmission}>
            Material Onboarding
            {selectedSubmission && (
              <Badge variant="secondary" className="ml-2">
                {selectedSubmission.studios?.name}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approval-queue">Material Approval Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4 mt-6">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No PDF submissions found</p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {submission.file_name}
                      </CardTitle>
                      <CardDescription>
                        Uploaded by {submission.studios?.name} on{' '}
                        {format(new Date(submission.created_at), 'PPP')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Project</p>
                      <p className="text-sm text-gray-600">
                        {submission.projects?.name || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Client</p>
                      <p className="text-sm text-gray-600">
                        {submission.clients?.name || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">File Size</p>
                      <p className="text-sm text-gray-600">
                        {submission.file_size ? `${Math.round(submission.file_size / 1024)} KB` : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {submission.notes && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Notes</p>
                      <p className="text-sm text-gray-600">{submission.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => downloadPdf(submission)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      onClick={() => handleMaterialOnboarding(submission)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Material Onboarding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="material-onboarding" className="mt-6">
          {selectedSubmission ? (
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">PDF Selected for Material Onboarding</CardTitle>
                  <CardDescription className="text-green-700">
                    Pre-selected information from the PDF submission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-green-800">Studio</p>
                      <p className="text-sm text-green-700">{selectedSubmission.studios?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Project</p>
                      <p className="text-sm text-green-700">
                        {selectedSubmission.projects?.name || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Client</p>
                      <p className="text-sm text-green-700">
                        {selectedSubmission.clients?.name || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <PdfJSONDataInput
                studioId={selectedSubmission.studio_id}
                submissionId={selectedSubmission.id}
                projectId={selectedSubmission.project_id}
                clientId={selectedSubmission.client_id}
                onImportComplete={handleImportComplete}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a PDF submission first to start material onboarding</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approval-queue" className="mt-6">
          <MaterialApprovalQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PdfSubmissions;
