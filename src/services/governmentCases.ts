// Government Cases Service - unified case storage for AI flagged and farmer-reported escalations

export interface GovCase {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerLocation: {
    village: string;
    district: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  landId?: string;
  cropType?: string;
  issueDescription: string;
  imageUrl?: string;
  aiDiagnosis?: {
    disease: string;
    confidence: number;
    recommendation: string;
  };
  caseType: 'farmer_reported' | 'ai_flagged';
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerNotes?: string;
  priority: number;
}

export interface GovOfficer {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  district: string;
  state: string;
  password?: string;
}

export interface FarmerDirectoryEntry {
  id: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  landCount: number;
  cases: GovCase[];
  lands: any[];
}

class GovernmentCasesService {
  private CASES_KEY = 'government_cases';
  private OFFICERS_KEY = 'government_officers';
  private CURRENT_OFFICER_KEY = 'government_current_officer';
  private USERS_KEY = 'registered_users';

  private buildSeedCase(index: number, status: 'pending' | 'approved' | 'rejected'): GovCase {
    const names = [
      'Ram Kumar', 'Anand Reddy', 'Suresh Patel', 'Priya Sharma', 'Lakshmi Devi',
      'Manoj Verma', 'Kiran Rao', 'Naveen Gowda', 'Arjun Singh', 'Meena Das'
    ];
    const villages = ['Kothur', 'Adoni', 'Bharuch', 'Meerut', 'Hosur', 'Tumakuru', 'Nashik', 'Jalgaon', 'Siliguri', 'Cuttack'];
    const districts = ['Mysuru', 'Kurnool', 'Bharuch', 'Meerut', 'Krishnagiri', 'Tumakuru', 'Nashik', 'Jalgaon', 'Darjeeling', 'Cuttack'];
    const states = ['Karnataka', 'Andhra Pradesh', 'Gujarat', 'Uttar Pradesh', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Maharashtra', 'West Bengal', 'Odisha'];
    const crops = ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 'Tomato', 'Onion'];
    const diseases = ['Nitrogen Deficiency', 'Leaf Rust', 'Pest Damage', 'Water Stress', 'Potassium Deficiency'];

    const name = names[index % names.length];
    const village = villages[index % villages.length];
    const district = districts[index % districts.length];
    const state = states[index % states.length];
    const crop = crops[index % crops.length];
    const disease = diseases[index % diseases.length];
    const aiFlagged = index % 3 === 0;
    const submittedAt = new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString();

    const reviewedAt = status === 'pending'
      ? undefined
      : new Date(new Date(submittedAt).getTime() + 4.2 * 60 * 60 * 1000).toISOString();

    return {
      id: `case_seed_${String(index + 1).padStart(3, '0')}`,
      farmerId: `farmer_seed_${String((index % 20) + 1).padStart(3, '0')}`,
      farmerName: name,
      farmerPhone: `+9198765${String(40000 + index).padStart(5, '0')}`,
      farmerLocation: {
        village,
        district,
        state,
        coordinates: {
          lat: 11.5 + (index % 10) * 0.25,
          lng: 76.1 + (index % 10) * 0.3,
        },
      },
      cropType: crop,
      issueDescription: aiFlagged
        ? `AI flagged low-confidence crop-health analysis for ${crop}. Officer review requested.`
        : `Farmer reported issue in ${crop} plot: ${disease.toLowerCase()} symptoms observed in the field.`,
      imageUrl: `/images/case-seed-${(index % 5) + 1}.jpg`,
      aiDiagnosis: aiFlagged
        ? {
            disease,
            confidence: 58 + (index % 18),
            recommendation: `Review ${disease.toLowerCase()} and confirm treatment plan within 24 hours.`,
          }
        : undefined,
      caseType: aiFlagged ? 'ai_flagged' : 'farmer_reported',
      severity: (['low', 'medium', 'high'] as const)[index % 3],
      status,
      submittedAt,
      reviewedAt,
      reviewerId: status === 'pending' ? undefined : 'officer_001',
      reviewerNotes: status === 'pending' ? undefined : (status === 'approved' ? 'Validated and sent to farmer.' : 'Needs clearer image and additional details.'),
      priority: (index % 5) + 1,
    };
  }

