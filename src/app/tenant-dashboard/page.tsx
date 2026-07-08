'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Leaf, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Phone, 
  Filter,
  Search,
  Star,
  Clock,
  Briefcase,
  LogOut,
  User,
  Edit
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface FarmingJob {
  id: string;
  landownerName: string;
  landownerPhoto: string;
  location: {
    state: string;
    district: string;
    village: string;
    coordinates: { lat: number; lng: number };
  };
  distanceFromUser?: number;
  landSize: number;
  landUnit: string;
  cropPlans: Array<{
    crop: string;
    percentage: number;
    area: number;
  }>;
  jobType: 'full-season' | 'planting' | 'harvesting' | 'maintenance';
  duration: string;
  paymentRate: number;
  paymentType: 'hourly' | 'daily' | 'contract';
  requirements: string[];
  description: string;
  postedDate: Date;
  urgency: 'low' | 'medium' | 'high';
  landownerRating: number;
  landownerPhone: string;
  preferredExperience: string[];
}

interface UserProfile {
  name: string;
  phone: string;
  age: number;
  state: string;
  district: string;
  village: string;
  hourlyRate: number;
  cropSpecialization: string;
  profileImage: string;
  coverImage: string;
  description: string;
  coordinates: { lat: number; lng: number };
}

export default function TenantDashboard() {
  const [jobs, setJobs] = useState<FarmingJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<FarmingJob[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  const router = useRouter();

  // Farmer photos from Unsplash
  const farmerPhotos = [
    'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1531384370597-8590413be50c?w=150&h=150&fit=crop&crop=face'
  ];

  // Location coordinates for cities within 200km
  const nearbyLocations: { [key: string]: { lat: number; lng: number } } = {
    'Bengaluru': { lat: 12.9716, lng: 77.5946 },
    'Mysuru': { lat: 12.2958, lng: 76.6394 },
    'Mandya': { lat: 12.5214, lng: 76.8956 },
    'Hassan': { lat: 13.0072, lng: 76.0962 },
    'Tumakuru': { lat: 13.3379, lng: 77.1137 },
    'Kolar': { lat: 13.1372, lng: 78.1295 },
    'Chikkaballapur': { lat: 13.4355, lng: 77.7315 },
    'Ramanagara': { lat: 12.7207, lng: 77.2792 },
    'Channapatna': { lat: 12.6515, lng: 77.2069 },
    'Hosur': { lat: 12.7409, lng: 77.8253 },
    'Krishnagiri': { lat: 12.5186, lng: 78.2137 },
    'Vellore': { lat: 12.9165, lng: 79.1325 }
  };

  useEffect(() => {
    // Load user data and create enhanced profile
    const userData = localStorage.getItem('user');
    if (userData) {
      const baseUser = JSON.parse(userData);
      const enhancedUser: UserProfile = {
        ...baseUser,
        hourlyRate: baseUser.hourlyRate || 300,
        cropSpecialization: baseUser.cropSpecialization || 'Mixed farming',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        coverImage: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=200&fit=crop',
        description: `Experienced ${baseUser.cropSpecialization || 'mixed'} farmer with ${Math.max(baseUser.age - 20, 5)} years of hands-on experience. Specializing in sustainable farming practices and modern agricultural techniques.`,
        coordinates: nearbyLocations[baseUser.district] || nearbyLocations['Bengaluru']
      };
      setUser(enhancedUser);
    }

    generateMockJobs();
  }, []);

  useEffect(() => {
    // Filter jobs based on search, location (200km radius), and other filters
    let filtered = jobs;

    // Filter by distance (200km radius)
    if (user?.coordinates) {
      filtered = filtered.filter(job => {
        const distance = calculateDistance(
          user.coordinates.lat, 
          user.coordinates.lng,
          job.location.coordinates.lat,
          job.location.coordinates.lng
        );
        job.distanceFromUser = distance;
        return distance <= 200; // 200km radius
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.landownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.cropPlans.some(plan => plan.crop.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterState) {
      filtered = filtered.filter(job => job.location.state === filterState);
    }

    if (filterJobType) {
      filtered = filtered.filter(job => job.jobType === filterJobType);
    }

    // Sort by distance
    filtered.sort((a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0));

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, filterState, filterJobType, user]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const generateMockJobs = () => {
    const cropTypes = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Vegetables', 'Pulses'];
    const jobTypes: ('full-season' | 'planting' | 'harvesting' | 'maintenance')[] = ['full-season', 'planting', 'harvesting', 'maintenance'];
    const names = ['Rajesh Kumar', 'Priya Sharma', 'Mohan Singh', 'Lakshmi Devi', 'Suresh Reddy', 'Anita Patel', 'Ramesh Gowda', 'Sita Kumari'];

    // Nearby cities for location-based jobs
    const nearbyCities = [
      { name: 'Bengaluru', state: 'Karnataka', coords: nearbyLocations['Bengaluru'] },
      { name: 'Mysuru', state: 'Karnataka', coords: nearbyLocations['Mysuru'] },
      { name: 'Mandya', state: 'Karnataka', coords: nearbyLocations['Mandya'] },
      { name: 'Hassan', state: 'Karnataka', coords: nearbyLocations['Hassan'] },
      { name: 'Tumakuru', state: 'Karnataka', coords: nearbyLocations['Tumakuru'] },
      { name: 'Kolar', state: 'Karnataka', coords: nearbyLocations['Kolar'] },
      { name: 'Hosur', state: 'Tamil Nadu', coords: nearbyLocations['Hosur'] },
      { name: 'Krishnagiri', state: 'Tamil Nadu', coords: nearbyLocations['Krishnagiri'] }
    ];

    const mockJobs: FarmingJob[] = Array.from({ length: 15 }, (_, i) => {
      const location = nearbyCities[Math.floor(Math.random() * nearbyCities.length)];
      const landSize = Math.floor(Math.random() * 10) + 2; // 2-12 acres
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      
      // Create crop plans - mix of crops
      const numCrops = Math.floor(Math.random() * 3) + 1; // 1-3 crops
      const selectedCrops = cropTypes.sort(() => 0.5 - Math.random()).slice(0, numCrops);
      
      let remainingPercentage = 100;
      const cropPlans = selectedCrops.map((crop, index) => {
        const percentage = index === selectedCrops.length - 1 
          ? remainingPercentage 
          : Math.floor(Math.random() * (remainingPercentage - 10)) + 10;
        remainingPercentage -= percentage;
        
        return {
          crop,
          percentage,
          area: (landSize * percentage) / 100
        };
      });

      return {
        id: `job_${i + 1}`,
        landownerName: names[Math.floor(Math.random() * names.length)],
        landownerPhoto: farmerPhotos[i % farmerPhotos.length],
        location: {
          state: location.state,
          district: `${location.name} District`,
          village: `${location.name} Rural`,
          coordinates: location.coords
        },
        landSize,
        landUnit: 'acres',
        cropPlans,
        jobType,
        duration: jobType === 'full-season' ? '4-6 months' : 
                 jobType === 'planting' ? '2-3 weeks' :
                 jobType === 'harvesting' ? '1-2 weeks' : '1-4 weeks',
        paymentRate: Math.floor(Math.random() * 200) + 300, // ₹300-500 per day
        paymentType: 'daily' as const,
        requirements: [
          'Experience with organic farming',
          'Own transportation preferred',
          'Physical fitness required'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        description: `Looking for experienced farmer to help with ${jobType === 'full-season' ? 'complete crop cycle' : jobType} activities. Land is well-irrigated with modern equipment available.`,
        postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
        urgency: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        landownerRating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        landownerPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        preferredExperience: cropPlans.map(plan => plan.crop)
      };
    });

    setJobs(mockJobs);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case 'full-season': return 'Full Season';
      case 'planting': return 'Planting Only';
      case 'harvesting': return 'Harvesting Only';
      case 'maintenance': return 'Maintenance';
      default: return jobType;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Briefcase className="w-8 h-8 text-green-600" />
                <span>Farming Jobs Near You</span>
              </h1>
              <p className="text-gray-600 mt-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Current Location: {user?.village}, {user?.district} - Jobs within 200km radius
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">{user?.name || 'Tenant Farmer'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProfile(true)}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.clear();
                    router.push('/');
                  }}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search jobs, crops, or farmers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">All States</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>

                <select
                  value={filterJobType}
                  onChange={(e) => setFilterJobType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="">All Job Types</option>
                  <option value="full-season">Full Season</option>
                  <option value="planting">Planting</option>
                  <option value="harvesting">Harvesting</option>
                  <option value="maintenance">Maintenance</option>
                </select>

                <Button className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Advanced Filters</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="flex-shrink-0">
                      <img
                        src={job.landownerPhoto}
                        alt={job.landownerName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                            {job.landownerName}
                          </CardTitle>
                          <div className="flex items-center text-gray-600 text-sm mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{job.location.village}, {job.location.district}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-yellow-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="ml-1 text-sm text-gray-600">{job.landownerRating}/5</span>
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              {job.distanceFromUser}km away
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgency)}`}>
                          {job.urgency} priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{Math.floor((Date.now() - job.postedDate.getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Land and Crop Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Leaf className="w-4 h-4 mr-1 text-green-600" />
                      Land & Crops ({job.landSize} {job.landUnit})
                    </h4>
                    <div className="space-y-1">
                      {job.cropPlans.map((plan, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{plan.crop}:</span>
                          <span className="font-medium">{plan.percentage}% ({plan.area.toFixed(1)} acres)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Job Details with Rupees */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Job Type:</span>
                      <span className="font-medium text-blue-600">{getJobTypeLabel(job.jobType)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Duration:</span>
                      <span className="font-medium">{job.duration}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment:</span>
                      <span className="font-semibold text-green-600 text-lg">
                        ₹{job.paymentRate}/{job.paymentType}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
                  </div>

                  {/* Requirements */}
                  {job.requirements.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Requirements:</h5>
                      <div className="flex flex-wrap gap-1">
                        {job.requirements.map((req, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Call Button Only */}
                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
                      onClick={() => window.open(`tel:${job.landownerPhone}`, '_self')}
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call {job.landownerName}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or check back later for new opportunities.</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{filteredJobs.length}</div>
              <div className="text-sm text-gray-600">Available Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{Math.round(filteredJobs.reduce((sum, job) => sum + job.paymentRate, 0) / filteredJobs.length) || 0}
              </div>
              <div className="text-sm text-gray-600">Avg. Daily Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredJobs.filter(job => job.urgency === 'high').length}
              </div>
              <div className="text-sm text-gray-600">Urgent Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(filteredJobs.reduce((sum, job) => sum + job.landSize, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Acres</div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Modal */}
        {showProfile && user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Cover Image */}
              <div 
                className="h-32 bg-cover bg-center relative rounded-t-lg"
                style={{ backgroundImage: `url(${user.coverImage})` }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfile(false)}
                  className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-70"
                >
                  ✕
                </Button>
              </div>
              
              {/* Profile Content */}
              <div className="p-6 relative">
                {/* Profile Picture */}
                <div className="absolute -top-16 left-6">
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                  />
                </div>
                
                <div className="mt-12">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                      <p className="text-gray-600">{user.cropSpecialization}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                    {user.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{user.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{user.village}, {user.district}, {user.state}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>₹{user.hourlyRate}/hour</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{Math.max(user.age - 20, 5)}+</div>
                        <div className="text-xs text-gray-600">Years Experience</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">5.0</div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}