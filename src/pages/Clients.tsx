import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddClientForm from '@/components/forms/AddClientForm';
import EditClientForm from '@/components/forms/EditClientForm';

const Clients = () => {
  const { studioId } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest_first');

  useEffect(() => {
    if (studioId) {
      fetchClients();
    }
  }, [studioId]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          projects(id, name, status)
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (filterBy === 'all') return matchesSearch;
      return matchesSearch && client.status === filterBy;
    })
    .sort((a, b) => {
      if (sortBy === 'newest_first') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'most_projects') {
        const aProjectCount = a.projects?.length || 0;
        const bProjectCount = b.projects?.length || 0;
        return bProjectCount - aProjectCount;
      }
      // Default alphabetical sorting
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'prospect': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="p-6">Loading clients...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <AddClientForm onClientAdded={fetchClients} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Clients</CardTitle>
              <CardDescription>Manage your client relationships</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest_first">Newest First</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="most_projects">Most Projects</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAndSortedClients.map((client) => {
              const projectCount = client.projects?.length || 0;
              const activeProjects = client.projects?.filter((p: any) => p.status === 'active').length || 0;
              return (
                <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-coral-100 rounded-lg">
                      <Users className="h-6 w-6 text-coral-600" />
                    </div>
                    <div className="flex-1">
                      <Link to={`/clients/${client.id}`} className="hover:text-coral">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                      </Link>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {projectCount} project{projectCount !== 1 ? 's' : ''} 
                          {activeProjects > 0 && ` (${activeProjects} active)`}
                        </span>
                      </div>
                      {client.notes && (
                        <p className="text-sm text-gray-600 mt-1">{client.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditClientForm client={client} onClientUpdated={fetchClients} />
                  </div>
                </div>
              );
            })}
            {filteredAndSortedClients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No clients found matching your search.' : 'No clients yet. Add your first client!'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