  initializeMockData(): void {
    const existingCases = localStorage.getItem(this.CASES_KEY);
    if (!existingCases) {
      const pendingCases = Array.from({ length: 12 }, (_, idx) => this.buildSeedCase(idx, 'pending'));
      const approvedCases = Array.from({ length: 28 }, (_, idx) => this.buildSeedCase(idx + 12, 'approved'));
      const rejectedCases = Array.from({ length: 5 }, (_, idx) => this.buildSeedCase(idx + 40, 'rejected'));

      const seededCases = [...pendingCases, ...approvedCases, ...rejectedCases];
      localStorage.setItem(this.CASES_KEY, JSON.stringify(seededCases));
    }

    const existingOfficers = localStorage.getItem(this.OFFICERS_KEY);
    if (!existingOfficers) {
      const mockOfficers: GovOfficer[] = [
        {
          id: 'officer_001',
          name: 'Dr. Rajesh Kumar',
          designation: 'Agricultural Officer',
          phone: '+919876543100',
          email: 'rajesh.kumar@agri.gov.in',
          district: 'Mysuru',
          state: 'Karnataka',
          password: '123456',
        }
      ];
      localStorage.setItem(this.OFFICERS_KEY, JSON.stringify(mockOfficers));
    }
  }

  getAllCases(): GovCase[] {
    this.initializeMockData();
    const cases = localStorage.getItem(this.CASES_KEY);
    return cases ? JSON.parse(cases) : [];
  }

  saveCases(cases: GovCase[]): void {
    localStorage.setItem(this.CASES_KEY, JSON.stringify(cases));
  }

  getCasesByStatus(status: 'pending' | 'approved' | 'rejected'): GovCase[] {
    return this.getAllCases().filter((caseItem) => caseItem.status === status);
  }

  getCaseById(id: string): GovCase | null {
    return this.getAllCases().find((caseItem) => caseItem.id === id) || null;
  }

  addCase(newCase: Omit<GovCase, 'id' | 'submittedAt'>): GovCase {
    const cases = this.getAllCases();
    const caseItem: GovCase = {
      ...newCase,
      id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      submittedAt: new Date().toISOString(),
    };

    cases.unshift(caseItem);
    this.saveCases(cases);
    return caseItem;
  }

  updateCaseStatus(caseId: string, status: 'approved' | 'rejected', reviewerNotes?: string): boolean {
    const cases = this.getAllCases();
    const caseIndex = cases.findIndex((caseItem) => caseItem.id === caseId);
    if (caseIndex === -1) return false;

    const officer = this.getCurrentOfficer();

    cases[caseIndex] = {
      ...cases[caseIndex],
      status,
      reviewedAt: new Date().toISOString(),
      reviewerId: officer?.id || 'officer_001',
      reviewerNotes,
    };

    this.saveCases(cases);
    return true;
  }

  getStats() {
    const cases = this.getAllCases();
    const pending = cases.filter((caseItem) => caseItem.status === 'pending');
    const approved = cases.filter((caseItem) => caseItem.status === 'approved');
    const rejected = cases.filter((caseItem) => caseItem.status === 'rejected');

    const reviewedCases = cases.filter((caseItem) => caseItem.reviewedAt);
    const avgResponseHours = reviewedCases.length
      ? reviewedCases.reduce((sum, caseItem) => {
          const submitted = new Date(caseItem.submittedAt).getTime();
          const reviewed = new Date(caseItem.reviewedAt as string).getTime();
          return sum + (reviewed - submitted) / (1000 * 60 * 60);
        }, 0) / reviewedCases.length
      : 0;

    return {
      totalCases: cases.length,
      pendingReview: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      avgResponseTime: `${avgResponseHours.toFixed(1)} hours`,
    };
  }

