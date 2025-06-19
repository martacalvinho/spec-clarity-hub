
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText, Eye, Calendar, Building, FolderOpen, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminPDFSubmissions = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (isAdmin) {
        fetchSubmissions();
      } else {
        setError('Admin access required');
        setLoading(false);
      }
    }
  }, [isAdmin, authLoading]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('pdf_submissions')
        .select(`
          *,
          projects(name, id),
          clients(name, id),
          studios(name, id)
        `)
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
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (submission: any) => {
    try {
      const { data, error } = await supabase.storage
        .from(submission.bucket_id)
        .download(submission.object_path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = submission.file_name;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloaded ${submission.file_name}`,
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pdf_submissions')
        .update({ 
          status: newStatus,
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Submission marked as ${newStatus}`,
      });

      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Admin access required to view PDF submissions.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading PDF submissions: {error}</p>
          <Button onClick={fetchSubmissions} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading PDF submissions...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">PDF Submissions (Admin)</h1>
        <Badge variant="outline">{submissions.length} submissions</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All PDF Submissions</CardTitle>
          <CardDescription>
            Manage PDF submissions from all studios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg">{submission.file_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {submission.studios?.name || 'Unknown Studio'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(submission.created_at).toLocaleDateString()}
                          </span>
                          <span>{(submission.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      {submission.projects && (
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Project:</span>
                          <span>{submission.projects.name}</span>
                        </div>
                      )}
                      {submission.clients && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">Client:</span>
                          <span>{submission.clients.name}</span>
                        </div>
                      )}
                    </div>

                    {submission.notes && (
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <span className="font-medium text-sm">Notes:</span>
                        <p className="text-sm text-gray-600 mt-1">{submission.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                      {submission.processed_at && (
                        <span className="text-xs text-gray-500">
                          Processed {new Date(submission.processed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPDF(submission)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>

                    {submission.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateSubmissionStatus(submission.id, 'processing')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Processing
                      </Button>
                    )}

                    {submission.status === 'processing' && (
                      <Button
                        size="sm"
                        onClick={() => updateSubmissionStatus(submission.id, 'ready_for_review')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Ready
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {submissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No PDF submissions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPDFSubmissions;
