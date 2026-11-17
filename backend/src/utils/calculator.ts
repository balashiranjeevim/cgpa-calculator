export interface SubjectGrade {
  credits: number;
  grade_point: number;
}

export interface SemesterCreditGpa {
  total_credits: number;
  sgpa: number;
}

/**
 * Calculates Semester Grade Point Average (SGPA)
 * SGPA = Σ (Credit × Grade Point) / Σ Credits
 */
export function calculateSGPA(subjects: SubjectGrade[]): { sgpa: number; totalCredits: number } {
  if (!subjects || subjects.length === 0) {
    return { sgpa: 0, totalCredits: 0 };
  }

  let totalCreditPoints = 0;
  let totalCredits = 0;

  for (const subject of subjects) {
    const cred = Number(subject.credits);
    const gp = Number(subject.grade_point);

    if (cred > 0) {
      totalCredits += cred;
      totalCreditPoints += cred * gp;
    }
  }

  if (totalCredits === 0) {
    return { sgpa: 0, totalCredits: 0 };
  }

  const rawSgpa = totalCreditPoints / totalCredits;
  const sgpa = Number(rawSgpa.toFixed(2));
  const roundedTotalCredits = Number(totalCredits.toFixed(2));

  return { sgpa, totalCredits: roundedTotalCredits };
}

/**
 * Calculates Cumulative Grade Point Average (CGPA)
 * CGPA = Σ (Semester Credits × Semester GPA) / Σ Semester Credits
 */
export function calculateCGPA(semesters: SemesterCreditGpa[]): {
  cgpa: number;
  totalCompletedCredits: number;
} {
  if (!semesters || semesters.length === 0) {
    return { cgpa: 0, totalCompletedCredits: 0 };
  }

  let sumWeightedPoints = 0;
  let totalCompletedCredits = 0;

  for (const sem of semesters) {
    const credits = Number(sem.total_credits);
    const sgpa = Number(sem.sgpa);

    if (credits > 0) {
      totalCompletedCredits += credits;
      sumWeightedPoints += credits * sgpa;
    }
  }

  if (totalCompletedCredits === 0) {
    return { cgpa: 0, totalCompletedCredits: 0 };
  }

  const rawCgpa = sumWeightedPoints / totalCompletedCredits;
  const cgpa = Number(rawCgpa.toFixed(2));
  const roundedCredits = Number(totalCompletedCredits.toFixed(2));

  return { cgpa, totalCompletedCredits: roundedCredits };
}
