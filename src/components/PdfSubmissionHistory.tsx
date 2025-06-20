import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const PdfSubmissionHistory = () => {
  const { studioId } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (studioId) {
      fetchSubmissions();
    }
  }, [studioId]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_submissions')
        .select(`
          *,
          projects(name),
          clients(name)
        `)
        .eq('studio_id', studioId)
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

  const handleDeletePdf = async (submission: any) => {
    if (!confirm(`Are you sure you want to delete "${submission.file_name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(submission.id);
    try {
      console.log('Deleting submission:', submission.id, 'with path:', submission.object_path);
      
      // First delete the file from storage if it exists
      if (submission.object_path) {
        console.log('Attempting to delete file from storage:', submission.object_path);
        const { error: storageError } = await supabase.storage
          .from('pdfs')
          .remove([submission.object_path]);
        
        if (storageError) {
          console.warn('Could not delete file from storage:', storageError);
          // Continue with deletion even if storage fails
        } else {
          console.log('File deleted from storage successfully');
        }
      }

      // Delete extracted materials associated with this submission
      console.log('Deleting extracted materials for submission:', submission.id);
      const { error: materialsError } = await supabase
        .from('extracted_materials')
        .delete()
        .eq('submission_id', submission.id);

      if (materialsError) {
        console.warn('Could not delete extracted materials:', materialsError);
        // Continue with deletion
      }

      // Delete the submission record
      console.log('Deleting submission record:', submission.id);
      const { error } = await supabase
        .from('pdf_submissions')
        .delete()
        .eq('id', submission.id)
        .eq('studio_id', studioId); // Extra safety check

      if (error) throw error;

      console.log('Submission deleted successfully');
      toast({
        title: "Success",
        description: "PDF submission deleted successfully"
      });

      // Refresh the list
      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting PDF:', error);
      toast({
        title: "Error",
        description: `Failed to delete PDF submission: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'ready_for_review':
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      ready_for_review: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
      pending: 'Pending',
      processing: 'Processing',
      ready_for_review: 'Ready for Review',
      completed: 'Approved',
      rejected: 'Rejected'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          Loading submission history...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Submission History
        </CardTitle>
        <CardDescription>
          Track the status of your submitted PDF documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No PDF submissions found</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(submission.status)}
                    <h3 className="font-medium">{submission.file_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(submission.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePdf(submission)}
                      disabled={deleting === submission.id}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      {deleting === submission.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Submitted: {format(new Date(submission.created_at), 'PPP')}</p>
                  {submission.projects?.name && (
                    <p>Project: {submission.projects.name}</p>
                  )}
                  {submission.clients?.name && (
                    <p>Client: {submission.clients.name}</p>
                  )}
                  {submission.notes && (
                    <p>Notes: {submission.notes}</p>
                  )}
                  {submission.processed_at && (
                    <p>Processed: {format(new Date(submission.processed_at), 'PPP')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PdfSubmissionHistory;
