import { z } from "zod";

const commonFields = {
  fullName: z.string().min(2, "ФИО должно быть не менее 2 символов"),
  dateOfBirth: z.string().min(1, "Дата рождения является обязательным"),
  phone: z.string()
    .regex(/^\+375\d{9}$/, "Номер телефона должен быть в формате: +375*********")
    .min(13, "Номер телефона должен состоять из 13 символов")
    .max(13, "Номер телефона должен состоять из 13 символов"),
  nationality: z.string().optional(),
  educationalDepartment: z.string().min(2, "Образовательное подразделение является обязательным"),
};

export const teacherProfileSchema = z.object({
  ...commonFields,
  position: z.string().min(2, "Должность является обязательной"),
});

export const studentProfileSchema = z.object({
  ...commonFields,
  gender: z.enum(["male", "female", "other"]),
  placeOfBirth: z.string().optional(),
  address: z.string().min(2, "Адрес является обязательным"),
  schoolGraduated: z.string().optional(),
  medicalGroup: z.enum(["basic", "preparatory", "special"]),
  medicalDiagnosis: z.string().optional(),
  previousIllnesses: z.string().optional(),
  activeSports: z.string().optional(),
  previousSports: z.string().optional(),
  additionalInfo: z.string().optional(),
}); 