  private getOfficers(): GovOfficer[] {
    this.initializeMockData();
    const officers = localStorage.getItem(this.OFFICERS_KEY);
    return officers ? JSON.parse(officers) : [];
  }

  private saveOfficers(officers: GovOfficer[]): void {
    localStorage.setItem(this.OFFICERS_KEY, JSON.stringify(officers));
  }

  registerOfficer(officer: Omit<GovOfficer, 'id'>): GovOfficer {
    const officers = this.getOfficers();
    const newOfficer: GovOfficer = {
      ...officer,
      id: `officer_${Date.now()}`,
    };
    officers.push(newOfficer);
    this.saveOfficers(officers);
    this.setCurrentOfficer(newOfficer);
    return newOfficer;
  }

  loginOfficer(email: string, password: string): GovOfficer | null {
    const officers = this.getOfficers();
    const officer = officers.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!officer) return null;
    this.setCurrentOfficer(officer);
    return officer;
  }

  setCurrentOfficer(officer: GovOfficer): void {
    localStorage.setItem(this.CURRENT_OFFICER_KEY, JSON.stringify(officer));
  }

  logoutOfficer(): void {
    localStorage.removeItem(this.CURRENT_OFFICER_KEY);
  }

  getCurrentOfficer(): GovOfficer | null {
    this.initializeMockData();

    const stored = localStorage.getItem(this.CURRENT_OFFICER_KEY);
    if (stored) {
      return JSON.parse(stored) as GovOfficer;
    }

    const appUserRaw = localStorage.getItem('user');
    if (appUserRaw) {
      const appUser = JSON.parse(appUserRaw);
      if (appUser.userType === 'government') {
        const inferredOfficer: GovOfficer = {
          id: appUser.id || `officer_${Date.now()}`,
          name: appUser.name || 'Government Officer',
          designation: appUser.designation || 'Agricultural Officer',
          phone: appUser.phone || '+91',
          email: appUser.email || 'officer@agri.gov.in',
          district: appUser.district || 'Mysuru',
          state: appUser.state || 'Karnataka',
        };
        this.setCurrentOfficer(inferredOfficer);
        return inferredOfficer;
      }
    }

    const officers = this.getOfficers();
    if (officers.length > 0) {
      this.setCurrentOfficer(officers[0]);
      return officers[0];
    }

    return null;
  }

  getFarmerDirectory(): FarmerDirectoryEntry[] {
    const usersRaw = localStorage.getItem(this.USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    const allCases = this.getAllCases();

    const usersById = new Map<string, any>();
    users.forEach((user: any) => {
      if (user.userType !== 'government') {
        usersById.set(user.id, user);
      }
    });

    allCases.forEach((caseItem) => {
      if (!usersById.has(caseItem.farmerId)) {
        usersById.set(caseItem.farmerId, {
          id: caseItem.farmerId,
          name: caseItem.farmerName,
          phone: caseItem.farmerPhone,
          village: caseItem.farmerLocation.village,
          district: caseItem.farmerLocation.district,
          state: caseItem.farmerLocation.state,
          userType: 'landowner',
        });
      }
    });

    const landsRaw = localStorage.getItem('lands');
    const allLands = landsRaw ? JSON.parse(landsRaw) : [];

    const directory = Array.from(usersById.values()).map((user: any) => {
      const userCases = allCases.filter((caseItem) => caseItem.farmerId === user.id);
      const userLands = allLands.filter((land: any) => land.userId === user.id);

      return {
        id: user.id,
        name: user.name || 'Farmer',
        phone: user.phone || '+91',
        village: user.village || userCases[0]?.farmerLocation?.village || 'NA',
        district: user.district || userCases[0]?.farmerLocation?.district || 'NA',
        state: user.state || userCases[0]?.farmerLocation?.state || 'NA',
        landCount: userLands.length,
        cases: userCases,
        lands: userLands,
      } as FarmerDirectoryEntry;
    });

    return directory.sort((left, right) => left.name.localeCompare(right.name));
  }
}

export const governmentCasesService = new GovernmentCasesService();