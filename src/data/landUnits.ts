// Indian Land Measurement Units by State
export const landUnits = [
  {
    name: 'Acre',
    states: ['All States'],
    isCommon: true
  },
  {
    name: 'Hectare',
    states: ['All States'],
    isCommon: true
  },
  {
    name: 'Bigha',
    states: ['Rajasthan', 'UP', 'Bihar', 'MP', 'Assam', 'West Bengal', 'Himachal Pradesh', 'Jharkhand'],
    isCommon: true
  },
  {
    name: 'Biswa',
    states: ['Rajasthan', 'UP', 'MP', 'Delhi', 'Himachal Pradesh']
  },
  {
    name: 'Biswansi',
    states: ['Rajasthan', 'UP']
  },
  {
    name: 'Kattha (Katha/Cottah)',
    states: ['Bihar', 'Jharkhand', 'Assam', 'West Bengal']
  },
  {
    name: 'Dhur',
    states: ['Bihar', 'Jharkhand']
  },
  {
    name: 'Kanal',
    states: ['Punjab', 'Haryana', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh']
  },
  {
    name: 'Marla',
    states: ['Punjab', 'Haryana', 'Jammu & Kashmir']
  },
  {
    name: 'Guntha / Gunta',
    states: ['Maharashtra', 'Karnataka', 'Telangana', 'Gujarat', 'Goa']
  },
  {
    name: 'Cent',
    states: ['Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Puducherry']
  },
  {
    name: 'Ground',
    states: ['Tamil Nadu', 'Puducherry']
  },
  {
    name: 'Decimal',
    states: ['Odisha', 'Bihar', 'Jharkhand', 'West Bengal']
  },
  {
    name: 'Nali',
    states: ['Uttarakhand']
  },
  {
    name: 'Pari',
    states: ['Manipur']
  },
  {
    name: 'Kani',
    states: ['Tripura']
  },
  {
    name: 'Lessa',
    states: ['Assam']
  },
  {
    name: 'Are',
    states: ['Kerala']
  },
  {
    name: 'Thram',
    states: ['Sikkim']
  }
];

// Get units for a specific state
export function getUnitsForState(state: string): typeof landUnits {
  return landUnits.filter(unit => 
    unit.isCommon || 
    unit.states.includes(state) || 
    unit.states.includes('All States')
  );
}