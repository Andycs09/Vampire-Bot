'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  MapPin,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { governmentCasesService, type GovCase, type GovOfficer, type FarmerDirectoryEntry } from '@/services/governmentCases';

export default function GovernmentDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [cases, setCases] = useState<GovCase[]>([]);
  const [stats, setStats] = useState({ totalCases: 0, pendingReview: 0, approved: 0, rejected: 0, avgResponseTime: '0.0 hours' });
  const [officer, setOfficer] = useState<GovOfficer | null>(null);
  const [directory, setDirectory] = useState<FarmerDirectoryEntry[]>([]);
  const [selectedCase, setSelectedCase] = useState<GovCase | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerDirectoryEntry | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showOfficerLogin, setShowOfficerLogin] = useState(false);
  const [officerForm, setOfficerForm] = useState({ name: '', designation: 'Agricultural Officer', email: '', phone: '', password: '' });

  useEffect(() => {
    const refresh = () => {
      governmentCasesService.initializeMockData();
      setCases(governmentCasesService.getAllCases());
      setStats(governmentCasesService.getStats());
      setOfficer(governmentCasesService.getCurrentOfficer());
      setDirectory(governmentCasesService.getFarmerDirectory());
    };

    refresh();
    window.addEventListener('government-cases-updated', refresh);
    return () => window.removeEventListener('government-cases-updated', refresh);
  }, []);

  const visibleCases = cases.filter((caseItem) => caseItem.status === activeTab);

  const handleApprove = (caseId: string) => {
    governmentCasesService.updateCaseStatus(caseId, 'approved', 'Approved after officer review.');
    const refreshedCases = governmentCasesService.getAllCases();
    setCases(refreshedCases);
    setStats(governmentCasesService.getStats());
  };

  const handleReject = (caseId: string) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      governmentCasesService.updateCaseStatus(caseId, 'rejected', reason);
      const refreshedCases = governmentCasesService.getAllCases();
      setCases(refreshedCases);
      setStats(governmentCasesService.getStats());
    }
  };

  const handleOfficerSignIn = () => {
    if (!officerForm.name || !officerForm.email || !officerForm.password) return;
    const newOfficer = governmentCasesService.registerOfficer({
      name: officerForm.name,
      designation: officerForm.designation,
      phone: officerForm.phone || '+91',
      email: officerForm.email,
      district: 'Mysuru',
      state: 'Karnataka',
      password: officerForm.password,
    });
    setOfficer(newOfficer);
    setShowOfficerLogin(false);
    setOfficerForm({ name: '', designation: 'Agricultural Officer', email: '', phone: '', password: '' });
  };

  const openImageModal = (caseItem: GovCase) => {
    setSelectedCase(caseItem);
    setShowImageModal(true);
  };

  const openContactModal = (caseItem: GovCase) => {
    setSelectedCase(caseItem);
    setShowContactModal(true);
  };

  const getCaseImage = (caseItem: GovCase) => {
    if (caseItem.imageUrl) return caseItem.imageUrl;
    const farmer = directory.find((entry) => entry.id === caseItem.farmerId);
    const recentLandPhoto = farmer?.lands?.find((land: any) => land.imageUrl || land.photoUrl)?.imageUrl || farmer?.lands?.find((land: any) => land.imageUrl || land.photoUrl)?.photoUrl;
    return recentLandPhoto || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop';
  };

  const getImageLabel = (caseItem: GovCase) => {
    return caseItem.imageUrl ? 'Case photo' : 'Most recent land photo on file.';
  };

  const getCaseAddress = (caseItem: GovCase) => {
    const farmer = directory.find((entry) => entry.id === caseItem.farmerId);
    return [
      farmer?.village || caseItem.farmerLocation.village,
      farmer?.district || caseItem.farmerLocation.district,
      farmer?.state || caseItem.farmerLocation.state,
    ].filter(Boolean).join(', ');
  };

  const getCaseCoordinates = (caseItem: GovCase) => {
    if (caseItem.farmerLocation.coordinates) {
      return `${caseItem.farmerLocation.coordinates.lat.toFixed(4)}, ${caseItem.farmerLocation.coordinates.lng.toFixed(4)}`;
    }
    const farmer = directory.find((entry) => entry.id === caseItem.farmerId);
    const firstLand = farmer?.lands?.[0];
    if (firstLand?.coordinates?.[0]) {
      return `${firstLand.coordinates[0].lat?.toFixed(4) || 'N/A'}, ${firstLand.coordinates[0].lng?.toFixed(4) || 'N/A'}`;
    }
    return 'Coordinates not available';
  };

  const CaseCard = ({ caseItem, onApprove, onReject }: any) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{caseItem.farmerName}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {`${caseItem.farmerLocation.village}, ${caseItem.farmerLocation.district}, ${caseItem.farmerLocation.state}`}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              caseItem.severity === 'high' ? 'bg-red-100 text-red-800' :
              caseItem.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {caseItem.severity} priority
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(caseItem.submittedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${caseItem.caseType === 'farmer_reported' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
            {caseItem.caseType === 'farmer_reported' ? 'Farmer Reported' : 'AI Flagged — Low Confidence'}
          </span>
          {caseItem.aiDiagnosis?.confidence && caseItem.aiDiagnosis.confidence < 70 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Low Confidence
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Crop Type:</span>
            <p className="text-gray-900">{caseItem.cropType || 'N/A'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">AI Diagnosis:</span>
            <p className="text-gray-900">{caseItem.aiDiagnosis?.disease || 'Farmer request for manual review'}</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Issue Summary</h4>
          <p className="text-blue-800 text-sm">{caseItem.issueDescription}</p>
          {caseItem.aiDiagnosis && (
            <div className="flex items-center mt-2 text-sm text-blue-700">
              <span>Confidence: {caseItem.aiDiagnosis.confidence}%</span>
              {caseItem.aiDiagnosis.confidence < 70 && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  Review Required
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" size="sm" className="flex items-center space-x-1" onClick={() => openImageModal(caseItem)}>
            <Eye className="w-4 h-4" />
            <span>View Image</span>
          </Button>

          <Button variant="outline" size="sm" className="flex items-center space-x-1" onClick={() => openContactModal(caseItem)}>
            <MessageSquare className="w-4 h-4" />
            <span>Contact Farmer</span>
          </Button>

          <div className="flex space-x-2 ml-auto">
            <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => onReject(caseItem.id)}>
              <ThumbsDown className="w-4 h-4 mr-1" />
              Reject
            </Button>

            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => onApprove(caseItem.id)}>
              <ThumbsUp className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Government Portal</h1>
                <p className="text-sm text-gray-600">Agricultural Extension Services</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{officer?.name || 'Government Officer'}</p>
                <p className="text-xs text-gray-600">{officer?.designation || 'Agricultural Officer'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!officer && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-blue-900">Officer sign-in is required for review actions.</p>
                <p className="text-sm text-blue-700">Add your name and designation to continue.</p>
              </div>
              <Button variant="outline" onClick={() => setShowOfficerLogin((value) => !value)}>
                {showOfficerLogin ? 'Hide Officer Form' : 'Sign In as Officer'}
              </Button>
            </CardContent>
          </Card>
        )}

        {showOfficerLogin && (
          <Card className="mb-6">
            <CardContent className="p-4 grid gap-3 md:grid-cols-2">
              <Input placeholder="Officer name" value={officerForm.name} onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })} />
              <Input placeholder="Designation" value={officerForm.designation} onChange={(e) => setOfficerForm({ ...officerForm, designation: e.target.value })} />
              <Input placeholder="Email" value={officerForm.email} onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })} />
              <Input placeholder="Phone" value={officerForm.phone} onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })} />
              <Input type="password" placeholder="Password" value={officerForm.password} onChange={(e) => setOfficerForm({ ...officerForm, password: e.target.value })} className="md:col-span-2" />
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={handleOfficerSignIn}>Save officer profile</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Dashboard 🏛️</h1>
            <p className="text-gray-600">Review AI-generated agricultural recommendations and provide expert guidance to farmers</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cases</p>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCases}</div>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingReview}</div>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response</p>
                  <div className="text-2xl font-bold text-purple-600">{stats.avgResponseTime}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span>AI Case Reviews</span>
                </CardTitle>
                <CardDescription>Review cases where AI confidence is below 70% or farmer requested manual review</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex space-x-4 mb-6 border-b">
                  {[
                    { key: 'pending', label: 'Pending', count: stats.pendingReview },
                    { key: 'approved', label: 'Approved', count: stats.approved },
                    { key: 'rejected', label: 'Rejected', count: stats.rejected },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {visibleCases.length > 0 ? (
                    visibleCases.map((caseItem) => (
                      <CaseCard key={caseItem.id} caseItem={caseItem} onApprove={handleApprove} onReject={handleReject} />
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No cases in this tab yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowDirectoryModal(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Farmer Directory
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {cases.slice(0, 3).map((caseItem) => (
                    <div key={caseItem.id} className="flex items-start space-x-3">
                      {caseItem.status === 'approved' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      ) : caseItem.status === 'rejected' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">{caseItem.farmerName}</p>
                        <p className="text-gray-600">{caseItem.cropType || 'Field issue'}</p>
                        <p className="text-xs text-gray-500">{new Date(caseItem.submittedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showImageModal && selectedCase && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">Case Image</h3>
                  <p className="text-sm text-gray-600">{getImageLabel(selectedCase)}</p>
                </div>
                <Button variant="outline" onClick={() => setShowImageModal(false)}>Close</Button>
              </div>
              <img src={getCaseImage(selectedCase)} alt="case visual" className="w-full h-64 object-cover rounded-lg" />
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="font-medium text-gray-700">Coordinates</p>
                  <p className="text-gray-600">{getCaseCoordinates(selectedCase)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="font-medium text-gray-700">Address</p>
                  <p className="text-gray-600">{getCaseAddress(selectedCase)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showContactModal && selectedCase && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">Contact Farmer</h3>
                  <p className="text-sm text-gray-600">Call or copy the registered contact number</p>
                </div>
                <Button variant="outline" onClick={() => setShowContactModal(false)}>Close</Button>
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700">Phone Number</p>
                <p className="text-xl font-semibold text-blue-900">{selectedCase.farmerPhone}</p>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => window.open(`tel:${selectedCase.farmerPhone}`, '_self')}>
                  Call
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => navigator.clipboard.writeText(selectedCase.farmerPhone)}>
                  Copy Number
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDirectoryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-auto">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">Farmer Directory</h3>
                  <p className="text-sm text-gray-600">Registered farmers and their land parcels</p>
                </div>
                <Button variant="outline" onClick={() => setShowDirectoryModal(false)}>Close</Button>
              </div>
              <div className="space-y-3">
                {directory.map((farmer) => (
                  <button key={farmer.id} className="w-full rounded-lg border p-4 text-left hover:bg-gray-50" onClick={() => setSelectedFarmer(farmer)}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{farmer.name}</p>
                        <p className="text-sm text-gray-600">{farmer.phone}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>{farmer.village}, {farmer.district}</p>
                        <p>{farmer.state}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Land parcels: {farmer.landCount}</p>
                  </button>
                ))}
              </div>
              {selectedFarmer && (
                <div className="rounded-lg border p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">{selectedFarmer.name}</h4>
                  <p className="text-sm text-gray-600">{selectedFarmer.phone}</p>
                  <p className="text-sm text-gray-600">{selectedFarmer.village}, {selectedFarmer.district}, {selectedFarmer.state}</p>
                  <div className="mt-3 space-y-2">
                    {selectedFarmer.lands?.length ? selectedFarmer.lands.map((land: any, index: number) => (
                      <div key={`${selectedFarmer.id}-${index}`} className="rounded border bg-white p-2">
                        <p className="font-medium">Parcel {index + 1}</p>
                        <p className="text-sm text-gray-600">Size: {land.size || 'N/A'} {land.unit || 'acres'}</p>
                        <p className="text-sm text-gray-600">Crop history: {land.cropHistory || land.cropType || 'Not recorded'}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500">No land parcels recorded yet.</p>}
                  </div>
                  <div className="mt-3">
                    <p className="font-medium">Case history</p>
                    {selectedFarmer.cases?.length ? selectedFarmer.cases.map((caseItem) => (
                      <p key={caseItem.id} className="text-sm text-gray-600">• {caseItem.issueDescription}</p>
                    )) : <p className="text-sm text-gray-500">No government cases yet.</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
