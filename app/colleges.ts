export const COLLEGES = [
  { code: 'CAFENR', label: 'College of Agriculture, Food, Environment, and Natural Resources (CAFENR)' },
  { code: 'CAS', label: 'College of Arts and Sciences (CAS)' },
  { code: 'CCJ', label: 'College of Criminal Justice (CCJ)' },
  { code: 'CEMDS', label: 'College of Economics, Management, and Development Studies (CEMDS)' },
  { code: 'CED', label: 'College of Education (CED)' },
  { code: 'CEIT', label: 'College of Engineering and Information Technology (CEIT)' },
  { code: 'COM', label: 'College of Medicine (COM)' },
  { code: 'CON', label: 'College of Nursing (CON)' },
  { code: 'CSPEAR', label: 'College of Sports, Physical Education, and Recreation (CSPEAR)' },
  { code: 'CTHM', label: 'College of Tourism and Hospitality Management (CTHM)' },
  { code: 'CVMBS', label: 'College of Veterinary Medicine and Biomedical Sciences (CVMBS)' },
  { code: 'GS-OLC', label: 'Graduate School and Open Learning College (GS-OLC)' },
  { code: 'unknown', label: 'Unknown / Other' },
] as const;

export type College = typeof COLLEGES[number]['code'];
