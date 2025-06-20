import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddProjectForm from '@/components/forms/AddProjectForm';
import EditProjectForm from '@/components/forms/EditProjectForm';

const Projects = () => {
  const { studioId } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest_first');

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
        .order('created_at', { ascending: false }); // Changed from created_at to name for alphabetical sorting

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
      if (filterBy === 'all') return matchesSearch;
      return matchesSearch && project.status === filterBy;
    })
    .sort((a, b) => {
      if (sortBy === 'newest_first') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'most_materials') {
        const aMaterialCount = a.proj_materials?.length || 0;
        const bMaterialCount = b.proj_materials?.length || 0;
        return bMaterialCount - aMaterialCount;
      }
      // Default alphabetical sorting
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'planning': return 'bg-purple-100 text-purple-700';
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
              <CardDescription>Manage your project portfolio</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest_first">Newest First</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="most_materials">Most Materials</SelectItem>
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
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-coral-100 rounded-lg">
                      <FolderOpen className="h-6 w-6 text-coral-600" />
                    </div>
                    <div className="flex-1">
                      <Link to={`/projects/${project.id}`} className="hover:text-coral">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                      </Link>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {project.type} • {project.clients?.name || 'No client assigned'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {materialCount} material{materialCount !== 1 ? 's' : ''}
                        </span>
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
            {filteredAndSortedProjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No projects found matching your search.' : 'No projects yet. Create your first project!'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;
