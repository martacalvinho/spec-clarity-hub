
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MaterialPhotoUploadProps {
  materialId: string;
  currentPhotoUrl?: string;
  onPhotoUpdated: (photoUrl: string | null) => void;
}

const MaterialPhotoUpload = ({ materialId, currentPhotoUrl, onPhotoUpdated }: MaterialPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${materialId}-${Math.random()}.${fileExt}`;
      const filePath = `material-photos/${fileName}`;

      // Remove old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('material-photos')
            .remove([`material-photos/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('material-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('material-photos')
        .getPublicUrl(filePath);

      // Update material with photo URL
      const { error: updateError } = await supabase
        .from('materials')
        .update({ photo_url: publicUrl })
        .eq('id', materialId);

      if (updateError) {
        throw updateError;
      }

      onPhotoUpdated(publicUrl);
      toast({
        title: "Success",
        description: "Material photo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);

      if (currentPhotoUrl) {
        const path = currentPhotoUrl.split('/').pop();
        if (path) {
          await supabase.storage
            .from('material-photos')
            .remove([`material-photos/${path}`]);
        }
      }

      const { error } = await supabase
        .from('materials')
        .update({ photo_url: null })
        .eq('id', materialId);

      if (error) throw error;

      onPhotoUpdated(null);
      toast({
        title: "Success",
        description: "Material photo removed successfully",
      });
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Error",
        description: "Failed to remove photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentPhotoUrl ? (
        <div className="flex items-center gap-2">
          <img 
            src={currentPhotoUrl} 
            alt="Material" 
            className="w-12 h-12 object-cover rounded border"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemovePhoto}
            disabled={uploading}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
          <Camera className="h-5 w-5 text-gray-400" />
        </div>
      )}
      
      <div className="relative">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          className="pointer-events-none"
        >
          <Upload className="h-4 w-4 mr-1" />
          {uploading ? 'Uploading...' : currentPhotoUrl ? 'Change' : 'Add Photo'}
        </Button>
      </div>
    </div>
  );
};

export default MaterialPhotoUpload;
