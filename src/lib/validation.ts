import { z } from 'zod';
import { COLLEGES } from '@/data/colleges';

const COLLEGE_IDS = new Set(COLLEGES.map((college) => college.id));

export const httpUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://') || value.startsWith('http://'), {
    message: 'url_must_be_http'
  });

export const startupSubmissionSchema = z.object({
  name: z.string().min(3).max(120),
  country: z.string().min(2).max(80).default('Algeria'),
  domain: z.string().min(2).max(80),
  subDomain: z.string().max(120).optional(),
  shortDescription: z.string().min(10).max(600),
  technology: z.string().min(3).max(300),
  yearFounded: z.coerce.number().int().min(1980).max(2030),
  officialSite: z.union([httpUrl, z.literal('')]).optional(),
  sourceUrl: z.union([httpUrl, z.literal('')]).optional(),
  whyRelevant: z.string().min(10).max(1000),
  priority: z.enum(['A', 'B', 'C']).default('C')
});

export const startupPatchSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected']).optional(),
  priority: z.enum(['A', 'B', 'C']).optional(),
  isDuplicate2025: z.boolean().optional()
});

export const translationUpsertSchema = z.object({
  startupId: z.string().min(1).max(120),
  locale: z.enum(['fr', 'ar']),
  name: z.string().trim().min(1).max(120),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  subDomain: z.string().trim().max(120).optional().or(z.literal('')),
  shortDescription: z.string().trim().min(1).max(600),
  technology: z.string().trim().min(1).max(300),
  whyRelevant: z.string().trim().min(1).max(1000)
});

export const translationDeleteSchema = z.object({
  startupId: z.string().min(1).max(120),
  locale: z.enum(['fr', 'ar'])
});

export const userCreateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  role: z.enum(['team', 'reviewer', 'admin']),
  teamDomain: z.string().max(80).optional().nullable(),
  password: z.string().min(8).max(200)
});

export const domainMetaPatchSchema = z.object({
  validationStatus: z.enum(['TO_CHECK', 'IN_PROGRESS', 'VALIDATED', 'REJECTED']),
  priorityTier: z.enum(['A', 'B', 'C']).nullable()
});

export const memberRegistrationSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(200),
    password: z.string().min(8).max(64),
    roleType: z.enum(['student', 'teacher']),
    collegeId: z.string().trim().min(1).max(80),
    specialty: z.string().trim().min(2).max(120),
    studentSerial: z.string().trim().max(40).optional().or(z.literal('')),
    studyYear: z.coerce.number().int().min(1).max(8).optional(),
    grade: z.string().trim().max(80).optional().or(z.literal(''))
  })
  .refine((data) => data.collegeId === 'other' || COLLEGE_IDS.has(data.collegeId), {
    path: ['collegeId'],
    message: 'unknown_college'
  })
  .refine((data) => data.roleType !== 'student' || (data.studentSerial ?? '').length >= 3, {
    path: ['studentSerial'],
    message: 'required'
  })
  .refine((data) => data.roleType !== 'student' || typeof data.studyYear === 'number', {
    path: ['studyYear'],
    message: 'required'
  })
  .refine((data) => data.roleType !== 'teacher' || (data.grade ?? '').length >= 2, {
    path: ['grade'],
    message: 'required'
  });

export const memberProfileSchema = z
  .object({
    roleType: z.enum(['student', 'teacher']),
    collegeId: z.string().trim().min(1).max(80),
    specialty: z.string().trim().max(120).optional().or(z.literal('')),
    studentSerial: z.string().trim().max(40).optional().or(z.literal('')),
    studyYear: z.coerce.number().int().min(1).max(8).optional(),
    grade: z.string().trim().max(80).optional().or(z.literal('')),
    digestOptIn: z.boolean().optional()
  })
  .refine((data) => data.collegeId === 'other' || COLLEGE_IDS.has(data.collegeId), {
    path: ['collegeId'],
    message: 'unknown_college'
  })
  .refine((data) => data.roleType !== 'student' || (data.studentSerial ?? '').length >= 3, {
    path: ['studentSerial'],
    message: 'required'
  })
  .refine((data) => data.roleType !== 'student' || typeof data.studyYear === 'number', {
    path: ['studyYear'],
    message: 'required'
  })
  .refine((data) => data.roleType !== 'teacher' || (data.grade ?? '').length >= 2, {
    path: ['grade'],
    message: 'required'
  });

export const teamQuotaPatchSchema = z.object({
  quota: z.coerce.number().int().min(0).max(100000)
});

export const importRowSchema = z.object({
  name: z.string().trim().min(3).max(120),
  country: z.string().trim().min(2).max(80).default('Algeria'),
  domain: z.string().trim().min(1).max(120),
  subDomain: z.string().trim().max(120).optional().or(z.literal('')),
  shortDescription: z.string().trim().min(10).max(600),
  technology: z.string().trim().max(300).default(''),
  yearFounded: z.coerce.number().int().min(1980).max(2030).nullable(),
  officialSite: z.string().trim().max(300).default(''),
  sourceUrl: z.string().trim().max(300).default(''),
  whyRelevant: z.string().trim().max(1000).default(''),
  priority: z.enum(['A', 'B', 'C']).default('C'),
  isDuplicate2025: z.boolean().default(false)
});

export const importBodySchema = z.object({
  rows: z
    .array(
      z.object({
        line: z.number().int().positive(),
        row: z.record(z.string(), z.unknown())
      })
    )
    .max(500)
    .min(1)
});

export type ImportRowInput = z.infer<typeof importRowSchema>;

export type StartupSubmissionInput = z.infer<typeof startupSubmissionSchema>;