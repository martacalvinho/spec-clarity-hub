
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddProjectForm from '@/components/forms/AddProjectForm';
import EditProjectForm from '@/components/forms/EditProjectForm';
import ProjectFilters from '@/components/ProjectFilters';

const Projects = () => {
  const { studioId } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateStartedFilter, setDateStartedFilter] = useState('');

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
          proj_materials(id)
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !typeFilter || typeFilter === 'all' || project.type === typeFilter;

    const matchesDate = !dateStartedFilter || 
      (project.start_date && new Date(project.start_date) >= new Date(dateStartedFilter));

    return matchesSearch && matchesType && matchesDate;
  });

  const clearFilters = () => {
    setTypeFilter('');
    setDateStartedFilter('');
  };

  const hasActiveFilters = (typeFilter && typeFilter !== 'all') || dateStartedFilter;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatProjectType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
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
        <CardContent>
          <ProjectFilters
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            dateStartedFilter={dateStartedFilter}
            setDateStartedFilter={setDateStartedFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const materialCount = project.proj_materials?.length || 0;
              return (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-coral-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-coral-600" />
                    </div>
                    <div className="flex-1">
                      <Link to={`/projects/${project.id}`} className="hover:text-coral">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Client: {project.clients?.name || 'No client assigned'}
                        </span>
                        <span>Type: {formatProjectType(project.type)}</span>
                        <span>{materialCount} material{materialCount !== 1 ? 's' : ''}</span>
                      </div>
                      {project.start_date && (
                        <div className="text-sm text-gray-500 mt-1">
                          Started: {new Date(project.start_date).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {project.notes && (
                        <p className="text-sm text-gray-600 mt-1">{project.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditProjectForm project={project} onProjectUpdated={fetchProjects} />
                  </div>
                </div>
              );
            })}
            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || hasActiveFilters 
                  ? 'No projects found matching your search or filters.' 
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
