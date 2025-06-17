
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import AddProjectForm from '@/components/forms/AddProjectForm';
import EditProjectForm from '@/components/forms/EditProjectForm';
import ProjectFilters from '@/components/ProjectFilters';

const Projects = () => {
  const { studioId } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    client: 'all',
    status: 'all',
    year: 'all',
    dateType: 'start'
  });

  useEffect(() => {
    if (studioId) {
      fetchProjects();
      fetchClients();
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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('studio_id', studioId)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const getProjectYear = (project: any, dateType: string) => {
    const dateField = dateType === 'start' ? project.start_date : project.end_date;
    return dateField ? new Date(dateField).getFullYear().toString() : null;
  };

  const filteredProjects = projects.filter(project => {
    // Search filter
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filters.type !== 'all' && project.type !== filters.type) {
      return false;
    }

    // Client filter
    if (filters.client !== 'all' && project.client_id !== filters.client) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all' && project.status !== filters.status) {
      return false;
    }

    // Year filter
    if (filters.year !== 'all') {
      const projectYear = getProjectYear(project, filters.dateType);
      if (projectYear !== filters.year) {
        return false;
      }
    }

    return true;
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
          </div>
          <ProjectFilters 
            onFiltersChange={setFilters}
            clients={clients}
          />
        </CardHeader>
        <CardContent>
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <EditProjectForm project={project} onProjectUpdated={fetchProjects} />
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {filters.search || filters.type !== 'all' || filters.client !== 'all' || filters.status !== 'all' || filters.year !== 'all' 
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
