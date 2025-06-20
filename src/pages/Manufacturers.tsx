
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, Edit, Building, Mail, Phone, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddManufacturerForm from '@/components/forms/AddManufacturerForm';
import EditManufacturerForm from '@/components/forms/EditManufacturerForm';

const Manufacturers = () => {
  const { studioId } = useAuth();
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');

  useEffect(() => {
    if (studioId) {
      fetchManufacturers();
    }
  }, [studioId]);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('manufacturers')
        .select(`
          *,
          materials(id, name, updated_at)
        `)
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setManufacturers(data || []);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedManufacturers = manufacturers
    .filter(manufacturer =>
      manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'most_materials') {
        const aMaterialCount = a.materials?.length || 0;
        const bMaterialCount = b.materials?.length || 0;
        return bMaterialCount - aMaterialCount;
      } else if (sortBy === 'newest_first') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'last_updated') {
        // Get the most recent material update for each manufacturer
        const aLastUpdate = a.materials?.reduce((latest: string, material: any) => {
          return material.updated_at > latest ? material.updated_at : latest;
        }, a.updated_at) || a.updated_at;
        
        const bLastUpdate = b.materials?.reduce((latest: string, material: any) => {
          return material.updated_at > latest ? material.updated_at : latest;
        }, b.updated_at) || b.updated_at;
        
        return new Date(bLastUpdate).getTime() - new Date(aLastUpdate).getTime();
      }
      // Default alphabetical sorting
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

  if (loading) {
    return <div className="p-6">Loading manufacturers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manufacturers</h1>
        <AddManufacturerForm onManufacturerAdded={fetchManufacturers} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Manufacturers</CardTitle>
              <CardDescription>Manage your manufacturer contacts</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="most_materials">Most Materials</SelectItem>
                  <SelectItem value="newest_first">Newest First</SelectItem>
                  <SelectItem value="last_updated">Last Updated</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search manufacturers..."
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
            {filteredAndSortedManufacturers.map((manufacturer) => {
              const materialCount = manufacturer.materials?.length || 0;
              return (
                <div key={manufacturer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-coral-100 rounded-lg">
                      <Building className="h-6 w-6 text-coral-600" />
                    </div>
                    <div className="flex-1">
                      <Link to={`/manufacturers/${manufacturer.id}`} className="hover:text-coral">
                        <h3 className="font-semibold text-lg">{manufacturer.name}</h3>
                      </Link>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {manufacturer.contact_name && (
                          <span>Contact: {manufacturer.contact_name}</span>
                        )}
                        <span>{materialCount} material{materialCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        {manufacturer.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{manufacturer.email}</span>
                          </div>
                        )}
                        {manufacturer.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{manufacturer.phone}</span>
                          </div>
                        )}
                        {manufacturer.website && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Globe className="h-3 w-3" />
                            <a href={manufacturer.website} target="_blank" rel="noopener noreferrer" className="hover:text-coral">
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                      {manufacturer.notes && (
                        <p className="text-sm text-gray-600 mt-1">{manufacturer.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditManufacturerForm manufacturer={manufacturer} onManufacturerUpdated={fetchManufacturers} />
                  </div>
                </div>
              );
            })}
            {filteredAndSortedManufacturers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No manufacturers found matching your search.' : 'No manufacturers yet. Add your first manufacturer!'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Manufacturers;
