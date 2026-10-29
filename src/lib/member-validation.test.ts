import { describe, it, expect } from 'vitest';
import { memberRegistrationSchema } from '@/lib/validation';

const student = {
  name: '  Amina   ',
  email: '  AMINA@Example.COM ',
  password: 'hunter2secure',
  roleType: 'student' as const,
  collegeId: 'other',
  specialty: 'Génie logiciel',
  studentSerial: '20231234',
  studyYear: '3'
};

describe('memberRegistrationSchema', () => {
  it('accepts a valid student registration', () => {
    const result = memberRegistrationSchema.safeParse(student);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Amina');
      expect(result.data.email).toBe('amina@example.com');
      expect(result.data.studyYear).toBe(3);
    }
  });

  it('accepts a valid teacher registration without a serial', () => {
    const result = memberRegistrationSchema.safeParse({
      name: 'Karim',
      email: 'karim@univ.dz',
      password: 'hunter2secure',
      roleType: 'teacher',
      collegeId: 'other',
      specialty: 'Électronique',
      grade: 'Maître de conférences'
    });
    expect(result.success).toBe(true);
  });

  it('rejects a student without a serial number', () => {
    expect(
      memberRegistrationSchema.safeParse({ ...student, studentSerial: '' }).success
    ).toBe(false);
  });

  it('rejects a student without a study year', () => {
    expect(
      memberRegistrationSchema.safeParse({ ...student, studyYear: undefined }).success
    ).toBe(false);
  });

  it('rejects an unknown college', () => {
    expect(
      memberRegistrationSchema.safeParse({ ...student, collegeId: 'not-a-college' }).success
    ).toBe(false);
  });

  it('rejects a teacher without a grade', () => {
    expect(
      memberRegistrationSchema.safeParse({
        ...student,
        roleType: 'teacher',
        studentSerial: '',
        grade: ''
      }).success
    ).toBe(false);
  });

  it('rejects a name that is too short', () => {
    expect(
      memberRegistrationSchema.safeParse({ ...student, name: 'A' }).success
    ).toBe(false);
  });

  it('rejects an invalid email', () => {
    expect(
      memberRegistrationSchema.safeParse({ ...student, email: 'not-an-email' }).success
    ).toBe(false);
  });

  it('rejects a password shorter than 8', () => {
    expect(
      memberRegistrationSchema.safeParse({ ...student, password: 'short11' }).success
    ).toBe(false);
  });
});
