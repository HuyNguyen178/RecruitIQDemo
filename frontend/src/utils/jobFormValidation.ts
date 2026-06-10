export type JobFormValues = {
  title: string;
  department: string;
  cityId: number | '';
  jdText: string;
  requiredSkills: string;
  minExperienceYears: number;
  deadline: string;
  salary: string;
};

export function validateJobForm(
  data: JobFormValues,
  mode: 'create' | 'edit'
): string | null {
  if (!data.title?.trim()) {
    return 'Title is required.';
  }
  if (data.cityId === '' || data.cityId === null || data.cityId === undefined) {
    return 'Please select a city.';
  }
  if (!data.jdText?.trim()) {
    return 'Job description is required.';
  }
  if (!data.deadline) {
    return 'Application deadline is required.';
  }
  if (data.minExperienceYears < 0) {
    return 'Minimum experience years cannot be negative.';
  }
  if (data.minExperienceYears > 60) {
    return 'Minimum experience years cannot exceed 60.';
  }

  const today = new Date().toISOString().split('T')[0];
  if (mode === 'create' && data.deadline < today) {
    return 'Application deadline cannot be in the past.';
  }

  const salary = data.salary?.trim() ?? '';
  if (salary.startsWith('-')) {
    return 'Salary cannot be negative.';
  }
  if (/(^|\s)-\d/.test(salary)) {
    return 'Salary cannot contain negative amounts.';
  }

  return null;
}
