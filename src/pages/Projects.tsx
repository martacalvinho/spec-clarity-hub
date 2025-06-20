
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, FolderOpen, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import AddProjectForm from '@/components/forms/AddProjectForm';
import EditProjectForm from '@/components/forms/EditProjectForm';

const Projects = () => {
  const { studioId } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('alphabetical');

  useEffect(() => {
    if (studioId) {
      fetchProjects();
    }
  }, [studioId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients(name),
          proj_materials(id, material_id, materials(name))
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesType = typeFilter === 'all' || project.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest_first') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'last_updated') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      } else if (sortBy === 'start_date') {
        const aDate = a.start_date ? new Date(a.start_date) : new Date(0);
        const bDate = b.start_date ? new Date(b.start_date) : new Date(0);
        return bDate.getTime() - aDate.getTime();
      }
      // Default alphabetical sorting
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return 'bg-green-50 text-green-600';
      case 'commercial': return 'bg-blue-50 text-blue-600';
      case 'hospitality': return 'bg-purple-50 text-purple-600';
      case 'retail': return 'bg-orange-50 text-orange-600';
      case 'other': return 'bg-gray-50 text-gray-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  if (loading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <AddProjectForm onProjectAdded={fetchProjects} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Projects</CardTitle>
              <CardDescription>Manage your interior design projects</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="newest_first">Newest First</SelectItem>
                  <SelectItem value="last_updated">Last Updated</SelectItem>
                  <SelectItem value="start_date">Start Date</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
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
            {filteredAndSortedProjects.map((project) => {
              const materialCount = project.proj_materials?.length || 0;
              return (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-coral-100 rounded-lg">
                      <FolderOpen className="h-6 w-6 text-coral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/projects/${project.id}`} className="hover:text-coral">
                        <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getTypeColor(project.type)}>
                          {project.type}
                        </Badge>
                        {project.clients && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <User className="h-3 w-3" />
                            <Link 
                              to={`/clients/${project.client_id}`}
                              className="hover:text-coral hover:underline"
                            >
                              {project.clients.name}
                            </Link>
                          </div>
                        )}
                        {materialCount > 0 && (
                          <span className="text-sm text-gray-500">
                            {materialCount} material{materialCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {project.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Start: {format(new Date(project.start_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                        {project.end_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>End: {format(new Date(project.end_date), 'MMM dd, yyyy')}</span>
                          </div>
                        )}
                      </div>
                      {project.notes && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{project.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditProjectForm project={project} onProjectUpdated={fetchProjects} />
                  </div>
                </div>
              );
            })}
            {filteredAndSortedProjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No projects found matching your filters.' 
                  : 'No projects yet. Create your first project!'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;
