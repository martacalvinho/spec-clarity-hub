
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  studio_id: z.string().min(1, 'Please select a studio'),
});

interface AssignStudioFormProps {
  user: any;
  onUserUpdated: () => void;
}

const AssignStudioForm = ({ user, onUserUpdated }: AssignStudioFormProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studios, setStudios] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studio_id: user.studio_id || '',
    },
  });

  const fetchStudios = async () => {
    try {
      const { data, error } = await supabase
        .from('studios')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setStudios(data || []);
    } catch (error) {
      console.error('Error fetching studios:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update({ studio_id: values.studio_id })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Studio assignment updated successfully",
      });

      setOpen(false);
      onUserUpdated();
    } catch (error) {
      console.error('Error updating user studio:', error);
      toast({
        title: "Error",
        description: "Failed to update studio assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchStudios();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Assign Studio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Studio to {user.first_name} {user.last_name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Studio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a studio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {studios.map((studio) => (
                        <SelectItem key={studio.id} value={studio.id}>
                          {studio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Assignment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignStudioForm;
