
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddProjectForm from '@/components/forms/AddProjectForm';
import EditProjectForm from '@/components/forms/EditProjectForm';
import ProjectFilters from '@/components/ProjectFilters';

const Projects = () => {
  const { studioId } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    projectType: '',
    clientId: '',
    status: '',
    filterDate: '',
    dateType: 'either',
  });

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
        .select('*, clients(name)')
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

  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.type.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = !filters.projectType || project.type === filters.projectType;

    // Client filter
    const matchesClient = !filters.clientId || project.client_id === filters.clientId;

    // Status filter
    const matchesStatus = !filters.status || project.status === filters.status;

    // Date filter
    let matchesDate = true;
    if (filters.filterDate) {
      const filterDate = new Date(filters.filterDate);
      const startDate = project.start_date ? new Date(project.start_date) : null;
      const endDate = project.end_date ? new Date(project.end_date) : null;

      if (filters.dateType === 'start') {
        matchesDate = startDate && startDate.toDateString() === filterDate.toDateString();
      } else if (filters.dateType === 'end') {
        matchesDate = endDate && endDate.toDateString() === filterDate.toDateString();
      } else { // either
        matchesDate = (startDate && startDate.toDateString() === filterDate.toDateString()) ||
                     (endDate && endDate.toDateString() === filterDate.toDateString());
      }
    }

    return matchesSearch && matchesType && matchesClient && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
              <CardDescription>Manage your design projects</CardDescription>
            </div>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <ProjectFilters onFiltersChange={setFilters} />
          
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <Link to={`/projects/${project.id}`} className="hover:text-coral">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                  </Link>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-500">Type: {project.type}</span>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    {project.clients && (
                      <span className="text-sm text-gray-500">Client: {project.clients.name}</span>
                    )}
                    {project.start_date && (
                      <span className="text-sm text-gray-500">Start: {new Date(project.start_date).toLocaleDateString()}</span>
                    )}
                    {project.end_date && (
                      <span className="text-sm text-gray-500">End: {new Date(project.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EditProjectForm project={project} onProjectUpdated={fetchProjects} />
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || filters.projectType || filters.clientId || filters.status || filters.filterDate
                  ? 'No projects found matching your filters.' 
                  : 'No projects yet. Create your first project!'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;
