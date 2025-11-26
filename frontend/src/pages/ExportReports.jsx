import { useState } from 'react';
import { exportAPI, projectAPI } from '../services/api';
import toast from 'react-hot-toast';

const ExportReports = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const handleExportProject = async () => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }
    try {
      setLoading(true);
      const response = await exportAPI.exportProject(selectedProject);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${selectedProject}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Project report exported successfully');
    } catch (error) {
      toast.error('Failed to export project report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportRevenueCosts = async () => {
    try {
      setLoading(true);
      const response = await exportAPI.exportRevenueCosts(dateRange);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue_costs_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Revenue vs Costs report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBillingCollections = async () => {
    try {
      setLoading(true);
      const response = await exportAPI.exportBillingCollections();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `billing_collections_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Billing & Collections report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummary = async () => {
    try {
      setLoading(true);
      const response = await exportAPI.exportSummary();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_summary_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('System summary exported successfully');
    } catch (error) {
      toast.error('Failed to export summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Export Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Report */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Project Report</h2>
          <p className="text-sm text-gray-600 mb-4">
            Export detailed report for a specific project including revenue, expenses, billing, and collections.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Project
              </label>
              <input
                type="text"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="input-field"
                placeholder="Enter Project ID"
              />
            </div>
            <button
              onClick={handleExportProject}
              disabled={loading || !selectedProject}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Exporting...' : 'Export Project Report'}
            </button>
          </div>
        </div>

        {/* Revenue vs Costs */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Revenue vs Costs</h2>
          <p className="text-sm text-gray-600 mb-4">
            Export revenue and expenses comparison report for a date range.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <button
              onClick={handleExportRevenueCosts}
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? 'Exporting...' : 'Export Revenue vs Costs'}
            </button>
          </div>
        </div>

        {/* Billing & Collections */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Billing & Collections</h2>
          <p className="text-sm text-gray-600 mb-4">
            Export all billing and collection records.
          </p>
          <button
            onClick={handleExportBillingCollections}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export Billing & Collections'}
          </button>
        </div>

        {/* System Summary */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">System Summary</h2>
          <p className="text-sm text-gray-600 mb-4">
            Export complete system overview and statistics.
          </p>
          <button
            onClick={handleExportSummary}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export System Summary'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportReports;

