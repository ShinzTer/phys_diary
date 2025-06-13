import { z } from "zod";

const commonFields = {
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Phone number must be in format: +375*********")
    .min(13, "Phone number must be 13 characters long")
    .max(13, "Phone number must be 13 characters long"),
  nationality: z.string().optional(),
  educationalDepartment: z.string().min(2, "Educational department is required"),
};

export const teacherProfileSchema = z.object({
  ...commonFields,
  position: z.string().min(2, "Position is required"),
});

export const studentProfileSchema = z.object({
  ...commonFields,
  gender: z.enum(["male", "female", "other"]),
  placeOfBirth: z.string().optional(),
  address: z.string().min(2, "Address is required"),
  schoolGraduated: z.string().optional(),
  medicalGroup: z.enum(["basic", "preparatory", "special"]),
  medicalDiagnosis: z.string().optional(),
  previousIllnesses: z.string().optional(),
  activeSports: z.string().optional(),
  previousSports: z.string().optional(),
  additionalInfo: z.string().optional(),
}); 