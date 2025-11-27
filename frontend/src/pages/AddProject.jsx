import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import {
  BuildingOfficeIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  UserIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const AddProject = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectCode: '',
    projectName: '',
    description: '',
    clientName: '',
    status: 'pending',
    startDate: '',
    endDate: '',
    budget: '',
    location: '',
    projectManager: '',
    tags: [],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    try {
      setLoading(true);
      const response = await projectAPI.create({
        ...formData,
        budget: parseFloat(formData.budget) || 0,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
      });
      toast.success('Project created successfully');
      navigate(`/projects/${response.data.project._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tag.trim()] });
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const steps = [
    { number: 1, label: 'Basic Info', icon: BuildingOfficeIcon },
    { number: 2, label: 'Description', icon: DocumentTextIcon },
    { number: 3, label: 'Dates & Budget', icon: CalendarIcon },
    { number: 4, label: 'Additional', icon: ClipboardDocumentListIcon },
    { number: 5, label: 'Review', icon: CheckCircleIcon },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
            <BuildingOfficeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Add New Project</h1>
            <p className="text-sm text-gray-500 mt-1">Create a new project with step-by-step wizard</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
        >
          <XMarkIcon className="w-5 h-5" />
          Cancel
        </button>
      </div>

      {/* Enhanced Progress Steps */}
      <div className="card bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between mb-6">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isActive = stepItem.number === step;
            const isCompleted = stepItem.number < step;
            
            return (
              <div key={stepItem.number} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                        : isActive
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg scale-110'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      isActive ? 'text-red-600 font-semibold' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {stepItem.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                      isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Step <span className="font-semibold text-red-600">{step}</span> of {steps.length}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
              <BuildingOfficeIcon className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value.toUpperCase() })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                    placeholder="PROJ-2025-001"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Unique identifier for the project</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                    placeholder="Enter project name"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                  placeholder="Enter client name"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
              <DocumentTextIcon className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-800">Description & Status</h2>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200 resize-none"
                rows="6"
                placeholder="Provide a detailed description of the project..."
              />
              <p className="mt-1 text-xs text-gray-500">Describe the project scope, objectives, and key details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Status <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200 bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Dates & Budget */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
              <CalendarIcon className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-800">Dates & Budget</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Budget
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Enter the total project budget in USD</p>
            </div>
          </div>
        )}

        {/* Step 4: Additional Information */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
              <ClipboardDocumentListIcon className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-800">Additional Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                    placeholder="Enter project location"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Manager
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.projectManager}
                    onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                    placeholder="Enter project manager name"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200"
                    placeholder="Add a tag and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-md"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-200 transition-colors duration-200"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors duration-200 resize-none"
                rows="5"
                placeholder="Enter any additional notes or comments about the project..."
              />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">Review & Confirm</h2>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border-2 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project Code</span>
                  <p className="text-lg font-semibold text-gray-900">{formData.projectCode || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{formData.status}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project Name</span>
                  <p className="text-lg font-semibold text-gray-900">{formData.projectName || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client Name</span>
                  <p className="text-lg font-semibold text-gray-900">{formData.clientName || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</span>
                  <p className="text-lg font-semibold text-green-600">
                    {formData.budget ? formatCurrency(parseFloat(formData.budget)) : formatCurrency(0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Date</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Date</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'N/A'}
                  </p>
                </div>
                {formData.location && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</span>
                    <p className="text-lg font-semibold text-gray-900">{formData.location}</p>
                  </div>
                )}
                {formData.projectManager && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project Manager</span>
                    <p className="text-lg font-semibold text-gray-900">{formData.projectManager}</p>
                  </div>
                )}
                {formData.description && (
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</span>
                    <p className="text-base text-gray-700 leading-relaxed">{formData.description}</p>
                  </div>
                )}
                {formData.tags.length > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Please review all information carefully before creating the project. You can go back to any step to make changes.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              step === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Previous
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800'
            }`}
          >
            {step === 5 ? (
              loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Create Project
                </>
              )
            ) : (
              <>
                Next
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProject;

