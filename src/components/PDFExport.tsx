
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download } from 'lucide-react';

interface PDFExportProps {
  type?: 'materials' | 'manufacturers' | 'projects' | 'general';
  entityId?: string;
  entityName?: string;
}

const PDFExport = ({ type = 'general', entityId, entityName }: PDFExportProps) => {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState('');
  const [loading, setLoading] = useState(false);
  const { studioId } = useAuth();
  const { toast } = useToast();

  const exportOptions = {
    general: [
      { value: 'most-materials-used', label: 'Most Materials Used Dashboard' },
      { value: 'manufacturer-summary', label: 'All Manufacturers Summary' },
      { value: 'project-materials-summary', label: 'Projects with Most Materials' },
      { value: 'materials-library', label: 'Complete Materials Library' }
    ],
    materials: [
      { value: 'material-details', label: 'Material Details Report' },
      { value: 'material-usage', label: 'Material Usage Across Projects' }
    ],
    manufacturers: [
      { value: 'manufacturer-details', label: 'Manufacturer Information & Materials' },
      { value: 'manufacturer-pricing', label: 'Manufacturer Pricing Analysis' }
    ],
    projects: [
      { value: 'project-materials', label: 'Project Materials Report' },
      { value: 'project-pricing', label: 'Project Pricing Analysis' }
    ]
  };

  const generatePDF = async () => {
    if (!exportType) {
      toast({
        title: "Please select an export type",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let data;
      let filename = `${exportType}-${new Date().toISOString().split('T')[0]}.pdf`;

      switch (exportType) {
        case 'most-materials-used':
          // Fetch materials with most usage
          const { data: materialsData } = await supabase
            .from('materials')
            .select(`
              name,
              category,
              manufacturers(name),
              proj_materials(count)
            `)
            .eq('studio_id', studioId);
          data = materialsData;
          break;

        case 'manufacturer-details':
          if (entityId) {
            const { data: manufacturerData } = await supabase
              .from('manufacturers')
              .select(`
                *,
                materials(
                  name,
                  category,
                  proj_materials(
                    projects(name, clients(name))
                  )
                )
              `)
              .eq('id', entityId)
              .single();
            data = manufacturerData;
            filename = `${entityName}-manufacturer-report-${new Date().toISOString().split('T')[0]}.pdf`;
          }
          break;

        case 'project-materials':
          if (entityId) {
            const { data: projectData } = await supabase
              .from('proj_materials')
              .select(`
                *,
                materials(
                  name,
                  category,
                  manufacturers(name)
                ),
                projects(name, clients(name))
              `)
              .eq('project_id', entityId);
            data = projectData;
            filename = `${entityName}-materials-report-${new Date().toISOString().split('T')[0]}.pdf`;
          }
          break;

        case 'materials-library':
          const { data: allMaterials } = await supabase
            .from('materials')
            .select(`
              *,
              manufacturers(name),
              proj_materials(
                projects(name, clients(name))
              )
            `)
            .eq('studio_id', studioId);
          data = allMaterials;
          break;

        default:
          throw new Error('Unsupported export type');
      }

      // Generate PDF content
      const pdfContent = generatePDFContent(data, exportType, entityName);
      
      // Create and download PDF
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Export Started",
        description: "Your PDF is being downloaded. You can print this HTML file to PDF or use your browser's print-to-PDF feature.",
      });

      setOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDFContent = (data: any, type: string, entityName?: string) => {
    const currentDate = new Date().toLocaleDateString();
    
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${type} Report - ${currentDate}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .material-item { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-item { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${type.replace('-', ' ').toUpperCase()} REPORT</h1>
          ${entityName ? `<h2>${entityName}</h2>` : ''}
          <p>Generated on: ${currentDate}</p>
        </div>
    `;

    switch (type) {
      case 'materials-library':
        content += `
          <div class="section">
            <h3>Materials Library Overview</h3>
            <p>Total Materials: ${data?.length || 0}</p>
            <table>
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                  <th>Projects Used</th>
                </tr>
              </thead>
              <tbody>
                ${data?.map((material: any) => `
                  <tr>
                    <td>${material.name}</td>
                    <td>${material.category}</td>
                    <td>${material.manufacturers?.name || 'N/A'}</td>
                    <td>${material.proj_materials?.length || 0}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'manufacturer-details':
        content += `
          <div class="section">
            <h3>Manufacturer Information</h3>
            <p><strong>Name:</strong> ${data?.name}</p>
            <p><strong>Materials Count:</strong> ${data?.materials?.length || 0}</p>
            
            <h4>Materials List</h4>
            <table>
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Projects Used</th>
                </tr>
              </thead>
              <tbody>
                ${data?.materials?.map((material: any) => `
                  <tr>
                    <td>${material.name}</td>
                    <td>${material.category}</td>
                    <td>${material.proj_materials?.length || 0}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
        `;
        break;

      default:
        content += `
          <div class="section">
            <h3>Report Data</h3>
            <p>Export type: ${type}</p>
            <p>This is a placeholder for the ${type} report content.</p>
          </div>
        `;
    }

    content += `
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <p><em>Use your browser's print function (Ctrl+P) to save this as a PDF</em></p>
        </div>
      </body>
      </html>
    `;

    return content;
  };

  const currentOptions = exportOptions[type] || exportOptions.general;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export to PDF</DialogTitle>
          <DialogDescription>
            Choose what type of report you'd like to export as PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Report Type</label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type..." />
              </SelectTrigger>
              <SelectContent>
                {currentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={generatePDF} 
              disabled={loading || !exportType}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {loading ? 'Generating...' : 'Export PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFExport;
